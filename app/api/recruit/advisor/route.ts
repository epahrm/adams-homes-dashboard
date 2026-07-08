import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/recruit/session'
import { bandForGradYear, keyDates, daysUntil } from '@/lib/recruit/helpers'

export const dynamic = 'force-dynamic'

async function requireAdvisor() {
  const session = await getSession()
  if (!session || session.role !== 'ADVISOR') return null
  return session
}

export async function GET() {
  const session = await requireAdvisor()
  if (!session) return NextResponse.json({ error: 'Advisor access only' }, { status: 403 })

  const profiles = await prisma.recProfile.findMany({
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      taskProgress: true,
      schools: { select: { stage: true, updatedAt: true, contacts: { orderBy: { date: 'desc' }, take: 1, select: { date: true, type: true } } } },
      resume: { select: { status: true, updatedAt: true } },
      questionnaire: { select: { completedAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const standardTasks = await prisma.recTask.findMany({ where: { athleteId: null } })
  const byBand: Record<string, number> = {}
  for (const t of standardTasks) byBand[t.band] = (byBand[t.band] || 0) + 1

  const now = new Date()
  const roster = profiles.map((p) => {
    const band = bandForGradYear(p.gradYear, now)
    const bandTaskIds = new Set(
      standardTasks.filter((t) => t.band === band).map((t) => t.id)
    )
    const doneInBand = p.taskProgress.filter((tp) => tp.completed && bandTaskIds.has(tp.taskId)).length
    const totalInBand = bandTaskIds.size
    const lastContactDates = p.schools
      .flatMap((s) => s.contacts.map((c) => new Date(c.date).getTime()))
    const lastOutreach = lastContactDates.length ? new Date(Math.max(...lastContactDates)) : null
    const daysSinceOutreach = lastOutreach
      ? Math.floor((now.getTime() - lastOutreach.getTime()) / 86400000)
      : null

    const alerts: string[] = []
    if (p.resume?.status === 'SUBMITTED') alerts.push('Résumé awaiting your review')
    if ((band === 'GRADE_11' || band === 'GRADE_12') && (daysSinceOutreach === null || daysSinceOutreach > 21)) {
      alerts.push(daysSinceOutreach === null ? 'No coach outreach logged yet' : `No coach outreach in ${daysSinceOutreach} days`)
    }
    if (!p.questionnaire?.completedAt) alerts.push('Strengths questionnaire not completed')
    if (band !== 'PRE_HS' && band !== 'GRADE_9_10' && !p.ncaaRegistered) alerts.push('NCAA Eligibility Center not registered')

    const upcoming = keyDates(p.gradYear)
      .map((k) => ({ ...k, days: daysUntil(k.date, now) }))
      .filter((k) => k.days >= 0 && k.days <= 60)

    return {
      id: p.id,
      name: p.user.name,
      email: p.user.email,
      gradYear: p.gradYear,
      band,
      position: p.position,
      clubTeam: p.clubTeam,
      slug: p.slug,
      planDone: doneInBand,
      planTotal: totalInBand,
      schoolCount: p.schools.length,
      stageSummary: p.schools.reduce<Record<string, number>>((acc, s) => {
        acc[s.stage] = (acc[s.stage] || 0) + 1
        return acc
      }, {}),
      resumeStatus: p.resume?.status || 'NONE',
      daysSinceOutreach,
      alerts,
      upcomingKeyDates: upcoming.map((k) => ({ label: k.label, days: k.days })),
    }
  })

  return NextResponse.json({ roster })
}

export async function POST(request: NextRequest) {
  const session = await requireAdvisor()
  if (!session) return NextResponse.json({ error: 'Advisor access only' }, { status: 403 })

  try {
    const body = await request.json()
    const action = body.action as string

    if (action === 'addTask') {
      const athleteId = String(body.athleteId || '')
      const profile = await prisma.recProfile.findUnique({ where: { id: athleteId } })
      if (!profile) return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
      const band = body.band || bandForGradYear(profile.gradYear)
      const max = await prisma.recTask.aggregate({
        where: { band }, _max: { order: true },
      })
      const task = await prisma.recTask.create({
        data: {
          band,
          order: (max._max.order ?? 0) + 1,
          title: String(body.title || '').trim(),
          detail: String(body.detail || '').trim(),
          source: 'ADVISOR',
          athleteId,
        },
      })
      return NextResponse.json({ ok: true, task })
    }

    if (action === 'removeTask') {
      // Advisors can only remove their custom tasks, not the standard plan
      await prisma.recTask.delete({
        where: { id: String(body.taskId), source: 'ADVISOR' },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === 'addNote') {
      const note = await prisma.recNote.create({
        data: {
          athleteId: String(body.athleteId),
          authorRole: 'ADVISOR',
          body: String(body.body || '').trim(),
        },
      })
      return NextResponse.json({ ok: true, note })
    }

    if (action === 'reviewResume') {
      const decision = body.decision === 'approve' ? 'APPROVED' : 'DRAFT'
      const resume = await prisma.recResume.update({
        where: { athleteId: String(body.athleteId) },
        data: {
          status: decision,
          advisorComment: String(body.comment || ''),
        },
      })
      return NextResponse.json({ ok: true, status: resume.status })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[recruit/advisor]', msg)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
