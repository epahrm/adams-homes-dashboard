import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTables, isAdmin, COMPETENCIES } from '@/lib/interview-db'

export const dynamic = 'force-dynamic'

// Live group interview day (Round 1 guide): Monday sessions with 3 breakout
// slots (9:00 / 9:15 / 9:30, 15 min, 2 candidates each). All managers share
// one scoring surface; the dashboard polls GET ?id= every few seconds so
// scores sync in near-real-time without websockets (Vercel serverless).

async function sessionDetail(id: number) {
  const s = await pool.query('SELECT * FROM vi_sessions WHERE id = $1', [id])
  if (s.rows.length === 0) return null
  const assignments = await pool.query(
    `SELECT a.id, a.slot, a.candidate_id, c.name, c.division, c.status
     FROM vi_session_assignments a JOIN vi_candidates c ON c.id = a.candidate_id
     WHERE a.session_id = $1 ORDER BY a.slot, a.id`,
    [id]
  )
  const scores = await pool.query(
    `SELECT candidate_id, manager, competency, score, note, updated_at
     FROM vi_live_scores WHERE session_id = $1`,
    [id]
  )
  const row = s.rows[0]
  return {
    id: Number(row.id),
    sessionDate: row.session_date,
    teamsUrl: row.teams_url,
    status: row.status,
    startedAt: row.started_at,
    notes: row.notes,
    assignments: assignments.rows.map((a) => ({
      id: Number(a.id),
      slot: a.slot,
      candidateId: Number(a.candidate_id),
      name: a.name,
      division: a.division,
      status: a.status,
    })),
    scores: scores.rows.map((sc) => ({
      candidateId: Number(sc.candidate_id),
      manager: sc.manager,
      competency: sc.competency,
      score: sc.score,
      note: sc.note,
      updatedAt: sc.updated_at,
    })),
  }
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request.nextUrl.searchParams.get('key') || request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureTables()
    const id = Number(request.nextUrl.searchParams.get('id'))
    if (id) {
      const detail = await sessionDetail(id)
      if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ session: detail })
    }
    const result = await pool.query(
      `SELECT s.*, COUNT(a.id)::int AS candidate_count
       FROM vi_sessions s LEFT JOIN vi_session_assignments a ON a.session_id = s.id
       GROUP BY s.id ORDER BY s.session_date DESC`
    )
    return NextResponse.json({
      sessions: result.rows.map((row) => ({
        id: Number(row.id),
        sessionDate: row.session_date,
        teamsUrl: row.teams_url,
        status: row.status,
        candidateCount: row.candidate_count,
      })),
    })
  } catch (e) {
    console.error('[interview] GET sessions failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

// Create a session, assign/unassign candidates, submit live scores,
// start/complete the session — dispatched on body.op.
export async function POST(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureTables()
    const body = await request.json()
    const op = String(body.op || '')

    if (op === 'create') {
      const date = String(body.sessionDate || '').slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'sessionDate (YYYY-MM-DD) required' }, { status: 400 })
      }
      const r = await pool.query(
        `INSERT INTO vi_sessions (session_date, teams_url) VALUES ($1, $2) RETURNING id`,
        [date, String(body.teamsUrl || '').trim()]
      )
      return NextResponse.json({ session: await sessionDetail(Number(r.rows[0].id)) }, { status: 201 })
    }

    const sessionId = Number(body.sessionId)
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    if (op === 'update') {
      const sets: string[] = []
      const vals: unknown[] = []
      let i = 1
      if (body.teamsUrl !== undefined) { sets.push(`teams_url = $${i++}`); vals.push(String(body.teamsUrl).trim()) }
      if (body.notes !== undefined) { sets.push(`notes = $${i++}`); vals.push(String(body.notes)) }
      if (body.status !== undefined) {
        if (!['scheduled', 'live', 'completed'].includes(body.status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }
        sets.push(`status = $${i++}`)
        vals.push(body.status)
        if (body.status === 'live') sets.push(`started_at = now()`)
      }
      if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
      sets.push('updated_at = now()')
      vals.push(sessionId)
      await pool.query(`UPDATE vi_sessions SET ${sets.join(', ')} WHERE id = $${i}`, vals)
      return NextResponse.json({ session: await sessionDetail(sessionId) })
    }

    if (op === 'assign') {
      const candidateId = Number(body.candidateId)
      const slot = Number(body.slot)
      if (!candidateId || ![1, 2, 3].includes(slot)) {
        return NextResponse.json({ error: 'candidateId and slot (1-3) required' }, { status: 400 })
      }
      const count = await pool.query(
        `SELECT COUNT(*)::int AS n FROM vi_session_assignments
         WHERE session_id = $1 AND slot = $2 AND candidate_id != $3`,
        [sessionId, slot, candidateId]
      )
      if (count.rows[0].n >= 2) {
        return NextResponse.json({ error: 'That session already has 2 candidates' }, { status: 409 })
      }
      await pool.query(
        `INSERT INTO vi_session_assignments (session_id, slot, candidate_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (session_id, candidate_id) DO UPDATE SET slot = EXCLUDED.slot`,
        [sessionId, slot, candidateId]
      )
      await pool.query(
        `UPDATE vi_candidates SET status = 'scheduled', updated_at = now()
         WHERE id = $1 AND status IN ('applied', 'video_complete', 'under_review')`,
        [candidateId]
      )
      return NextResponse.json({ session: await sessionDetail(sessionId) })
    }

    if (op === 'unassign') {
      const candidateId = Number(body.candidateId)
      await pool.query(
        `DELETE FROM vi_session_assignments WHERE session_id = $1 AND candidate_id = $2`,
        [sessionId, candidateId]
      )
      return NextResponse.json({ session: await sessionDetail(sessionId) })
    }

    if (op === 'score') {
      const candidateId = Number(body.candidateId)
      const manager = String(body.manager || '').trim()
      const competency = String(body.competency || '')
      const score = Number(body.score)
      if (!candidateId || !manager) {
        return NextResponse.json({ error: 'candidateId and manager required' }, { status: 400 })
      }
      if (!COMPETENCIES.some((c) => c.key === competency)) {
        return NextResponse.json({ error: 'Unknown competency' }, { status: 400 })
      }
      if (!(score >= 1 && score <= 5)) {
        return NextResponse.json({ error: 'Score must be 1-5' }, { status: 400 })
      }
      await pool.query(
        `INSERT INTO vi_live_scores (session_id, candidate_id, manager, competency, score, note)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (session_id, candidate_id, manager, competency)
         DO UPDATE SET score = EXCLUDED.score, note = EXCLUDED.note, updated_at = now()`,
        [sessionId, candidateId, manager, competency, score, String(body.note || '')]
      )
      await pool.query(
        `UPDATE vi_candidates SET status = 'under_review', updated_at = now()
         WHERE id = $1 AND status = 'scheduled'`,
        [candidateId]
      )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown op' }, { status: 400 })
  } catch (e) {
    console.error('[interview] POST sessions failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
