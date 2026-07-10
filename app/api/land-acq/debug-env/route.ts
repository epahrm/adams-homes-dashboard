import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTable } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const dbUrl = process.env.DATABASE_URL
  const adminKey = process.env.LAND_ACQ_ADMIN_KEY
  const cronSecret = process.env.CRON_SECRET

  let poolError: string | null = null
  let tableError: string | null = null

  try {
    await ensureTable()
  } catch (e) {
    tableError = String(e)
  }

  return NextResponse.json({
    env: {
      DATABASE_URL: dbUrl ? (dbUrl.substring(0, 50) + '...') : 'NOT SET',
      LAND_ACQ_ADMIN_KEY: adminKey ? '***' : 'NOT SET',
      CRON_SECRET: cronSecret ? '***' : 'NOT SET',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('ADMIN') || k.includes('CRON')),
    },
    database: {
      poolError,
      tableError,
    },
  })
}
