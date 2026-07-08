import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/recruit/session'
import { bandForGradYear } from '@/lib/recruit/helpers'
import { deriveStrengths, buildSummary, QUESTIONNAIRE } from '@/lib/recruit/content'

export const dynamic = 'force-dynamic'

// Resolves the athlete profile the current session is allowed to act on.
// Athletes act on their own profile; parents get read access to their linked
// athlete; advisors pass an explicit athleteId.
async function resolveAthlete(athleteIdParam?: string | null) {
  const session = await getSession()
  if (!session) return { error: 'Not signed in', status: 401 } as const

  if (session.role === 'ADVISOR') {
    if (!athleteIdParam) return { error: 'athleteId required', status: 400 } as const
    const profile = await prisma.recProfile.findUnique({
      where: { id: athleteIdParam }, include: { user: true },
    })
    if (!profile) return { error: 'Athlete not found', status: 404 } as const
    return { session, profile, readOnly: false } as const
  }

  if (session.role === 'PARENT') {
    const parent = await prisma.recUser.findUnique({ where: { id: session.uid } })
    if (!parent?.athleteId) return { error: 'No linked athlete', status: 404 } as const
    const profile = await prisma.recProfile.findUnique({
      where: { id: parent.athleteId }, include: { user: true },
    })
    if (!profile) return { error: 'Athlete not found', status: 404 } as const
    return { session, profile, readOnly: true } as const
  }

  const profile = await prisma.recProfile.findUnique({
    where: { userId: session.uid }, include: { user: true },
  })
  if (!profile) return { error: 'Profile not found', status: 404 } as const
  return { session, profile, readOnly: false } as const
}

