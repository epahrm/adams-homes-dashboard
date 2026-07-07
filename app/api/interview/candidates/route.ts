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
  PRE_INTERVIEW_QUESTIONS,
} from '@/lib/interview-db'

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
  if (!String(body.linkedinUrl || '').trim()) flags.push('No LinkedIn profile provided')
  if (!String(body.resumeUrl || '').trim()) flags.push('No resume link provided')
  const answers = Array.isArray(body.preInterviewAnswers) ? body.preInterviewAnswers : []
  if (answers.length < PRE_INTERVIEW_QUESTIONS.length || answers.some((a) => String(a || '').trim().length < 25)) {
    flags.push('Pre-interview questionnaire answers are thin')
  }
  if (String(body.licenseNumber || '').trim() === '' && body.hasLicense === true) {
    flags.push('Claims license but no license number given')
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

// Public: candidate application from the careers page.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const division = String(body.division || '').trim().toUpperCase()
    if (!name || !email || !/.+@.+\..+/.test(email)) {
      return NextResponse.json({ error: 'Name and a valid email are required' }, { status: 400 })
    }
    if (!DIVISIONS.some((d) => d.code === division)) {
      return NextResponse.json({ error: 'Please choose an office/division' }, { status: 400 })
    }
    const referral = REFERRAL_SOURCES.includes(body.referralSource)
      ? body.referralSource
      : 'other'

    await ensureTables()
    const data = {
      linkedinUrl: String(body.linkedinUrl || '').trim(),
      resumeUrl: String(body.resumeUrl || '').trim(),
      socialHandles: String(body.socialHandles || '').trim(),
      hasLicense: body.hasLicense === true,
      licenseNumber: String(body.licenseNumber || '').trim(),
      yearsSalesExperience: Number(body.yearsSalesExperience) || 0,
      preInterviewAnswers: Array.isArray(body.preInterviewAnswers)
        ? body.preInterviewAnswers.slice(0, PRE_INTERVIEW_QUESTIONS.length).map((a: unknown) => String(a || ''))
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

// Admin: status transitions, decline reasons, flag edits.
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
    return NextResponse.json({ candidate: toCandidate(result.rows[0], true) })
  } catch (e) {
    console.error('[interview] PATCH candidate failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
