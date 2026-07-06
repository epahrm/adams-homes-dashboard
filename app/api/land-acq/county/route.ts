import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Server-side proxy to the Brevard County Property Appraiser public search.
// Runs on the server so the browser never hits BCPAO cross-origin. If the
// county site is unreachable (or bot-challenged), we return 502 and the
// landing page falls back to Kevin's research form.

const BCPAO = 'https://www.bcpao.us/api/v1'

type CountyRecord = {
  address: string
  owner: string
  parcel: string
  account: string
  lotSize: string | null
  zoning: string | null
  taxValue: string | null
}

function money(n: unknown): string | null {
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? '$' + Math.round(v).toLocaleString('en-US') : null
}

function normalize(item: Record<string, unknown>): CountyRecord {
  const acres = Number(item.totalAcreage ?? item.acreage)
  return {
    address: String(item.siteAddress ?? item.address ?? '').trim(),
    owner: String(item.owners ?? item.ownerName ?? '').trim(),
    parcel: String(item.parcelID ?? item.parcelId ?? item.account ?? '').trim(),
    account: String(item.account ?? '').trim(),
    lotSize: Number.isFinite(acres) && acres > 0 ? acres.toFixed(2) + ' acres' : null,
    zoning: item.zoning ? String(item.zoning) : null,
    taxValue: money(item.marketValue ?? item.assessedValue ?? item.justValue),
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const name = params.get('name')?.trim()
  const address = params.get('address')?.trim()
  if (!name && !address) {
    return NextResponse.json({ error: 'name or address is required' }, { status: 400 })
  }

  // BCPAO's address search wants the street portion only — strip city/state/zip.
  const street = address
    ?.split(',')[0]
    .replace(/\b(palm bay|melbourne|cocoa|rockledge|titusville|fl|florida)\b/gi, '')
    .replace(/\b\d{5}(-\d{4})?\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()

  const query = street
    ? `address=${encodeURIComponent(street)}`
    : `owner=${encodeURIComponent(name as string)}`
  const url = `${BCPAO}/search?${query}&activeonly=true&size=5&page=1`

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      },
    })
    const contentType = res.headers.get('content-type') || ''
    if (!res.ok || !contentType.includes('json')) {
      console.error('[land-acq] county search unavailable:', res.status, contentType)
      return NextResponse.json({ error: 'county_unavailable' }, { status: 502 })
    }
    const body = await res.json()
    const items: Record<string, unknown>[] = Array.isArray(body) ? body : body?.results || []
    const records = items.map(normalize).filter((r) => r.address)
    return NextResponse.json({ records })
  } catch (e) {
    console.error('[land-acq] county search failed:', e)
    return NextResponse.json({ error: 'county_unavailable' }, { status: 502 })
  }
}
