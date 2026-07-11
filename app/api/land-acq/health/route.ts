import { NextRequest, NextResponse } from 'next/server'
import { pool, isAdmin } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checks = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      ADMIN_KEY_SET: !!process.env.ADMIN_KEY,
    },
    database: { status: 'unknown', error: null as string | null },
  }

  // Try to connect to database
  if (process.env.DATABASE_URL) {
    try {
      await pool.query('SELECT 1')
      checks.database.status = 'connected'
    } catch (err: any) {
      checks.database.status = 'error'
      checks.database.error = err.message
    }
  } else {
    checks.database.status = 'skipped'
    checks.database.error = 'DATABASE_URL not set'
  }

  return NextResponse.json(checks)
}
