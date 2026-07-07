import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Public seller-facing property search. Uses the City of Palm Bay parcel
// service (public ArcGIS, no bot-wall) — the same source the offer screen and
// off-market sweep use. Searches by street address or by owner name.
//
// Owner names in the county records are stored "LAST, FIRST MIDDLE"
// (e.g. "FACEY, CARLTON F"). We match each word the seller types anywhere in
// the name, in any order, so "Facey", "Carlton Facey", or "Facey, Carlton" all
// hit the same record.

const PB_PARCELS =
  'https://gis.palmbayflorida.org/arcgis/rest/services/CommonServices/Parcels/FeatureServer/0/query'

type Attr = {
  ParcelID?: string
  Address?: string
  SiteZip5?: string
  OwnerName?: string
  MailAddressLine1?: string
  MailCity?: string
  MailState?: string
  MailZip5?: string
  Acreage?: number
  UseCode?: string
  UseCodeDesc?: string
  LandValue?: number
  MarketValue?: number
}

function money(n: unknown): string | null {
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? '$' + Math.round(v).toLocaleString('en-US') : null
}

// Escape single quotes for the ArcGIS WHERE clause.
const esc = (s: string) => s.replace(/'/g, "''")

function buildWhere(name: string | undefined, address: string | undefined): string | null {
  if (address) {
    // Street portion only; house number + first street word (the reliable match).
    const street = address.split(',')[0].trim()
    const m = street.match(/^(\d+)\s+([A-Za-z]+)/)
    if (m) {
      const houseNo = m[1].replace(/[^0-9]/g, '')
      const word = m[2].toUpperCase().replace(/[^A-Z]/g, '')
      return `Address LIKE '${houseNo} ${word}%'`
    }
    // No street number (intersection, etc.) — match the street word(s).
    const words = street.toUpperCase().match(/[A-Z0-9]{2,}/g) || []
    if (!words.length) return null
    return words.map((w) => `UPPER(Address) LIKE '%${esc(w)}%'`).join(' AND ')
  }
  if (name) {
    const words = name.toUpperCase().match(/[A-Z0-9&]{2,}/g) || []
    if (!words.length) return null
    return words.map((w) => `UPPER(OwnerName) LIKE '%${esc(w)}%'`).join(' AND ')
  }
  return null
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const name = params.get('name')?.trim()
  const address = params.get('address')?.trim()
  if (!name && !address) {
    return NextResponse.json({ error: 'name or address is required' }, { status: 400 })
  }

  const where = buildWhere(name, address)
  if (!where) return NextResponse.json({ records: [] })

  const url =
    PB_PARCELS +
    '?where=' + encodeURIComponent(where) +
    '&outFields=' +
    encodeURIComponent(
      'ParcelID,Address,SiteZip5,OwnerName,MailAddressLine1,MailCity,MailState,MailZip5,Acreage,UseCode,UseCodeDesc,LandValue,MarketValue'
    ) +
    '&orderByFields=' + encodeURIComponent('Address') +
    // Name searches can hit an owner with many lots (e.g. a builder) — return
    // enough to list them all so the seller can pick the right one. Address
    // searches stay tight.
    '&resultRecordCount=' + (name ? '100' : '8') + '&f=json'

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(9000), headers: { Accept: 'application/json' } })
    if (!res.ok) {
      console.error('[land-acq] county (ArcGIS) unavailable:', res.status)
      return NextResponse.json({ error: 'county_unavailable' }, { status: 502 })
    }
    const body = await res.json()
    if (body.error) {
      console.error('[land-acq] county (ArcGIS) query error:', JSON.stringify(body.error))
      return NextResponse.json({ error: 'county_unavailable' }, { status: 502 })
    }
    const feats: { attributes: Attr }[] = body.features || []
    const records = feats
      .map(({ attributes: a }) => {
        const desc = (a.UseCodeDesc || '').trim()
        const vacant = /vacant/i.test(desc) || /^00/.test(a.UseCode || '')
        const acres = Number.isFinite(a.Acreage) ? Number(a.Acreage) : null
        const mailing = [a.MailAddressLine1, [a.MailCity, a.MailState].filter(Boolean).join(', '), a.MailZip5]
          .filter(Boolean).join(' ').trim()
        const addr = (a.Address || '').trim()
        return {
          address: addr ? addr + ', Palm Bay, FL ' + (a.SiteZip5 || '') : '',
          owner: (a.OwnerName || '').trim(),
          parcel: (a.ParcelID || '').trim(),
          account: (a.ParcelID || '').trim(),
          ownerContact: mailing || null,
          lotSize: acres != null ? acres.toFixed(2) + ' acres' : null,
          acres,
          zoning: 'Residential',
          useDesc: desc || null,
          hasStructure: !vacant,
          taxValue: money(a.MarketValue),
          landValue: money(a.LandValue),
        }
      })
      .filter((r) => r.address)
    return NextResponse.json({ records })
  } catch (e) {
    console.error('[land-acq] county search failed:', e)
    return NextResponse.json({ error: 'county_unavailable' }, { status: 502 })
  }
}
