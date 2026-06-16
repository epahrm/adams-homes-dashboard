import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendQuestionToAdmin } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { question } = await request.json()

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question cannot be empty' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const submittedQuestion = await prisma.question.create({
      data: {
        userId,
        question: question.trim(),
      },
    })

    // Send email to admin
    await sendQuestionToAdmin(
      question,
      user.name,
      user.email,
      user.division
    )

    return NextResponse.json(submittedQuestion)
  } catch (error) {
    console.error('Error submitting question:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const userType = request.headers.get('x-user-type')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can view all questions
    if (userType !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const questions = await prisma.question.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            division: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
