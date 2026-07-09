import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { pool, ensureTable, isAdmin } from '@/lib/land-acq-db'
import { VAC14_TEMPLATE_B64 } from '@/lib/land-acq-vac14-template'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

// Fills Elizabeth's exact Vacant Land Contract (VAC-14) + Addendum for a deal:
// overlays the per-deal values (Seller, Purchase Price, Commission) onto the
// real form, then appends Exhibit "A" (the Brevard County property card). Legal
// data comes ONLY from the authoritative county GIS; anything not fully
// confirmed there (e.g., the recorded plat name / book & page) is flagged for
// Kevin's review rather than guessed.

const INK = rgb(0.05, 0.1, 0.32)

type Parcel = {
  ParcelID?: string; RENUM?: string; Sub?: string; Blk?: string; Lot?: string
  Sec?: string; Twp?: string; Rng?: string; UseCodeDesc?: string; Acreage?: number
  OwnerName?: string; SiteZip5?: string; AssessedValue?: number; MarketValue?: number
}

// Verified parcel lookup against the public Palm Bay ArcGIS parcel service.
async function fetchParcel(address: string): Promise<Parcel | null> {
  const first = String(address || '').split(',')[0].trim()
  const m = first.match(/^(\d+)\s+(.+)$/)
  if (!m) return null
  const houseNo = m[1]
  const streetName = m[2]
    .replace(/\b(dr|drive|st|street|ave|avenue|rd|road|ct|court|ter|terrace|cir|circle|blvd|boulevard|ln|lane|way|pl|place|trl|trail|loop|run|pt|point|se|sw|ne|nw|n|s|e|w)\b/gi, '')
    .trim().split(/\s+/).filter(Boolean)[0]
  if (!streetName) return null
  const where = `SiteHouseNo='${houseNo.replace(/'/g, "''")}' AND UPPER(SiteStreetname) LIKE '%${streetName.toUpperCase().replace(/'/g, "''")}%'`
  const url =
    'https://gis.palmbayflorida.org/arcgis/rest/services/CommonServices/Parcels/FeatureServer/0/query?where=' +
    encodeURIComponent(where) +
    '&outFields=ParcelID,RENUM,Sub,Blk,Lot,Sec,Twp,Rng,UseCodeDesc,Acreage,OwnerName,SiteZip5,AssessedValue,MarketValue&returnGeometry=false&f=json'
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return null
    const j = await res.json()
    return (j.features && j.features[0] && j.features[0].attributes) || null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const q = req.nextUrl.searchParams
  const id = q.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Load the lot.
  let lot: Record<string, unknown> = {}
  try {
    await ensureTable()
    const r = await pool.query('SELECT address, status, data FROM land_acq_lots WHERE id = $1', [id])
    if (!r.rows.length) return NextResponse.json({ error: 'lot not found' }, { status: 404 })
    lot = Object.assign({ address: r.rows[0].address, status: r.rows[0].status }, r.rows[0].data || {})
  } catch (e) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const address = String(lot.address || '')
  const offer = (q.get('offer') || String(lot.offer || '')).replace(/[^0-9.]/g, '')
  const listed = q.get('listed') === '1' || (q.get('listed') == null && lot.listingType === 'listed')
  const commPct = (q.get('commission') || '').replace(/[^0-9.]/g, '') || (listed ? '3' : '0')
  const dueDilDays = parseInt(q.get('dueDilDays') || '45', 10) || 45
  const closeBusinessDays = parseInt(q.get('closeBusinessDays') || '10', 10) || 10
  const sellerCostContrib = q.get('sellerCostContrib') || '350'

  // Verified county data — the only source for the legal description.
  const parcel = await fetchParcel(address)
  const review: string[] = []

  const sellerFromLot = (lot.owner as string) || [lot.firstName, lot.lastName].filter(Boolean).join(' ')
  let seller = (parcel && parcel.OwnerName) ? String(parcel.OwnerName).trim() : (sellerFromLot || '')
  if (!parcel) review.push('Property not found in the Palm Bay county GIS — verify the owner of record, parcel ID, and legal description before sending.')
  else if (!parcel.OwnerName && sellerFromLot) review.push('Owner of record not returned by GIS — Seller name is from the listing; confirm current owner.')
  if (!seller) { seller = '____________________'; review.push('Seller name unconfirmed.') }

  const parcelId = (parcel && (parcel.ParcelID || parcel.RENUM)) || (lot.parcel as string) || ''
  let legal = ''
  if (parcel && parcel.Lot && parcel.Blk) {
    legal = `Lot ${parcel.Lot}, Block ${parcel.Blk}` +
      (parcel.Sec ? `, Section ${parcel.Sec}` : '') +
      (parcel.Twp ? `, Township ${parcel.Twp} S` : '') +
      (parcel.Rng ? `, Range ${parcel.Rng} E` : '') +
      (parcel.Sub ? ` (subdivision code ${parcel.Sub})` : '') + ', Brevard County, FL'
    review.push('Confirm the recorded plat/subdivision name (e.g., Port Malabar Unit __) and Plat Book & Page — not available from GIS.')
  } else {
    legal = (lot.legal as string) || 'SEE COUNTY RECORD — NOT CONFIRMED'
    review.push('Legal description (Lot/Block) not confirmed from county GIS — verify manually.')
  }
  const acreage = parcel && typeof parcel.Acreage === 'number' ? parcel.Acreage + ' acres'
    : (lot.lotSize as string) || (lot.acres ? lot.acres + ' acres' : '—')
  const useDesc = (parcel && parcel.UseCodeDesc && parcel.UseCodeDesc.trim()) || 'Vacant residential (verify)'
  const assessed = parcel && typeof parcel.AssessedValue === 'number'
    ? '$' + parcel.AssessedValue.toLocaleString('en-US') : (lot.taxValue as string) || '—'

  // Listing-agent details (on-market / listed deals only) — populate the
  // Seller's-side broker block. License # is verified/entered by Kevin.
  const agentName = String(lot.agentName || '').trim()
  const agentLicense = String(lot.agentLicense || '').trim()
  const agentEmail = String(lot.agentEmail || '').trim()
  const agentPhone = String(lot.agentPhone || '').trim()
  const agentBrokerage = String(lot.agentBrokerage || '').trim()
  if (listed && !agentLicense && agentName) review.push('Listing agent license # not confirmed — verify on myfloridalicense.com (BK/SL…) before sending.')

  // ---- Fill the PDF ----
  const pdf = await PDFDocument.load(Buffer.from(VAC14_TEMPLATE_B64, 'base64'), { ignoreEncryption: true })
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold)
  const pages = pdf.getPages()
  const put = (pg: (typeof pages)[number], txt: string, x: number, y: number, size = 10, f = font) =>
    pg.drawText(String(txt == null ? '' : txt), { x, y, size, font: f, color: INK })

  const p1 = pages[0]
  // Seat the Seller name on the "Sale and Purchase" blank: baseline y=686 rests
  // it on the underline (matching the pre-filled Buyer line just below), and
  // x=308 left-aligns it just after the colon. Auto-shrink the font so long
  // entity names (e.g. "Adams Homes of Northwest Florida, Inc.") stay inside the
  // blank instead of running into the ("Seller") label — that overflow was the
  // "crooked" look on real owner names.
  let sellerSize = 11
  while (sellerSize > 8 && font.widthOfTextAtSize(seller, sellerSize) > 208) sellerSize -= 0.5
  put(p1, seller, 308, 686, sellerSize)
  if (offer) put(p1, Number(offer).toLocaleString('en-US'), 505, 549, 11)

  // Listing-agent (Seller's-side) block — the Buyer's side is pre-printed with
  // Adams Homes. Fill the left column from the lot for on-market deals:
  //   pg 6 (idx 5) line 327: Seller's Sales Associate name (license verified separately, not printed)
  //   pg 7 (idx 6) line 329: email · line 332: phone · line 335: listing brokerage
  if (listed) {
    const pAgentName = pages[5]
    if (pAgentName && agentName) {
      put(pAgentName, agentName, 175, 108, 10)
    }
    const pAgent = pages[6]
    if (pAgent) {
      if (agentEmail) put(pAgent, agentEmail, 175, 726, 10)
      if (agentPhone) put(pAgent, agentPhone, 175, 690, 10)
      if (agentBrokerage) put(pAgent, agentBrokerage, 175, 655, 10)
    }
  }

  // Addendum for Vacant Land Contract — Seller name in line 1 (the intro
  // "entered into by and between ___ (Seller)"). Auto-fit like the cover line.
  const pAddendum = pages[8]
  if (pAddendum) {
    let addSize = 11
    while (addSize > 8 && font.widthOfTextAtSize(seller, addSize) > 280) addSize -= 0.5
    put(pAddendum, seller, 220, 688, addSize)
  }

  const p11 = pages[10]
  if (p11) {
    if (listed) { put(p11, commPct, 150, 486, 10); put(p11, 'X', 126, 546, 11, fontB) }
    else { put(p11, 'X', 126, 404, 11, fontB) }
  }

  // ---- Exhibit "A" ----
  const ex = pdf.addPage([612, 792])
  let y = 740
  ex.drawRectangle({ x: 56, y: y - 6, width: 118, height: 26, color: rgb(0.04, 0.17, 0.32) })
  ex.drawText('EXHIBIT "A"', { x: 66, y: y + 2, size: 13, font: fontB, color: rgb(1, 1, 1) })
  y -= 40
  ex.drawText('Brevard County Property Appraiser Card', { x: 56, y, size: 15, font: fontB, color: INK })
  y -= 16
  ex.drawText('Property and legal description referenced in the Vacant Land Contract above.', { x: 56, y, size: 9, font, color: rgb(0.4, 0.45, 0.5) })
  y -= 24
  const rowKV = (k: string, v: string) => {
    ex.drawText(k, { x: 56, y, size: 10, font: fontB, color: rgb(0.3, 0.36, 0.44) })
    const lines = wrap(v, 62)
    lines.forEach((ln, i) => ex.drawText(ln, { x: 210, y: y - i * 13, size: 10, font, color: INK }))
    y -= Math.max(20, lines.length * 13 + 7)
  }
  rowKV('Property Address', address || '—')
  rowKV('Parcel ID', parcelId || '—')
  rowKV('Owner of Record', seller)
  rowKV('Legal Description', legal)
  rowKV('Lot Size', acreage)
  rowKV('Zoning / Use', useDesc)
  rowKV('Assessed Value', assessed)

  // NOTE: any unverified fields are reported to Kevin via the X-Review-Flags
  // response header only — never printed on the customer-facing Exhibit "A".

  // Initials footer — two Seller initial lines + one Buyer initial line, no
  // signature lines and no date fields (per the contract's initial blocks).
  y -= 26
  ex.drawText('Seller and Buyer initial below to acknowledge this Exhibit "A" as the property described in the Contract.', { x: 56, y, size: 9, font, color: rgb(0.4, 0.45, 0.5) })
  y -= 44
  ex.drawText('Seller  ____________', { x: 56, y, size: 11, font, color: INK })
  ex.drawText('Seller  ____________', { x: 236, y, size: 11, font, color: INK })
  ex.drawText('Buyer  ____________', { x: 416, y, size: 11, font, color: INK })

  const bytes = await pdf.save()
  const fname = 'Adams-Homes-Offer-' + (address.split(',')[0] || 'lot').replace(/[^A-Za-z0-9]+/g, '-') + '.pdf'
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="' + fname + '"',
      'X-Review-Flags': String(review.length),
    },
  })
}

// Simple word-wrap for the Exhibit A values.
function wrap(s: string, max: number): string[] {
  const words = String(s || '').split(/\s+/)
  const out: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) { if (line) out.push(line); line = w }
    else line = (line ? line + ' ' : '') + w
  }
  if (line) out.push(line)
  return out.length ? out : ['—']
}
