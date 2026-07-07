import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTables, isAdmin } from '@/lib/interview-db'

export const dynamic = 'force-dynamic'

// Keys the public careers page may read (pre-application brand videos etc.).
const PUBLIC_KEYS = new Set([
  'brand_video_url', // 60 sec: "What it's like to work here"
  'model_tour_url', // 90 sec: meet the team & culture
  'onboarding_preview_url', // 2 min: first 90 days
  'job_title',
  'job_blurb',
])

const ADMIN_KEYS = new Set([...PUBLIC_KEYS, 'offer_email_template', 'decline_email_template'])

export async function GET(request: NextRequest) {
  try {
    await ensureTables()
    const admin = isAdmin(request.headers.get('x-admin-key'))
    const result = await pool.query('SELECT key, value FROM vi_settings')
    const settings: Record<string, string> = {}
    for (const row of result.rows) {
      if (admin || PUBLIC_KEYS.has(row.key)) settings[row.key] = row.value
    }
    return NextResponse.json({ settings })
  } catch (e) {
    console.error('[interview] GET settings failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const settings = body.settings || {}
    await ensureTables()
    for (const [key, value] of Object.entries(settings)) {
      if (!ADMIN_KEYS.has(key)) continue
      await pool.query(
        `INSERT INTO vi_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, String(value ?? '')]
      )
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[interview] POST settings failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
