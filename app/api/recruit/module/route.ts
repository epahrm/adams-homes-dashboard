import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/recruit/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const slug = request.nextUrl.searchParams.get('slug') || ''
  const module_ = await prisma.recModule.findUnique({
    where: { slug },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })
  if (!module_) return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  return NextResponse.json({ module: module_ })
}
