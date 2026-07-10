import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTable } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Logs a postcard QR scan against the lot it points to: bumps a scan counter,
// stamps the last scan time, and records which mail batch drove it. Public and
// fire-and-forget (the seller page beacons this on load when the URL carries
// postcard tracking params).

export async function POST(request: NextRequest) {
  let body: { propertyId?: unknown; batch?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const propertyId = body.propertyId != null ? String(body.propertyId).replace(/[^0-9]/g, '') : ''
  const batch = body.batch != null ? String(body.batch).slice(0, 64) : null
  if (!propertyId) return NextResponse.json({ ok: false, reason: 'no_property' })
  try {
    await ensureTable()
    await pool.query(
      `UPDATE land_acq_lots
       SET data = data
         || jsonb_build_object('qrScans', COALESCE((data->>'qrScans')::int, 0) + 1)
         || jsonb_build_object('lastScanAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
         || CASE WHEN $2::text IS NOT NULL THEN jsonb_build_object('lastBatch', $2::text) ELSE '{}'::jsonb END,
           updated_at = now()
       WHERE id = $1`,
      [propertyId, batch]
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[land-acq] scan log failed:', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
