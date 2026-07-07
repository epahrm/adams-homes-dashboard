import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

// Off-market sweep: finds vacant residential Palm Bay lots in the buy box from
// the City of Palm Bay parcel records (public ArcGIS) — owner + mailing address
// included — for the direct-mail campaign. Admin only. `count=1` returns just
// the match count; otherwise returns up to `limit` records.

const PB_PARCELS =
  'https://gis.palmbayflorida.org/arcgis/rest/services/CommonServices/Parcels/FeatureServer/0/query'

function money(n: unknown): string | null {
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? '$' + Math.round(v).toLocaleString('en-US') : null
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const p = request.nextUrl.searchParams
  const num = (k: string, d: number) => {
    const v = Number(p.get(k))
    return Number.isFinite(v) ? v : d
  }
  const minAcres = Math.max(0, num('minAcres', 0.2))
  const maxAcres = Math.max(minAcres, num('maxAcres', 2))
  const maxValue = Math.max(1000, num('maxValue', 40000))
  const absentee = p.get('absentee') !== '0' // default on
  const countOnly = p.get('count') === '1'
  const limit = Math.min(500, Math.max(1, num('limit', 50)))

  // UseCode 0010 = vacant residential (single-family, platted). Absentee is
  // filtered in code (below) rather than in the county query, which keeps the
  // query simple and reliable.
  const where = `UseCode='0010' AND LandValue>5000 AND LandValue<=${Math.round(maxValue)} AND Acreage>=${minAcres} AND Acreage<=${maxAcres}`
  const PB_ZIPS = ['32905', '32906', '32907', '32908', '32909', '32910', '32911']
  const isAbsentee = (a: Record<string, unknown>) => {
    const z = String(a.MailZip5 || '').trim().slice(0, 5)
    const c = String(a.MailCity || '').toUpperCase()
    return !(PB_ZIPS.includes(z) || c === 'PALM BAY')
  }

  const base = PB_PARCELS + '?where=' + encodeURIComponent(where) + '&f=json'
  // Over-fetch when filtering to absentee so we still return ~limit rows.
  const fetchCount = absentee ? Math.min(1000, limit * 2) : limit
  const url = countOnly
    ? base + '&returnCountOnly=true'
    : base +
      '&outFields=' +
      encodeURIComponent(
        'ParcelID,Address,OwnerName,MailAddressLine1,MailCity,MailState,MailZip5,SiteZip5,Acreage,LandValue'
      ) +
      '&orderByFields=' + encodeURIComponent('LandValue DESC') +
      '&resultRecordCount=' + fetchCount

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { Accept: 'application/json' } })
    if (!res.ok) return NextResponse.json({ error: 'county_unavailable' }, { status: 502 })
    const body = await res.json()
    if (countOnly) return NextResponse.json({ count: body.count ?? 0, note: absentee ? 'buy-box total; the pulled list is absentee-filtered' : undefined })

    let recs = (body.features || [])
      .map((f: { attributes: Record<string, unknown> }) => f.attributes)
      .filter((a: Record<string, unknown>) => a.Address && String(a.Address).toUpperCase() !== 'UNKNOWN')
    if (absentee) recs = recs.filter(isAbsentee)
    const lots = recs.slice(0, limit).map((a: Record<string, unknown>) => {
      const acres = Number(a.Acreage)
      const mailing = [a.MailAddressLine1, [a.MailCity, a.MailState].filter(Boolean).join(', '), a.MailZip5]
        .filter(Boolean).join(' ').trim()
      return {
        parcel: a.ParcelID || null,
        address: (String(a.Address || '').trim()) + ', Palm Bay, FL ' + (a.SiteZip5 || ''),
        owner: a.OwnerName || null,
        ownerContact: mailing || null,
        acres: Number.isFinite(acres) ? acres : null,
        lotSize: Number.isFinite(acres) ? acres.toFixed(2) + ' acres' : null,
        taxValue: money(a.LandValue),
        landValue: Number(a.LandValue) || null,
        absentee: isAbsentee(a),
        source: 'Off-Market · County',
        listStatus: 'Off-Market',
      }
    })
    return NextResponse.json({ count: lots.length, lots })
  } catch (e) {
    console.error('[land-acq] market sweep failed:', e)
    return NextResponse.json({ error: 'county_unavailable' }, { status: 502 })
  }
}
