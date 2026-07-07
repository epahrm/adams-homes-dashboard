import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTables, isAdmin, COMPETENCIES } from '@/lib/interview-db'

export const dynamic = 'force-dynamic'

// Manager scoring: one row per (candidate, manager, competency), 1-5 scale,
// evidence sentence required — mirrors the Smartsheet scoring form from the
// spec. Re-submitting overwrites the manager's prior score (calibration
// corrections welcome).
export async function POST(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const candidateId = Number(body.candidateId)
    const manager = String(body.manager || '').trim()
    const entries = Array.isArray(body.scores) ? body.scores : []
    if (!candidateId || !manager || entries.length === 0) {
      return NextResponse.json(
        { error: 'candidateId, manager and scores[] are required' },
        { status: 400 }
      )
    }
    await ensureTables()
    const validKeys = COMPETENCIES.map((c) => c.key)
    for (const entry of entries) {
      const competency = String(entry.competency || '')
      const score = Number(entry.score)
      const evidence = String(entry.evidence || '').trim()
      if (!validKeys.includes(competency as (typeof validKeys)[number])) {
        return NextResponse.json({ error: `Unknown competency: ${competency}` }, { status: 400 })
      }
      if (!(score >= 1 && score <= 5)) {
        return NextResponse.json({ error: 'Scores must be 1-5' }, { status: 400 })
      }
      if (evidence.length < 10) {
        return NextResponse.json(
          { error: `Evidence required for ${competency} (one sentence of proof)` },
          { status: 400 }
        )
      }
      await pool.query(
        `INSERT INTO vi_scores (candidate_id, manager, competency, score, evidence)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (candidate_id, manager, competency) DO UPDATE SET
           score = EXCLUDED.score, evidence = EXCLUDED.evidence, updated_at = now()`,
        [candidateId, manager, competency, score, evidence]
      )
    }
    // First score moves the candidate into review.
    await pool.query(
      `UPDATE vi_candidates SET status = 'under_review', updated_at = now()
       WHERE id = $1 AND status IN ('applied', 'video_complete')`,
      [candidateId]
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[interview] POST scores failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
