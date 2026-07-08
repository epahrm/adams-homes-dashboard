import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { RECRUIT_DDL, RECRUIT_FKS } from '@/lib/recruit/schema-sql'
import { STANDARD_TASKS, MODULES } from '@/lib/recruit/seed-content'
import { createToken, sessionCookie } from '@/lib/recruit/session'

export const dynamic = 'force-dynamic'

async function tablesExist(): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM information_schema.tables
    WHERE table_name = 'RecUser'`
  return rows.length > 0 && Number(rows[0].count) > 0
}

async function ensureTables() {
  for (const sql of [...RECRUIT_DDL, ...RECRUIT_FKS]) {
    await prisma.$executeRawUnsafe(sql)
  }
}

async function seedContent() {
  const taskCount = await prisma.recTask.count({ where: { athleteId: null } })
  if (taskCount === 0) {
    let order = 0
    for (const t of STANDARD_TASKS) {
      await prisma.recTask.create({
        data: { band: t.band, order: order++, title: t.title, detail: t.detail, source: 'STANDARD' },
      })
    }
  }
  const moduleCount = await prisma.recModule.count()
  if (moduleCount === 0) {
    let mOrder = 0
    for (const m of MODULES) {
      await prisma.recModule.create({
        data: {
          slug: m.slug,
          order: mOrder++,
          title: m.title,
          description: m.description,
          band: m.band,
          lessons: {
            create: m.lessons.map((l, i) => ({
              order: i, title: l.title, kind: l.kind, content: l.content,
            })),
          },
        },
      })
    }
  }
}

export async function GET() {
  try {
    const initialized = await tablesExist()
    let hasAdvisor = false
    if (initialized) {
      hasAdvisor = (await prisma.recUser.count({ where: { role: 'ADVISOR' } })) > 0
    }
    return NextResponse.json({ initialized, hasAdvisor })
  } catch (e) {
    return NextResponse.json({ initialized: false, hasAdvisor: false })
  }
}

// One-time initialization: creates tables, seeds standard content, and creates
// the first (and only self-registerable) advisor account.
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    await ensureTables()

    const advisorCount = await prisma.recUser.count({ where: { role: 'ADVISOR' } })
    if (advisorCount > 0) {
      return NextResponse.json(
        { error: 'Setup has already been completed. Sign in instead.' },
        { status: 403 }
      )
    }

    await seedContent()

    const advisor = await prisma.recUser.create({
      data: {
        email: String(email).toLowerCase().trim(),
        password: await hashPassword(password),
        name: String(name).trim(),
        role: 'ADVISOR',
      },
    })

    const res = NextResponse.json({ ok: true, id: advisor.id })
    res.cookies.set(sessionCookie(createToken(advisor.id, 'ADVISOR')))
    return res
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[recruit/setup]', msg)
    return NextResponse.json({ error: 'Setup failed', details: msg }, { status: 500 })
  }
}
