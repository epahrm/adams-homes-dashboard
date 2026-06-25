import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const userType = request.headers.get('x-user-type')

    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questionId, response } = body

    if (!questionId || !response) {
      return NextResponse.json({ error: 'Missing questionId or response' }, { status: 400 })
    }

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        answered: true,
        response,
      },
    })

    return NextResponse.json({
      id: question.id,
      answered: question.answered,
      message: 'Question answered successfully',
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
