import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureSettingsTable, isAdmin, DEFAULT_STIPENDS } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'

// Shared admin settings (currently the stipend defaults + their audit log) so
// Kevin's and Elizabeth's dashboards stay in sync. Admin only.

const STIPEND_KEY = 'stipend'

// GET /api/land-acq/settings  -> { defaults, audit }
export async function GET(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureSettingsTable()
    const res = await pool.query('SELECT value FROM land_acq_settings WHERE key = $1', [STIPEND_KEY])
    const value = res.rows[0]?.value || { defaults: DEFAULT_STIPENDS, audit: [] }
    return NextResponse.json(value)
  } catch (e) {
    console.error('[land-acq] GET settings failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

// PUT /api/land-acq/settings  { defaults, changedBy }  -> appends an audit entry
export async function PUT(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const nextDefaults = body.defaults
    const changedBy = String(body.changedBy || 'Admin')
    if (!nextDefaults || typeof nextDefaults !== 'object') {
      return NextResponse.json({ error: 'defaults are required' }, { status: 400 })
    }
    // Only accept known utility types with positive numeric amounts.
    const clean: Record<string, number> = {}
    for (const key of Object.keys(DEFAULT_STIPENDS)) {
      const n = Number(nextDefaults[key])
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: 'Invalid stipend amount for ' + key }, { status: 400 })
      }
      clean[key] = Math.round(n)
    }

    await ensureSettingsTable()
    const cur = await pool.query('SELECT value FROM land_acq_settings WHERE key = $1', [STIPEND_KEY])
    const prev = cur.rows[0]?.value || { defaults: DEFAULT_STIPENDS, audit: [] }
    const audit = Array.isArray(prev.audit) ? prev.audit : []

    // Record every changed line as its own audit entry (who + when + from/to).
    const when = new Date().toISOString()
    for (const key of Object.keys(clean)) {
      const from = Number(prev.defaults?.[key] ?? DEFAULT_STIPENDS[key])
      if (from !== clean[key]) {
        audit.unshift({ key, from, to: clean[key], changedBy, when })
      }
    }

    const value = { defaults: clean, audit: audit.slice(0, 200) }
    await pool.query(
      `INSERT INTO land_acq_settings (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
      [STIPEND_KEY, JSON.stringify(value)]
    )
    return NextResponse.json(value)
  } catch (e) {
    console.error('[land-acq] PUT settings failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
