import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { ensureTables, seedContent, DEMO_DOMAIN } from '@/lib/recruit/bootstrap'
import { createToken, sessionCookie } from '@/lib/recruit/session'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Tour mode: signs the visitor into a pre-filled demo account so they can
// explore every screen without registering. Demo accounts are shared,
// clearly labeled, and have no password.

const ATHLETE_EMAIL = `demo-athlete${DEMO_DOMAIN}`
const PARENT_EMAIL = `demo-parent${DEMO_DOMAIN}`
const ADVISOR_EMAIL = `demo-advisor${DEMO_DOMAIN}`

async function demoPassword() {
  return hashPassword(randomBytes(24).toString('hex'))
}

async function ensureDemoData() {
  const { tablesExist } = await import('@/lib/recruit/bootstrap')
  if (!(await tablesExist())) await ensureTables()
  await seedContent()

  let advisor = await prisma.recUser.findUnique({ where: { email: ADVISOR_EMAIL } })
  if (!advisor) {
    advisor = await prisma.recUser.create({
      data: { email: ADVISOR_EMAIL, password: await demoPassword(), name: 'Demo Advisor', role: 'ADVISOR' },
    })
  }

  let athlete = await prisma.recUser.findUnique({
    where: { email: ATHLETE_EMAIL },
    include: { profile: true },
  })
  if (!athlete?.profile) {
    const user = await prisma.recUser.create({
      data: {
        email: ATHLETE_EMAIL,
        password: await demoPassword(),
        name: 'Mia Torres',
        role: 'ATHLETE',
        profile: {
          create: {
            slug: 'demo-mia-torres',
            gradYear: new Date().getFullYear() + 2,
            position: 'Central midfielder',
            clubTeam: 'Space Coast United (ECNL)',
            highSchool: 'Merritt Island High',
            city: 'Merritt Island',
            state: 'FL',
            gpa: '3.9 (weighted)',
            height: `5'6"`,
            jerseyNumber: '10',
            ncaaRegistered: true,
            summary: 'Vocal central midfielder and playmaker with a high soccer IQ; resets team energy when the game turns. Honor-roll student who leads on and off the field.',
            strengths: JSON.stringify(['Playmaker', 'Vision & final pass', 'High soccer IQ', 'Vocal leader', 'Student first']),
            academics: '3.9 weighted GPA · 4 AP courses · intended major: sports medicine',
            honors: 'All-conference honorable mention\nHonor roll (4 semesters)\nYouth coach volunteer, local rec league',
            upcoming: 'ECNL Florida Showcase · July 18–20 · Field 7, #10 in navy',
          },
        },
      },
      include: { profile: true },
    })
    athlete = user
    const profileId = user.profile!.id

    // A believable snapshot: some plan progress, target schools with a
    // contact history, a submitted résumé, and a note from the advisor.
    const band11 = await prisma.recTask.findMany({
      where: { athleteId: null, band: 'GRADE_11' },
      orderBy: { order: 'asc' },
      take: 3,
    })
    for (const t of band11) {
      await prisma.recTaskProgress.create({
        data: { athleteId: profileId, taskId: t.id, completed: true, completedAt: new Date() },
      })
    }
    const firstModule = await prisma.recModule.findFirst({
      orderBy: { order: 'asc' },
      include: { lessons: { orderBy: { order: 'asc' }, take: 4 } },
    })
    for (const l of firstModule?.lessons ?? []) {
      await prisma.recLessonProgress.create({
        data: { athleteId: profileId, lessonId: l.id, completed: true, completedAt: new Date() },
      })
    }

    const unf = await prisma.recSchool.create({
      data: {
        athleteId: profileId, name: 'University of North Florida', division: 'D1',
        coachName: 'Z. Vosec', category: 'TARGET', stage: 'CONVERSATION',
      },
    })
    await prisma.recContact.create({
      data: { schoolId: unf.id, type: 'REPLY', summary: 'Coach replied — wants junior season schedule' },
    })
    const fgcu = await prisma.recSchool.create({
      data: {
        athleteId: profileId, name: 'Florida Gulf Coast University', division: 'D1',
        category: 'TARGET', stage: 'CONTACTED',
      },
    })
    await prisma.recContact.create({
      data: { schoolId: fgcu.id, type: 'EMAIL_SENT', summary: 'Sent intro email with highlight reel' },
    })
    await prisma.recSchool.create({
      data: { athleteId: profileId, name: 'Rollins College', division: 'D2', category: 'SAFETY', stage: 'RESEARCHING' },
    })

    await prisma.recQuestionnaire.create({
      data: {
        athleteId: profileId,
        completedAt: new Date(),
        answers: JSON.stringify({
          position: 'Attacking / Central midfielder',
          onfield: 'Vision & final pass',
          locker: 'I speak up and reset the energy',
          workethic: 'First to arrive, last to leave',
          coachable: 'Ask questions until I understand the fix',
          role: 'Become a captain / culture-setter',
          student: 'Honor roll — academics are a strength',
          offfield: ['Academic honors', 'Community service / volunteering'],
          dream: 'Play D1 in Florida while studying sports medicine',
        }),
      },
    })
    await prisma.recResume.create({
      data: {
        athleteId: profileId,
        status: 'SUBMITTED',
        content: JSON.stringify({
          summary: 'Vocal central midfielder and playmaker with a high soccer IQ. Honor-roll student who leads on and off the field.',
          experience: 'Space Coast United (ECNL) — starting CM, 9G/14A last season\nMerritt Island High — varsity since 9th grade',
          academics: '3.9 weighted GPA · 4 AP courses · NCAA Eligibility Center registered',
          honors: 'All-conference honorable mention\nHonor roll (4 semesters)',
        }),
      },
    })
    await prisma.recNote.create({
      data: {
        athleteId: profileId,
        body: 'Great weekend! UNF replied — let’s finalize your visit shortlist on Thursday’s call. ⚽',
      },
    })
  }

  const parent = await prisma.recUser.findUnique({ where: { email: PARENT_EMAIL } })
  if (!parent) {
    await prisma.recUser.create({
      data: {
        email: PARENT_EMAIL,
        password: await demoPassword(),
        name: 'Ana Torres',
        role: 'PARENT',
        athleteId: athlete.profile!.id,
      },
    })
  }

  const eventCount = await prisma.recEvent.count()
  if (eventCount === 0) {
    const y = new Date()
    await prisma.recEvent.create({
      data: {
        title: 'ECNL Florida Showcase', kind: 'SHOWCASE', location: 'Lakewood Ranch, FL',
        startDate: new Date(y.getFullYear(), y.getMonth(), y.getDate() + 9),
        endDate: new Date(y.getFullYear(), y.getMonth(), y.getDate() + 11),
        notes: 'Coaches from 14 of our target schools attending',
      },
    })
    await prisma.recEvent.create({
      data: {
        title: 'College ID Camp — North Florida', kind: 'ID_CAMP', location: 'Jacksonville, FL',
        startDate: new Date(y.getFullYear(), y.getMonth(), y.getDate() + 17),
      },
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json()
    await ensureDemoData()
    const email =
      role === 'ADVISOR' ? ADVISOR_EMAIL : role === 'PARENT' ? PARENT_EMAIL : ATHLETE_EMAIL
    const user = await prisma.recUser.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Demo unavailable' }, { status: 500 })
    const res = NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } })
    res.cookies.set(sessionCookie(createToken(user.id, user.role as any)))
    return res
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[recruit/demo]', msg)
    // Surfacing the underlying error while the platform is pre-launch;
    // swap back to a generic message before real families use this page.
    return NextResponse.json(
      { error: `Could not start the demo — ${msg.slice(0, 300)}` },
      { status: 500 }
    )
  }
}
