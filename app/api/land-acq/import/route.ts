import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTable, isAdmin, addressKey, LOT_STATUSES } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Admin-only bulk create: used both for Kevin's CSV contact upload (mailer
// targets) and for adding an existing/in-progress contract straight into the
// pipeline at a chosen stage. Deduplicates on address; skips rows that already
// exist. Unlike the public POST, this trusts the admin to set the status.

type InLot = { address?: unknown; status?: unknown } & Record<string, unknown>

export async function POST(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { lots?: InLot[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const lots = Array.isArray(body.lots) ? body.lots : []
  if (!lots.length) {
    return NextResponse.json({ error: 'lots array is required' }, { status: 400 })
  }

  let added = 0
  let duplicates = 0
  const failures: { row: number; address: string; reason: string }[] = []

  try {
    await ensureTable()
    for (let i = 0; i < lots.length; i++) {
      const raw = lots[i]
      const address = String(raw.address || '').trim()
      if (!address) {
        failures.push({ row: i + 1, address: '', reason: 'Missing address' })
        continue
      }
      let status = 'opportunity'
      if (raw.status != null && String(raw.status).trim()) {
        const s = String(raw.status).trim()
        if (!(LOT_STATUSES as readonly string[]).includes(s)) {
          failures.push({ row: i + 1, address, reason: 'Invalid status "' + s + '"' })
          continue
        }
        status = s
      }
      const { address: _a, status: _s, id: _id, createdAt: _c, updatedAt: _u, ...data } = raw
      try {
        // Never show Kevin a lot we've already seen: block by parcel or legal
        // description too (not just address), so the same lot from a different
        // source/format can't slip back in.
        const parcel = String((data as Record<string, unknown>).parcel || '').trim()
        const legal = String((data as Record<string, unknown>).legal || '').trim()
        if (parcel || legal) {
          const dup = await pool.query(
            `SELECT 1 FROM land_acq_lots
             WHERE ($1 <> '' AND data->>'parcel' = $1)
                OR ($2 <> '' AND data->>'legal' = $2)
             LIMIT 1`,
            [parcel, legal]
          )
          if (dup.rows.length) { duplicates++; continue }
        }
        const res = await pool.query(
          `INSERT INTO land_acq_lots (address, address_key, status, data)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (address_key) DO NOTHING RETURNING id`,
          [address, addressKey(address), status, JSON.stringify({ ...data, addedBy: 'import' })]
        )
        if (res.rows.length) added++
        else duplicates++
      } catch (e) {
        failures.push({ row: i + 1, address, reason: 'Database error' })
      }
    }
    return NextResponse.json({ ok: true, processed: lots.length, added, duplicates, failed: failures.length, failures })
  } catch (e) {
    console.error('[land-acq] import failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
