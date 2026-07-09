import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { ensureTables, seedContent, tablesExist, realAdvisorCount } from '@/lib/recruit/bootstrap'
import { createToken, sessionCookie } from '@/lib/recruit/session'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    const initialized = await tablesExist()
    let hasAdvisor = false
    if (initialized) {
      hasAdvisor = (await realAdvisorCount()) > 0
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

    const advisorCount = await realAdvisorCount()
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
