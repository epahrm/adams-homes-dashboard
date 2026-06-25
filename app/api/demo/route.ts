import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    })

    if (existingUser) {
      return NextResponse.json({
        message: 'Demo user already exists',
        email: 'demo@example.com',
        password: 'password123',
      })
    }

    const hashedPassword = await hashPassword('password123')
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        password: hashedPassword,
        name: 'Demo User',
        division: 'Austin, TX',
      },
    })

    return NextResponse.json({
      message: 'Demo user created successfully',
      email: demoUser.email,
      password: 'password123',
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
