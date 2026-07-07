import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTables, isAdmin } from '@/lib/interview-db'

export const dynamic = 'force-dynamic'

// Two-way chat between candidates and the hiring team. Candidates
// authenticate with their interview token; the hiring team with the admin
// key. 'system' messages record pipeline events (advanced/declined/offer)
// so each thread doubles as an audit trail.

async function candidateByToken(token: string | null) {
  if (!token) return null
  const r = await pool.query('SELECT * FROM vi_candidates WHERE token = $1', [token])
  return r.rows[0] || null
}

function toMessage(row: {
  id: string
  candidate_id: string
  sender: string
  body: string
  read_by_admin: boolean
  read_by_candidate: boolean
  created_at: string
}) {
  return {
    id: Number(row.id),
    candidateId: Number(row.candidate_id),
    sender: row.sender,
    body: row.body,
    readByAdmin: row.read_by_admin,
    readByCandidate: row.read_by_candidate,
    createdAt: row.created_at,
  }
}

// GET ?token=...            -> candidate's own thread (marks admin msgs read)
// GET ?candidateId=... (admin) -> that candidate's thread (marks candidate msgs read)
// GET with admin key, no candidateId -> unread counts per candidate
export async function GET(request: NextRequest) {
  try {
    await ensureTables()
    const p = request.nextUrl.searchParams
    const admin = isAdmin(p.get('key') || request.headers.get('x-admin-key'))

    if (!admin) {
      const cand = await candidateByToken(p.get('token'))
      if (!cand) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const r = await pool.query(
        'SELECT * FROM vi_messages WHERE candidate_id = $1 ORDER BY created_at ASC',
        [cand.id]
      )
      await pool.query(
        `UPDATE vi_messages SET read_by_candidate = TRUE WHERE candidate_id = $1 AND sender != 'candidate'`,
        [cand.id]
      )
      return NextResponse.json({ messages: r.rows.map(toMessage) })
    }

    const candidateId = Number(p.get('candidateId'))
    if (candidateId) {
      const r = await pool.query(
        'SELECT * FROM vi_messages WHERE candidate_id = $1 ORDER BY created_at ASC',
        [candidateId]
      )
      await pool.query(
        `UPDATE vi_messages SET read_by_admin = TRUE WHERE candidate_id = $1 AND sender = 'candidate'`,
        [candidateId]
      )
      return NextResponse.json({ messages: r.rows.map(toMessage) })
    }
    const r = await pool.query(
      `SELECT candidate_id, COUNT(*)::int AS unread
       FROM vi_messages WHERE sender = 'candidate' AND read_by_admin = FALSE
       GROUP BY candidate_id`
    )
    const unread: Record<string, number> = {}
    for (const row of r.rows) unread[String(row.candidate_id)] = row.unread
    return NextResponse.json({ unread })
  } catch (e) {
    console.error('[interview] GET messages failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

// POST { token, body } (candidate) or { candidateId, body } + admin key.
export async function POST(request: NextRequest) {
  try {
    await ensureTables()
    const payload = await request.json()
    const body = String(payload.body || '').trim().slice(0, 4000)
    if (!body) return NextResponse.json({ error: 'Message body required' }, { status: 400 })

    const admin = isAdmin(request.headers.get('x-admin-key'))
    let candidateId: number
    let sender: 'candidate' | 'admin'
    if (admin) {
      candidateId = Number(payload.candidateId)
      sender = 'admin'
      if (!candidateId) return NextResponse.json({ error: 'candidateId required' }, { status: 400 })
    } else {
      const cand = await candidateByToken(payload.token)
      if (!cand) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      candidateId = Number(cand.id)
      sender = 'candidate'
    }
    const r = await pool.query(
      `INSERT INTO vi_messages (candidate_id, sender, body, read_by_admin, read_by_candidate)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [candidateId, sender, body, sender === 'admin', sender === 'candidate']
    )
    return NextResponse.json({ message: toMessage(r.rows[0]) }, { status: 201 })
  } catch (e) {
    console.error('[interview] POST message failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
