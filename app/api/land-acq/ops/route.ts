import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureSettingsTable, isAdmin } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'

// Shared operations data for the "Costs, ROI & Renewals" admin panel — kept in
// the same settings store so Kevin's and Elizabeth's dashboards stay in sync.
// One whitelisted key per collection: subscription/account list, mailing-cost
// log, and cancelled-contract log. Admin only.
//
// Security note: we intentionally do NOT keep raw passwords here. The account
// list stores a login/username and a "credential location" pointer (e.g. the
// shared password manager), never a plaintext password.

const KEYS = ['accounts', 'mailCosts', 'cancellations'] as const
type OpsKey = (typeof KEYS)[number]

function keyOf(req: NextRequest): OpsKey | null {
  const k = req.nextUrl.searchParams.get('key')
  return (KEYS as readonly string[]).includes(String(k)) ? (k as OpsKey) : null
}

// GET /api/land-acq/ops?key=accounts  ->  { key, items: [...] }
export async function GET(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const key = keyOf(request)
  if (!key) return NextResponse.json({ error: 'Unknown key' }, { status: 400 })
  try {
    await ensureSettingsTable()
    const res = await pool.query('SELECT value FROM land_acq_settings WHERE key = $1', ['ops_' + key])
    const items = Array.isArray(res.rows[0]?.value?.items) ? res.rows[0].value.items : []
    return NextResponse.json({ key, items })
  } catch (e) {
    console.error('[land-acq] GET ops failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

// PUT /api/land-acq/ops?key=accounts  { items: [...] }  -> replaces the list
export async function PUT(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const key = keyOf(request)
  if (!key) return NextResponse.json({ error: 'Unknown key' }, { status: 400 })
  let body: { items?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const items = Array.isArray(body.items) ? body.items.slice(0, 500) : []
  try {
    await ensureSettingsTable()
    const value = { items, updatedAt: new Date().toISOString() }
    await pool.query(
      `INSERT INTO land_acq_settings (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
      ['ops_' + key, JSON.stringify(value)]
    )
    return NextResponse.json({ key, items })
  } catch (e) {
    console.error('[land-acq] PUT ops failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
