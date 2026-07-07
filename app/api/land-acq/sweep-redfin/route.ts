import { NextRequest, NextResponse } from 'next/server'
import { pool, ensureTable, isAdmin, addressKey } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// Automated on-market sweep via Redfin's public CSV data feed. Unlike Zillow /
// Realtor / LoopNet / Crexi (which 403 a server request), Redfin's data-download
// endpoint answers a normal request, so this runs unattended on the Vercel cron
// — no dedicated inbox, no credentials. Redfin aggregates the same MLS listings
// the other portals show, so it's a strong single source for Palm Bay.
//
// It pulls current vacant-land listings for Palm Bay, keeps the buy-box ones
// (<= 0.45 ac, <= $60k), and files new ones as 'opportunity' lots — de-duped by
// address, so a lot already worked or dismissed never comes back.

const CRON_SECRET = process.env.CRON_SECRET

function authorized(req: NextRequest): boolean {
  if (isAdmin(req.headers.get('x-admin-key'))) return true
  const auth = req.headers.get('authorization') || ''
  return !!CRON_SECRET && auth === `Bearer ${CRON_SECRET}`
}

// Redfin region 13979 = Palm Bay, FL. uipt=5 = Land, status=9 = active/for-sale.
const REDFIN_CSV =
  'https://www.redfin.com/stingray/api/gis-csv?al=1&market=orlando&num_homes=350&ord=redfin-recommended-asc&page_number=1&region_id=13979&region_type=6&status=9&uipt=5&v=8'

const MAX_ACRES = 0.45
const MAX_PRICE = 60000

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

  let csv = ''
  try {
    const res = await fetch(REDFIN_CSV, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        Accept: 'text/csv,*/*',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'redfin_unreachable', status: res.status }, { status: 502 })
    }
    csv = await res.text()
  } catch (e) {
    console.error('[land-acq] redfin fetch failed:', e)
    return NextResponse.json({ error: 'redfin_fetch_failed', detail: String(e) }, { status: 502 })
  }

  const rows = csv.split(/\r?\n/).filter((r) => r.trim())
  if (rows.length < 2) return NextResponse.json({ ok: true, scanned: 0, added: 0, duplicates: 0, note: 'No rows returned.' })
  const hdr = parseCsvLine(rows[0]).map((h) => h.trim().toUpperCase())
  const col = (n: string) => hdr.indexOf(n)
  const iType = col('PROPERTY TYPE'), iAddr = col('ADDRESS'), iCity = col('CITY'),
    iZip = col('ZIP OR POSTAL CODE'), iPrice = col('PRICE'), iLot = col('LOT SIZE'),
    iUrl = hdr.findIndex((h) => h.startsWith('URL')), iMls = col('MLS#')

  const candidates: Array<{ address: string; data: Record<string, unknown> }> = []
  for (let r = 1; r < rows.length; r++) {
    const c = parseCsvLine(rows[r])
    const type = (c[iType] || '').trim()
    if (!/land|lot/i.test(type)) continue
    const street = (c[iAddr] || '').trim()
    if (!street || !/\d/.test(street)) continue          // need a real street address
    const price = Number(c[iPrice] || 0)
    const lotSqft = Number(c[iLot] || 0)
    const acres = lotSqft ? +(lotSqft / 43560).toFixed(2) : null
    if (!(price > 0) || price > MAX_PRICE) continue
    if (acres != null && acres > MAX_ACRES) continue
    const zip = (c[iZip] || '').trim()
    const city = (c[iCity] || 'Palm Bay').trim()
    if (!/palm bay/i.test(city)) continue
    const address = `${street}, ${city}, FL${zip ? ' ' + zip : ''}`
    candidates.push({
      address,
      data: {
        listingType: 'listed', listStatus: 'Active Listing', source: 'Redfin',
        listPrice: price, acres: acres ?? undefined,
        listingUrl: iUrl >= 0 ? (c[iUrl] || undefined) : undefined,
        mls: iMls >= 0 ? (c[iMls] || undefined) : undefined,
        addedBy: 'redfin-sweep',
      },
    })
  }

  let added = 0, duplicates = 0
  try {
    await ensureTable()
    for (const lot of candidates) {
      const res = await pool.query(
        `INSERT INTO land_acq_lots (address, address_key, status, data)
         VALUES ($1, $2, 'opportunity', $3)
         ON CONFLICT (address_key) DO NOTHING RETURNING id`,
        [lot.address, addressKey(lot.address), JSON.stringify(lot.data)]
      )
      if (res.rows.length) added++
      else duplicates++
    }
    return NextResponse.json({ ok: true, source: 'Redfin', scanned: candidates.length, added, duplicates })
  } catch (e) {
    console.error('[land-acq] redfin sweep insert failed:', e)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}
