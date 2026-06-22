import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name, division, hireDate, userType = 'user' } = await request.json()

    if (action === 'signup') {
      if (userType === 'admin') {
        return NextResponse.json(
          { error: 'Admin accounts cannot be self-registered' },
          { status: 403 }
        )
      }
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        )
      }

      const hashedPassword = await hashPassword(password)
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          division: division || '',
          hireDate: hireDate ? new Date(hireDate) : null,
        },
      })

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
      })
    }

    if (action === 'login') {
      if (userType === 'admin') {
        const admin = await prisma.admin.findUnique({
          where: { email },
        })

        if (!admin) {
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          )
        }

        const isValidPassword = await verifyPassword(password, admin.password)

        if (!isValidPassword) {
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          )
        }

        return NextResponse.json({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          userType: 'admin',
        })
      } else {
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          )
        }

        const isValidPassword = await verifyPassword(password, user.password)

        if (!isValidPassword) {
          return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          )
        }

        return NextResponse.json({
          id: user.id,
          email: user.email,
          name: user.name,
          division: user.division,
          userType: 'user',
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
