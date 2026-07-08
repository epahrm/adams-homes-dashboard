import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

// Minimal signed-cookie session for the recruiting platform.
// Kept separate from the Adams Homes auth so the two products never mix.

const COOKIE = 'rec_session'
const MAX_AGE_S = 60 * 60 * 24 * 30 // 30 days

export interface RecSession {
  uid: string
  role: 'ATHLETE' | 'PARENT' | 'ADVISOR'
  exp: number
}

function secret(): string {
  return (
    process.env.RECRUIT_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'rec-dev-secret-change-me'
  )
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function createToken(uid: string, role: RecSession['role']): string {
  const payload = Buffer.from(
    JSON.stringify({ uid, role, exp: Date.now() + MAX_AGE_S * 1000 })
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifyToken(token: string | undefined): RecSession | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot < 1) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as RecSession
    if (!data.uid || !data.role || Date.now() > data.exp) return null
    return data
  } catch {
    return null
  }
}

export async function getSession(): Promise<RecSession | null> {
  const store = await cookies()
  return verifyToken(store.get(COOKIE)?.value)
}

export function sessionCookie(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_S,
  }
}

export function clearedSessionCookie() {
  return { ...sessionCookie(''), maxAge: 0 }
}
