import { NextRequest, NextResponse } from 'next/server'
import {
  pool,
  ensureTables,
  isAdmin,
  newToken,
  DIVISIONS,
  CANDIDATE_STATUSES,
  DECLINE_REASONS,
  REFERRAL_SOURCES,
  APP_QUESTIONS,
} from '@/lib/interview-db'
import { defaultNotification, sendCandidateNotification, NotifyKind } from '@/lib/interview-email'

export const dynamic = 'force-dynamic'

type CandidateRow = {
  id: string
  token: string
  name: string
  email: string
  phone: string
  division: string
  referral_source: string
  status: string
  decline_reason: string | null
  data: Record<string, unknown>
  flags: string[]
  created_at: string
  updated_at: string
}

function toCandidate(row: CandidateRow, admin: boolean) {
  return {
    id: Number(row.id),
    ...(admin ? { token: row.token } : {}),
    name: row.name,
    email: admin ? row.email : undefined,
    phone: admin ? row.phone : undefined,
    division: row.division,
    referralSource: row.referral_source,
    status: row.status,
    declineReason: row.decline_reason,
    ...(admin ? { data: row.data, flags: row.flags } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Auto-vetting: flag anything HR should double-check before interview day.
function computeFlags(body: Record<string, unknown>): string[] {
  const flags: string[] = []
  if (body.hasLicense !== true) {
    flags.push('No Florida real estate license yet')
  }
  const noProfile = ['linkedin', 'instagram', 'facebook'].every(
    (k) => !String(body[k] || '').trim() || /^n\/?a$/i.test(String(body[k]).trim())
  )
  if (noProfile) flags.push('No professional/social profiles provided')
  const answers = Array.isArray(body.appAnswers) ? body.appAnswers : []
  const thin = answers.filter((a) => String(a || '').trim().length < 15).length
  if (answers.length < APP_QUESTIONS.length || thin > 5) {
    flags.push('Application answers are thin — review before scheduling')
  }
  return flags
}

// Admin: full pipeline list with response/score rollups.
export async function GET(request: NextRequest) {
  const admin = isAdmin(request.headers.get('x-admin-key'))
  try {
    await ensureTables()
    // Candidate self-lookup by interview token (used by interview.html).
    const token = request.nextUrl.searchParams.get('token')
    if (token) {
      const r = await pool.query('SELECT * FROM vi_candidates WHERE token = $1', [token])
      if (r.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid interview link' }, { status: 404 })
      }
      const row = r.rows[0] as CandidateRow
      const done = await pool.query(
        `SELECT question_id FROM vi_responses WHERE candidate_id = $1 AND upload_state = 'complete'`,
        [row.id]
      )
      return NextResponse.json({
        candidate: {
          id: Number(row.id),
          name: row.name,
          division: row.division,
          status: row.status,
          answeredQuestionIds: done.rows.map((d) => Number(d.question_id)),
        },
      })
    }

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const result = await pool.query('SELECT * FROM vi_candidates ORDER BY created_at DESC')
    const responses = await pool.query(
      `SELECT candidate_id, COUNT(*)::int AS n FROM vi_responses WHERE upload_state = 'complete' GROUP BY candidate_id`
    )
    const scores = await pool.query(
      `SELECT candidate_id, manager, competency, score, evidence FROM vi_scores`
    )
    const liveScores = await pool.query(
      `SELECT candidate_id, manager, competency, score FROM vi_live_scores`
    )
    const respByCand: Record<string, number> = {}
    for (const r of responses.rows) respByCand[r.candidate_id] = r.n
    const scoresByCand: Record<string, unknown[]> = {}
    for (const s of scores.rows) {
      const k = String(s.candidate_id)
      if (!scoresByCand[k]) scoresByCand[k] = []
      scoresByCand[k].push({
        manager: s.manager,
        competency: s.competency,
        score: s.score,
        evidence: s.evidence,
        kind: 'video',
      })
    }
    for (const s of liveScores.rows) {
      const k = String(s.candidate_id)
      if (!scoresByCand[k]) scoresByCand[k] = []
      scoresByCand[k].push({
        manager: s.manager,
        competency: s.competency,
        score: s.score,
        evidence: '',
        kind: 'live',
      })
    }
    return NextResponse.json({
      candidates: result.rows.map((row: CandidateRow) => ({
        ...toCandidate(row, true),
        videosComplete: respByCand[row.id] || 0,
        scores: scoresByCand[row.id] || [],
      })),
    })
  } catch (e) {
    console.error('[interview] GET candidates failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

// Public: candidate application from the careers page (final prototype:
// personal info + FL license + 20 questions, then socials + resume link).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = `${String(body.firstName || '').trim()} ${String(body.lastName || '').trim()}`.trim() ||
      String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const division = String(body.division || '').trim().toUpperCase()
    if (!name || !/.+@.+\..+/.test(email)) {
      return NextResponse.json({ error: 'Name and a valid email are required' }, { status: 400 })
    }
    if (!DIVISIONS.some((d) => d.code === division)) {
      return NextResponse.json({ error: 'Please choose an office' }, { status: 400 })
    }
    const referral = REFERRAL_SOURCES.includes(body.referralSource)
      ? body.referralSource
      : 'other'

    await ensureTables()
    const data = {
      hasLicense: body.hasLicense === true,
      linkedin: String(body.linkedin || '').trim(),
      instagram: String(body.instagram || '').trim(),
      facebook: String(body.facebook || '').trim(),
      resumeUrl: String(body.resumeUrl || '').trim(),
      appAnswers: Array.isArray(body.appAnswers)
        ? body.appAnswers.slice(0, APP_QUESTIONS.length).map((a: unknown) => String(a || ''))
        : [],
    }
    const flags = computeFlags(body)
    const token = newToken()
    const result = await pool.query(
      `INSERT INTO vi_candidates (token, name, email, phone, division, referral_source, data, flags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        token,
        name,
        email,
        String(body.phone || '').trim(),
        division,
        referral,
        JSON.stringify(data),
        JSON.stringify(flags),
      ]
    )
    return NextResponse.json(
      { candidate: toCandidate(result.rows[0], false), interviewToken: token },
      { status: 201 }
    )
  } catch (e: unknown) {
    if (typeof e === 'object' && e && (e as { code?: string }).code === '23505') {
      return NextResponse.json(
        { error: 'An application with this email already exists. Check your inbox for your interview link.' },
        { status: 409 }
      )
    }
    console.error('[interview] POST candidate failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

// Admin: status transitions, decline reasons, offer details, flag edits.
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
    if (body.status !== undefined) {
      if (!CANDIDATE_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      sets.push(`status = $${i++}`)
      vals.push(body.status)
    }
    if (body.declineReason !== undefined) {
      if (body.declineReason !== null && !DECLINE_REASONS.includes(body.declineReason)) {
        return NextResponse.json({ error: 'Invalid decline reason' }, { status: 400 })
      }
      sets.push(`decline_reason = $${i++}`)
      vals.push(body.declineReason)
    }
    if (body.flags !== undefined && Array.isArray(body.flags)) {
      sets.push(`flags = $${i++}`)
      vals.push(JSON.stringify(body.flags.map((f: unknown) => String(f))))
    }
    // Merge decision details (offer commission/start date, pool note,
    // internal notes) into data.
    if (body.dataPatch && typeof body.dataPatch === 'object') {
      sets.push(`data = data || $${i++}::jsonb`)
      vals.push(JSON.stringify(body.dataPatch))
    }
    if (sets.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }
    sets.push(`updated_at = now()`)
    vals.push(id)
    const result = await pool.query(
      `UPDATE vi_candidates SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      vals
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const updated = result.rows[0] as CandidateRow

    // Optional candidate notification on round transitions
    // ("notify them if they make it to the next round or if we've eliminated them").
    let notified = false
    const notifiable: Record<string, NotifyKind> = {
      advanced: 'advanced',
      declined: 'declined',
      offer_sent: 'offer_sent',
      pooled: 'pooled',
      scheduled: 'scheduled',
    }
    if (body.notify === true && body.status && notifiable[body.status]) {
      const divName =
        DIVISIONS.find((d) => d.code === updated.division)?.name || updated.division
      const n = defaultNotification(notifiable[body.status], updated.name, divName, {
        offer: (updated.data as { offer?: { commission?: string; startDate?: string } }).offer,
        sessionDate: body.sessionDate,
      })
      notified = await sendCandidateNotification(updated.email, n.subject, n.html, n.text)
      // Record the decision in the candidate's chat thread either way, so
      // they see it on their interview page even if email is unconfigured.
      await pool.query(
        `INSERT INTO vi_messages (candidate_id, sender, body, read_by_admin)
         VALUES ($1, 'system', $2, TRUE)`,
        [updated.id, n.text]
      )
    }
    return NextResponse.json({ candidate: toCandidate(updated, true), notified })
  } catch (e) {
    console.error('[interview] PATCH candidate failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
