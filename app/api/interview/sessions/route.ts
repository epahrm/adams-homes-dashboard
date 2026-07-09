import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTables, isAdmin, COMPETENCIES, DIVISIONS, MANAGERS } from '@/lib/interview-db'
import { defaultNotification, sendCandidateNotification } from '@/lib/interview-email'

export const dynamic = 'force-dynamic'

// Live group interview day (Round 1 guide): Monday sessions with 3 breakout
// slots (9:00 / 9:15 / 9:30, 15 min, 2 candidates each). All managers share
// one scoring surface; the dashboard polls GET ?id= every few seconds so
// scores sync in near-real-time without websockets (Vercel serverless).

// DATE columns come back as server-local-midnight Date objects; format in
// local time so the calendar date never shifts across timezones.
function dateOnly(d: unknown): string {
  if (d instanceof Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return String(d).slice(0, 10)
}

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
  const evals = await pool.query(
    `SELECT candidate_id, manager, recommendation, strengths, improve
     FROM vi_live_evals WHERE session_id = $1`,
    [id]
  )
  const row = s.rows[0]
  return {
    id: Number(row.id),
    sessionDate: dateOnly(row.session_date),
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
    evaluations: evals.rows.map((ev) => ({
      candidateId: Number(ev.candidate_id),
      manager: ev.manager,
      recommendation: ev.recommendation,
      strengths: ev.strengths,
      improve: ev.improve,
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
        sessionDate: dateOnly(row.session_date),
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
  let body: Record<string, unknown> & { op?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  try {
    await ensureTables()
    const op = String(body.op || '')

    if (op === 'create') {
      const date = String(body.sessionDate || '').slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'sessionDate (YYYY-MM-DD) required' }, { status: 400 })
      }
      const r = await pool.query(
        `INSERT INTO vi_sessions (session_date, teams_url) VALUES ($1, $2)
         ON CONFLICT (session_date) DO NOTHING RETURNING id`,
        [date, String(body.teamsUrl || '').trim()]
      )
      if (r.rows.length === 0) {
        return NextResponse.json({ error: 'An interview day already exists for that date' }, { status: 409 })
      }
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
        const status = String(body.status)
        if (!['scheduled', 'live', 'completed'].includes(status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }
        sets.push(`status = $${i++}`)
        vals.push(status)
        if (status === 'live') sets.push(`started_at = now()`)
      }
      if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
      sets.push('updated_at = now()')
      vals.push(sessionId)
      await pool.query(`UPDATE vi_sessions SET ${sets.join(', ')} WHERE id = $${i}`, vals)
      const detail = await sessionDetail(sessionId)
      if (!detail) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      return NextResponse.json({ session: detail })
    }

    if (op === 'assign') {
      const candidateId = Number(body.candidateId)
      const slot = Number(body.slot)
      if (!candidateId || ![1, 2, 3].includes(slot)) {
        return NextResponse.json({ error: 'candidateId and slot (1-3) required' }, { status: 400 })
      }
      const exists = await pool.query(
        `SELECT (SELECT COUNT(*)::int FROM vi_sessions WHERE id = $1) AS s,
                (SELECT COUNT(*)::int FROM vi_candidates WHERE id = $2) AS c`,
        [sessionId, candidateId]
      )
      if (!exists.rows[0].s) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      if (!exists.rows[0].c) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
      // Conditional insert enforces the 2-per-slot cap in one statement, so
      // concurrent managers cannot overfill a session.
      const ins = await pool.query(
        `INSERT INTO vi_session_assignments (session_id, slot, candidate_id)
         SELECT $1, $2, $3
         WHERE (SELECT COUNT(*) FROM vi_session_assignments
                WHERE session_id = $1 AND slot = $2 AND candidate_id != $3) < 2
         ON CONFLICT (session_id, candidate_id) DO UPDATE SET slot = EXCLUDED.slot
         RETURNING id`,
        [sessionId, slot, candidateId]
      )
      if (ins.rows.length === 0) {
        return NextResponse.json({ error: 'That session already has 2 candidates' }, { status: 409 })
      }
      await pool.query(
        `UPDATE vi_candidates SET status = 'scheduled', updated_at = now()
         WHERE id = $1 AND status IN ('applied', 'video_complete', 'under_review')`,
        [candidateId]
      )
      // Send pre-interview email with preparation instructions and manager contact info
      const cand = await pool.query('SELECT * FROM vi_candidates WHERE id = $1', [candidateId])
      const sess = await pool.query('SELECT * FROM vi_sessions WHERE id = $1', [sessionId])
      if (cand.rows.length > 0 && sess.rows.length > 0) {
        const c = cand.rows[0]
        const s = sess.rows[0]
        const sessionDate = `${s.session_date.getFullYear()}-${String(s.session_date.getMonth() + 1).padStart(2, '0')}-${String(s.session_date.getDate()).padStart(2, '0')}`
        const divisionInfo = DIVISIONS.find((d) => d.code === c.division)
        const divisionName = divisionInfo?.name || c.division
        const manager = MANAGERS.find((m) => m.division === c.division)
        const n = defaultNotification('scheduled', c.name, divisionName, {
          sessionDate,
          teamsUrl: s.teams_url || undefined,
          managerName: manager?.name,
          managerEmail: manager?.email,
        })
        sendCandidateNotification(
          c.email,
          n.subject,
          n.html,
          n.text
        ).catch(() => {})
      }
      return NextResponse.json({ session: await sessionDetail(sessionId) })
    }

    if (op === 'unassign') {
      const candidateId = Number(body.candidateId)
      await pool.query(
        `DELETE FROM vi_session_assignments WHERE session_id = $1 AND candidate_id = $2`,
        [sessionId, candidateId]
      )
      // Revert a forward-only 'scheduled' status when the candidate no
      // longer sits in any session (assign moved them forward; removal
      // should not leave a scheduled candidate with no session).
      await pool.query(
        `UPDATE vi_candidates c
         SET status = CASE
           WHEN EXISTS (
             SELECT 1 FROM vi_responses r
             JOIN vi_questions q ON q.id = r.question_id AND q.active = TRUE
             WHERE r.candidate_id = c.id AND r.upload_state = 'complete'
             HAVING COUNT(*) >= (SELECT COUNT(*) FROM vi_questions WHERE active = TRUE)
           ) THEN 'video_complete' ELSE 'applied' END,
           updated_at = now()
         WHERE c.id = $1 AND c.status = 'scheduled'
           AND NOT EXISTS (SELECT 1 FROM vi_session_assignments a WHERE a.candidate_id = c.id)`,
        [candidateId]
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

    if (op === 'evaluate') {
      const candidateId = Number(body.candidateId)
      const manager = String(body.manager || '').trim()
      const recommendation = String(body.recommendation || '')
      if (!candidateId || !manager) {
        return NextResponse.json({ error: 'candidateId and manager required' }, { status: 400 })
      }
      if (!['hire', 'maybe', 'no'].includes(recommendation)) {
        return NextResponse.json({ error: 'recommendation must be hire, maybe or no' }, { status: 400 })
      }
      await pool.query(
        `INSERT INTO vi_live_evals (session_id, candidate_id, manager, recommendation, strengths, improve)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (session_id, candidate_id, manager) DO UPDATE SET
           recommendation = EXCLUDED.recommendation,
           strengths = EXCLUDED.strengths,
           improve = EXCLUDED.improve,
           updated_at = now()`,
        [sessionId, candidateId, manager, recommendation,
         String(body.strengths || '').slice(0, 2000), String(body.improve || '').slice(0, 2000)]
      )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown op' }, { status: 400 })
  } catch (e) {
    if (typeof e === 'object' && e && (e as { code?: string }).code === '23503') {
      // Foreign-key violation: the referenced session/candidate is gone.
      return NextResponse.json({ error: 'Session or candidate not found' }, { status: 404 })
    }
    console.error('[interview] POST sessions failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
