import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const milestones = await prisma.milestone.findMany({
      orderBy: { order: 'asc' },
      include: {
        progress: {
          where: { userId },
          select: { completed: true, completedAt: true },
        },
      },
    })

    return NextResponse.json(milestones)
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { milestoneId, completed } = await request.json()

    const existing = await prisma.milestoneProgress.findUnique({
      where: {
        userId_milestoneId: { userId, milestoneId },
      },
    })

    let progress

    if (existing) {
      progress = await prisma.milestoneProgress.update({
        where: {
          userId_milestoneId: { userId, milestoneId },
        },
        data: {
          completed,
          completedAt: completed ? new Date() : null,
        },
      })
    } else {
      progress = await prisma.milestoneProgress.create({
        data: {
          userId,
          milestoneId,
          completed,
          completedAt: completed ? new Date() : null,
        },
      })
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Error updating milestone:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
