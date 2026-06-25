import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { prisma } = await import('@/lib/db')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      clientVersion: error.clientVersion,
      detail: error.meta?.cause?.message || 'N/A',
    }, { status: 500 })
  }
}
