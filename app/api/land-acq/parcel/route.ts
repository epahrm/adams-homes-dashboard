import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// On-demand county parcel lookup for a Palm Bay address. Called when Kevin
// opens a lot to make an offer — pulls owner, mailing address, parcel #,
// acreage, land use, and value from the City of Palm Bay parcel service
// (public ArcGIS, no bot-wall) so the offer packet is complete.

const PB_PARCELS =
  'https://gis.palmbayflorida.org/arcgis/rest/services/CommonServices/Parcels/FeatureServer/0/query'

type Attr = {
  ParcelID?: string
  Address?: string
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

// "951 Weslaco St SE, Palm Bay, FL 32909" -> house "951", first street word "WESLACO".
function parseAddress(address: string): { houseNo: string; streetWord: string } | null {
  const street = address.split(',')[0].trim()
  const m = street.match(/^(\d+)\s+([A-Za-z]+)/)
  if (!m) return null
  return { houseNo: m[1], streetWord: m[2].toUpperCase() }
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const address = request.nextUrl.searchParams.get('address')?.trim()
  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 })
  }
  const parsed = parseAddress(address)
  if (!parsed) {
    // Intersections / addresses without a street number can't be looked up here.
    return NextResponse.json({ found: false, reason: 'no_street_number' })
  }

  // Sanitize for the ArcGIS WHERE (alphanumerics only), then match on the
  // combined Address field by house number + first street word.
  const houseNo = parsed.houseNo.replace(/[^0-9]/g, '')
  const streetWord = parsed.streetWord.replace(/[^A-Z]/g, '')
  const where = `Address LIKE '${houseNo} ${streetWord}%'`
  const url =
    PB_PARCELS +
    '?where=' + encodeURIComponent(where) +
    '&outFields=' +
    encodeURIComponent(
      'ParcelID,Address,OwnerName,MailAddressLine1,MailCity,MailState,MailZip5,Acreage,UseCode,UseCodeDesc,LandValue,MarketValue'
    ) +
    '&resultRecordCount=1&f=json'

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(9000), headers: { Accept: 'application/json' } })
    if (!res.ok) return NextResponse.json({ found: false, reason: 'county_unavailable' }, { status: 502 })
    const body = await res.json()
    const a: Attr | undefined = (body.features || [])[0]?.attributes
    if (!a) return NextResponse.json({ found: false, reason: 'no_match' })

    const desc = (a.UseCodeDesc || '').trim()
    const vacant = /vacant/i.test(desc) || /^00/.test(a.UseCode || '')
    const mailing = [a.MailAddressLine1, [a.MailCity, a.MailState].filter(Boolean).join(', '), a.MailZip5]
      .filter(Boolean)
      .join(' ')
      .trim()
    const acres = Number.isFinite(a.Acreage) ? Number(a.Acreage) : null

    return NextResponse.json({
      found: true,
      parcel: a.ParcelID || null,
      siteAddress: (a.Address || '').trim() || null,
      owner: a.OwnerName || null,
      ownerContact: mailing || null,
      acres,
      lotSize: acres != null ? acres.toFixed(2) + ' acres' : null,
      useCode: a.UseCode || null,
      useDesc: desc || null,
      zoningClass: 'Residential',
      hasStructure: !vacant,
      landValue: money(a.LandValue),
      taxValue: money(a.MarketValue),
    })
  } catch (e) {
    console.error('[land-acq] parcel lookup failed:', e)
    return NextResponse.json({ found: false, reason: 'county_unavailable' }, { status: 502 })
  }
}
