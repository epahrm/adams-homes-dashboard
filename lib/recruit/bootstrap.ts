import { prisma } from '@/lib/db'
import { RECRUIT_DDL, RECRUIT_FKS } from '@/lib/recruit/schema-sql'
import { STANDARD_TASKS, MODULES } from '@/lib/recruit/seed-content'

// Demo accounts (tour mode) use this domain; they are excluded from the
// "has an advisor been set up yet" check and clearly labeled in the UI.
export const DEMO_DOMAIN = '@demo.cleats'

export async function tablesExist(): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM information_schema.tables
    WHERE table_name = 'RecUser'`
  return rows.length > 0 && Number(rows[0].count) > 0
}

export async function ensureTables() {
  for (const sql of [...RECRUIT_DDL, ...RECRUIT_FKS]) {
    await prisma.$executeRawUnsafe(sql)
  }
}

export async function seedContent() {
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

export async function realAdvisorCount(): Promise<number> {
  return prisma.recUser.count({
    where: { role: 'ADVISOR', NOT: { email: { endsWith: DEMO_DOMAIN } } },
  })
}
