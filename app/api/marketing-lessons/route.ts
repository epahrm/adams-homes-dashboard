import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const lessons = await prisma.marketingLesson.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching marketing lessons:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userType = request.headers.get('x-user-type')

    if (userType !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { order, title, description, videoUrl, thumbnailUrl } = await request.json()

    const lesson = await prisma.marketingLesson.create({
      data: {
        order,
        title,
        description,
        videoUrl,
        thumbnailUrl,
      },
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error creating marketing lesson:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
