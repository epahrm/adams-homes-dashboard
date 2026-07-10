import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const dbUrl = process.env.DATABASE_URL
  const adminKey = process.env.LAND_ACQ_ADMIN_KEY

  return NextResponse.json({
    DATABASE_URL: dbUrl ? (dbUrl.substring(0, 50) + '...') : 'NOT SET',
    LAND_ACQ_ADMIN_KEY: adminKey ? '***' : 'NOT SET',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('ADMIN')),
  })
}