export async function GET(request: NextRequest) {
  const athleteIdParam = request.nextUrl.searchParams.get('athleteId')
  const resolved = await resolveAthlete(athleteIdParam)
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status })
  }
  const { profile, session, readOnly } = resolved
  const band = bandForGradYear(profile.gradYear)

  const [tasks, progress, modules, lessonProgress, schools, questionnaire, resume, notes, events] =
    await Promise.all([
      prisma.recTask.findMany({
        where: { OR: [{ athleteId: null }, { athleteId: profile.id }] },
        orderBy: [{ band: 'asc' }, { order: 'asc' }],
      }),
      prisma.recTaskProgress.findMany({ where: { athleteId: profile.id } }),
      prisma.recModule.findMany({
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' }, select: { id: true, moduleId: true, order: true, title: true, kind: true } } },
      }),
      prisma.recLessonProgress.findMany({ where: { athleteId: profile.id } }),
      prisma.recSchool.findMany({
        where: { athleteId: profile.id },
        orderBy: { updatedAt: 'desc' },
        include: { contacts: { orderBy: { date: 'desc' }, take: 5 } },
      }),
      prisma.recQuestionnaire.findUnique({ where: { athleteId: profile.id } }),
      prisma.recResume.findUnique({ where: { athleteId: profile.id } }),
      prisma.recNote.findMany({ where: { athleteId: profile.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.recEvent.findMany({
        where: { startDate: { gte: new Date(Date.now() - 86400000) } },
        orderBy: { startDate: 'asc' },
        take: 6,
      }),
    ])

  return NextResponse.json({
    role: session.role,
    readOnly,
    profile: { ...profile, user: { name: profile.user.name, email: profile.user.email } },
    band,
    tasks,
    progress,
    modules,
    lessonProgress,
    schools,
    questionnaire: questionnaire
      ? { answers: JSON.parse(questionnaire.answers || '{}'), completedAt: questionnaire.completedAt }
      : { answers: {}, completedAt: null },
    resume: resume
      ? { content: JSON.parse(resume.content || '{}'), status: resume.status, advisorComment: resume.advisorComment }
      : null,
    notes,
    events,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const resolved = await resolveAthlete(body.athleteId)
  if ('error' in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status })
  }
  const { profile, readOnly } = resolved
  if (readOnly) {
    return NextResponse.json({ error: 'Parent accounts are view-only' }, { status: 403 })
  }
  const action = body.action as string

  try {
    if (action === 'toggleTask') {
      const existing = await prisma.recTaskProgress.findUnique({
        where: { athleteId_taskId: { athleteId: profile.id, taskId: body.taskId } },
      })
      const completed = existing ? !existing.completed : true
      await prisma.recTaskProgress.upsert({
        where: { athleteId_taskId: { athleteId: profile.id, taskId: body.taskId } },
        create: { athleteId: profile.id, taskId: body.taskId, completed, completedAt: completed ? new Date() : null },
        update: { completed, completedAt: completed ? new Date() : null },
      })
      return NextResponse.json({ ok: true, completed })
    }

    if (action === 'toggleLesson') {
      const existing = await prisma.recLessonProgress.findUnique({
        where: { athleteId_lessonId: { athleteId: profile.id, lessonId: body.lessonId } },
      })
      const completed = existing ? !existing.completed : true
      await prisma.recLessonProgress.upsert({
        where: { athleteId_lessonId: { athleteId: profile.id, lessonId: body.lessonId } },
        create: { athleteId: profile.id, lessonId: body.lessonId, completed, completedAt: completed ? new Date() : null },
        update: { completed, completedAt: completed ? new Date() : null },
      })
      return NextResponse.json({ ok: true, completed })
    }

    if (action === 'saveSchool') {
      const s = body.school || {}
      const data = {
        name: String(s.name || '').trim(),
        division: String(s.division || ''),
        conference: String(s.conference || ''),
        coachName: String(s.coachName || ''),
        coachEmail: String(s.coachEmail || ''),
        coachTwitter: String(s.coachTwitter || ''),
        category: String(s.category || 'TARGET'),
        stage: String(s.stage || 'RESEARCHING'),
        notes: String(s.notes || ''),
      }
      if (!data.name) return NextResponse.json({ error: 'School name is required' }, { status: 400 })
      const school = s.id
        ? await prisma.recSchool.update({ where: { id: s.id, athleteId: profile.id }, data })
        : await prisma.recSchool.create({ data: { ...data, athleteId: profile.id } })
      return NextResponse.json({ ok: true, school })
    }

    if (action === 'deleteSchool') {
      await prisma.recSchool.delete({ where: { id: body.schoolId, athleteId: profile.id } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'addContact') {
      const school = await prisma.recSchool.findFirst({
        where: { id: body.schoolId, athleteId: profile.id },
      })
      if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })
      const contact = await prisma.recContact.create({
        data: {
          schoolId: school.id,
          type: String(body.type || 'NOTE'),
          summary: String(body.summary || '').trim(),
          date: body.date ? new Date(body.date) : new Date(),
        },
      })
      // Auto-advance stage on first meaningful touchpoints
      const advance: Record<string, string> = { EMAIL_SENT: 'CONTACTED', REPLY: 'CONVERSATION', VISIT: 'VISIT_PLANNED' }
      const target = advance[contact.type]
      const order = ['RESEARCHING', 'CONTACTED', 'CONVERSATION', 'VISIT_PLANNED', 'OFFER', 'COMMITTED']
      if (target && order.indexOf(target) > order.indexOf(school.stage)) {
        await prisma.recSchool.update({ where: { id: school.id }, data: { stage: target } })
      }
      return NextResponse.json({ ok: true, contact })
    }

    if (action === 'saveQuestionnaire') {
      const answers = body.answers || {}
      const answered = QUESTIONNAIRE.filter((q) => {
        const a = answers[q.id]
        return Array.isArray(a) ? a.length > 0 : Boolean(a && String(a).trim())
      }).length
      const complete = answered >= QUESTIONNAIRE.length - 1 // text questions optional-ish
      await prisma.recQuestionnaire.upsert({
        where: { athleteId: profile.id },
        create: { athleteId: profile.id, answers: JSON.stringify(answers), completedAt: complete ? new Date() : null },
        update: { answers: JSON.stringify(answers), completedAt: complete ? new Date() : null },
      })
      const strengths = deriveStrengths(answers)
      const summary = buildSummary(profile.user.name, profile.position, strengths, answers)
      await prisma.recProfile.update({
        where: { id: profile.id },
        data: { strengths: JSON.stringify(strengths), summary },
      })
      return NextResponse.json({ ok: true, strengths, summary, complete })
    }

    if (action === 'saveProfile') {
      const p = body.profile || {}
      const updated = await prisma.recProfile.update({
        where: { id: profile.id },
        data: {
          position: String(p.position ?? profile.position),
          clubTeam: String(p.clubTeam ?? profile.clubTeam),
          highSchool: String(p.highSchool ?? profile.highSchool),
          city: String(p.city ?? profile.city),
          state: String(p.state ?? profile.state),
          gpa: String(p.gpa ?? profile.gpa),
          height: String(p.height ?? profile.height),
          jerseyNumber: String(p.jerseyNumber ?? profile.jerseyNumber),
          ncaaRegistered: Boolean(p.ncaaRegistered ?? profile.ncaaRegistered),
          highlightUrl: String(p.highlightUrl ?? profile.highlightUrl),
          academics: String(p.academics ?? profile.academics),
          honors: String(p.honors ?? profile.honors),
          refs: String(p.refs ?? profile.refs),
          upcoming: String(p.upcoming ?? profile.upcoming),
          isPublic: Boolean(p.isPublic ?? profile.isPublic),
          gradYear: p.gradYear ? parseInt(p.gradYear, 10) : profile.gradYear,
        },
      })
      return NextResponse.json({ ok: true, profile: updated })
    }

    if (action === 'saveResume') {
      const content = body.content || {}
      const submit = Boolean(body.submit)
      const resume = await prisma.recResume.upsert({
        where: { athleteId: profile.id },
        create: {
          athleteId: profile.id,
          content: JSON.stringify(content),
          status: submit ? 'SUBMITTED' : 'DRAFT',
        },
        update: {
          content: JSON.stringify(content),
          status: submit ? 'SUBMITTED' : undefined,
        },
      })
      return NextResponse.json({ ok: true, status: resume.status })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[recruit/data]', action, msg)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
