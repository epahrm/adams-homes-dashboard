import { NextRequest, NextResponse } from 'next/server'
import {
  pool,
  ensureTables,
  isAdmin,
  COMPETENCIES,
  APP_QUESTIONS,
  DIVISIONS,
  MANAGERS,
  SCORE_ANCHORS,
  ADVANCEMENT,
  SESSION_SLOTS,
} from '@/lib/interview-db'

export const dynamic = 'force-dynamic'

// Public: active interview questions (used by interview.html and live.html)
// plus the shared constants the front-end pages need.
export async function GET() {
  try {
    await ensureTables()
    const result = await pool.query(
      'SELECT * FROM vi_questions WHERE active = TRUE ORDER BY ord ASC'
    )
    return NextResponse.json({
      questions: result.rows.map((q) => ({
        id: Number(q.id),
        ord: q.ord,
        competency: q.competency,
        text: q.text,
        listenFor: q.listen_for,
        prepSeconds: q.prep_seconds,
        answerSeconds: q.answer_seconds,
      })),
      competencies: COMPETENCIES,
      divisions: DIVISIONS,
      appQuestions: APP_QUESTIONS,
      managers: MANAGERS,
      scoreAnchors: SCORE_ANCHORS,
      advancement: ADVANCEMENT,
      sessionSlots: SESSION_SLOTS,
    })
  } catch (e) {
    console.error('[interview] GET questions failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

// Admin: edit a question's text/timing or toggle active.
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await ensureTables()
    const sets: string[] = []
    const vals: unknown[] = []
    let i = 1
    if (typeof body.text === 'string' && body.text.trim()) {
      sets.push(`text = $${i++}`)
      vals.push(body.text.trim())
    }
    if (body.prepSeconds !== undefined) {
      sets.push(`prep_seconds = $${i++}`)
      vals.push(Math.max(5, Math.min(300, Number(body.prepSeconds) || 30)))
    }
    if (body.answerSeconds !== undefined) {
      sets.push(`answer_seconds = $${i++}`)
      vals.push(Math.max(15, Math.min(300, Number(body.answerSeconds) || 90)))
    }
    if (body.active !== undefined) {
      sets.push(`active = $${i++}`)
      vals.push(body.active === true)
    }
    if (sets.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }
    vals.push(id)
    const result = await pool.query(
      `UPDATE vi_questions SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      vals
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[interview] PATCH question failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
