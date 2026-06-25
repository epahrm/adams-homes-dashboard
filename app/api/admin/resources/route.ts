import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userType = request.headers.get('x-user-type')

    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [milestones, lessons] = await Promise.all([
      prisma.milestone.findMany({ orderBy: { order: 'asc' } }),
      prisma.marketingLesson.findMany({ orderBy: { order: 'asc' } }),
    ])

    return NextResponse.json({ milestones, lessons })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userType = request.headers.get('x-user-type')

    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, type, ...data } = body

    if (action === 'update') {
      if (type === 'milestone') {
        const { id, resourceUrl, videoUrl, thumbnailUrl, description, keyPoints, title } = data

        const milestone = await prisma.milestone.update({
          where: { id },
          data: {
            ...(resourceUrl !== undefined && { resourceUrl }),
            ...(videoUrl !== undefined && { videoUrl }),
            ...(thumbnailUrl !== undefined && { thumbnailUrl }),
            ...(description && { description }),
            ...(keyPoints && { keyPoints }),
            ...(title && { title }),
          },
        })

        return NextResponse.json({ success: true, milestone })
      } else if (type === 'lesson') {
        const { id, videoUrl, duration, description, title } = data

        const lesson = await prisma.marketingLesson.update({
          where: { id },
          data: {
            ...(videoUrl && { videoUrl }),
            ...(duration && { duration }),
            ...(description && { description }),
            ...(title && { title }),
          },
        })

        return NextResponse.json({ success: true, lesson })
      }
    }

    if (action === 'add-lesson') {
      const { order, title, description, videoUrl, duration } = data

      const lesson = await prisma.marketingLesson.create({
        data: {
          order,
          title,
          description,
          videoUrl,
          duration: duration || '30 minutes',
        },
      })

      return NextResponse.json({ success: true, lesson })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
