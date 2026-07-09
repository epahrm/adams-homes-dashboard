import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTable, isAdmin, addressKey } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// Periodic check: reviews on-market lots from Redfin/Zillow and updates their
// status if they've been sold or removed from listings. Runs as a Vercel cron job.
// Removes lots from the active pipeline if they're no longer available for purchase.

const CRON_SECRET = process.env.CRON_SECRET

function authorized(req: NextRequest): boolean {
  if (isAdmin(req.headers.get('x-admin-key'))) return true
  const auth = req.headers.get('authorization') || ''
  return !!CRON_SECRET && auth === `Bearer ${CRON_SECRET}`
}

// Redfin CSV feed for Palm Bay vacant land
const REDFIN_CSV =
  'https://www.redfin.com/stingray/api/gis-csv?al=1&market=orlando&num_homes=350&ord=redfin-recommended-asc&page_number=1&region_id=13979&region_type=6&status=9&uipt=5&v=8'

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = '', q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++ } else q = !q }
    else if (c === ',' && !q) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureTable()

    // Fetch current Redfin listings to know what's still active
    let redfin: Set<string> = new Set()
    try {
      const res = await fetch(REDFIN_CSV, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'text/csv,*/*',
        },
        signal: AbortSignal.timeout(20000),
      })
      if (res.ok) {
        const csv = await res.text()
        const rows = csv.split(/\r?\n/).filter((r) => r.trim())
        if (rows.length > 1) {
          const hdr = parseCsvLine(rows[0]).map((h) => h.trim().toUpperCase())
          const iAddr = hdr.indexOf('ADDRESS'), iCity = hdr.indexOf('CITY'), iZip = hdr.indexOf('ZIP OR POSTAL CODE')
          for (let r = 1; r < rows.length; r++) {
            const c = parseCsvLine(rows[r])
            const street = (c[iAddr] || '').trim()
            const city = (c[iCity] || 'Palm Bay').trim()
            const zip = (c[iZip] || '').trim()
            if (street) {
              const addr = `${street}, ${city}, FL${zip ? ' ' + zip : ''}`
              redfin.add(addressKey(addr))
            }
          }
        }
      }
    } catch (e) {
      console.warn('[land-acq] could not fetch redfin for status check:', e)
    }

    // Find on-market lots (opportunity status with listStatus not already marked sold)
    const result = await pool.query(`
      SELECT id, address, data FROM land_acq_lots
      WHERE status = 'opportunity'
        AND data->>'listStatus' IN ('Active Listing', 'Pending')
        AND (data->>'source' LIKE 'Portal Alert%' OR data->>'source' = 'Redfin')
    `)

    let checked = 0
    let updated = 0

    for (const row of result.rows) {
      checked++
      const id = row.id
      const addr = row.address
      const data = row.data || {}
      const source = String(data.source || '')
      const addrKey = addressKey(addr)

      // For Redfin-sourced listings, check if still in active feed
      if (source === 'Redfin' && !redfin.has(addrKey)) {
        // No longer in Redfin's active listings — mark as sold and close the lot
        await pool.query(
          `UPDATE land_acq_lots
           SET status = 'closed',
               data = data || $1::jsonb,
               updated_at = now()
           WHERE id = $2`,
          [JSON.stringify({ listStatus: 'Sold', soldAt: new Date().toISOString(), closedBy: 'auto-mls-check' }), id]
        )
        updated++
      }

      // For Zillow portal alerts (already in database), we can't easily check status
      // without scraping. They should be manually marked unsuitable if needed.
    }

    return NextResponse.json({ ok: true, checked, updated, note: 'Checked on-market lots; marked removed Redfin listings as sold.' })
  } catch (e) {
    console.error('[land-acq] MLS status check failed:', e)
    return NextResponse.json({ error: 'check_failed', detail: String(e) }, { status: 500 })
  }
}
