import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { createToken, sessionCookie, clearedSessionCookie, getSession } from '@/lib/recruit/session'
import { slugify } from '@/lib/recruit/helpers'

export const dynamic = 'force-dynamic'

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name)
  let slug = base
  let n = 1
  while (await prisma.recProfile.findUnique({ where: { slug } })) {
    slug = `${base}-${++n}`
  }
  return slug
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })
  const user = await prisma.recUser.findUnique({
    where: { id: session.uid },
    select: { id: true, email: true, name: true, role: true, athleteId: true },
  })
  return NextResponse.json({ user })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action as string

    if (action === 'logout') {
      const res = NextResponse.json({ ok: true })
      res.cookies.set(clearedSessionCookie())
      return res
    }

    const email = String(body.email || '').toLowerCase().trim()
    const password = String(body.password || '')
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (action === 'login') {
      const user = await prisma.recUser.findUnique({ where: { email } })
      if (!user || !(await verifyPassword(password, user.password))) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      const res = NextResponse.json({
        user: { id: user.id, name: user.name, role: user.role },
      })
      res.cookies.set(sessionCookie(createToken(user.id, user.role as any)))
      return res
    }

    if (action === 'signup') {
      const role = body.role === 'PARENT' ? 'PARENT' : 'ATHLETE'
      const name = String(body.name || '').trim()
      if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }
      const existing = await prisma.recUser.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
      }

      if (role === 'ATHLETE') {
        const gradYear = parseInt(body.gradYear, 10)
        const thisYear = new Date().getFullYear()
        if (!gradYear || gradYear < thisYear || gradYear > thisYear + 10) {
          return NextResponse.json({ error: 'Please select a valid graduation year' }, { status: 400 })
        }
        const user = await prisma.recUser.create({
          data: {
            email,
            password: await hashPassword(password),
            name,
            role,
            profile: {
              create: {
                slug: await uniqueSlug(name),
                gradYear,
                position: String(body.position || ''),
                clubTeam: String(body.clubTeam || ''),
                highSchool: String(body.highSchool || ''),
              },
            },
          },
        })
        const res = NextResponse.json({ user: { id: user.id, name, role } })
        res.cookies.set(sessionCookie(createToken(user.id, 'ATHLETE')))
        return res
      }

      // PARENT: must link to an existing athlete by email
      const athleteEmail = String(body.athleteEmail || '').toLowerCase().trim()
      const athleteUser = await prisma.recUser.findUnique({
        where: { email: athleteEmail },
        include: { profile: true },
      })
      if (!athleteUser?.profile) {
        return NextResponse.json(
          { error: 'No athlete account found with that email. Have your athlete sign up first.' },
          { status: 400 }
        )
      }
      const user = await prisma.recUser.create({
        data: {
          email,
          password: await hashPassword(password),
          name,
          role,
          athleteId: athleteUser.profile.id,
        },
      })
      const res = NextResponse.json({ user: { id: user.id, name, role } })
      res.cookies.set(sessionCookie(createToken(user.id, 'PARENT')))
      return res
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[recruit/auth]', msg)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
