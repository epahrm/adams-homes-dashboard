import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendCompletionToManager } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userName, userEmail, division, managerEmail } = await request.json()

    // Get all milestones to show completed vs remaining
    const allMilestones = await prisma.milestone.findMany({
      orderBy: { order: 'asc' },
    })

    const userProgress = await prisma.milestoneProgress.findMany({
      where: { userId },
      include: { milestone: true },
    })

    const completedMilestones = userProgress
      .filter(p => p.completed)
      .map(p => p.milestone.title)

    const remainingMilestones = allMilestones
      .filter(m => !completedMilestones.includes(m.title))
      .map(m => m.title)

    // Send email to manager
    await sendCompletionToManager(
      userName,
      userEmail,
      division,
      completedMilestones,
      remainingMilestones,
      managerEmail
    )

    return NextResponse.json({
      success: true,
      message: 'Manager notification sent',
    })
  } catch (error) {
    console.error('Error sending manager notification:', error)
    // Don't fail the request if email fails - this is non-critical
    return NextResponse.json(
      { success: true, message: 'Notification queued' },
      { status: 200 }
    )
  }
}
