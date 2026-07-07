import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/land-acq-db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

// Admin: read an uploaded receipt (mailing/print invoice) and pull the fields
// we can — vendor, date, total amount, and piece count — so Kevin/Elizabeth can
// confirm and drop it into the Postcard / Mailing Costs log. Best-effort: the UI
// shows the guesses for review before saving. Text-based PDFs read cleanly;
// photos/scans (JPEG) have no selectable text, so those come back for manual
// entry (the file is still attached by name).

function firstMatch(re: RegExp, text: string): string | null {
  const m = text.match(re)
  return m ? (m[1] || m[0]).replace(/\s+/g, ' ').trim() : null
}

// Total/amount due -> "$1,234.56" style string.
function extractAmount(text: string): string | null {
  const ctx = text.match(/(?:total|amount due|balance due|grand total|invoice total)[^$0-9]{0,20}\$?\s?([\d,]+(?:\.\d{2})?)/i)
  if (ctx) return '$' + ctx[1].replace(/,/g, '')
  const any = [...text.matchAll(/\$\s?([\d,]+(?:\.\d{2})?)/g)]
    .map((m) => Number(m[1].replace(/,/g, '')))
    .filter((n) => n > 0 && n <= 1000000)
  if (any.length) return '$' + Math.max(...any).toLocaleString('en-US')
  return null
}

// Receipt/invoice date -> ISO (yyyy-mm-dd) for the date field.
function extractDate(text: string): string | null {
  const near = text.match(
    /(?:date|invoice date|order date|billed|paid on)[^A-Za-z0-9]{0,12}((?:[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})|(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}))/i
  )
  const raw = near ? near[1]
    : firstMatch(/\b([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\b/, text)
    || firstMatch(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/, text)
  if (!raw) return null
  const d = new Date(raw.replace(/(\d)(st|nd|rd|th)/i, '$1'))
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

// Piece / quantity count for a mailing.
function extractPieces(text: string): string | null {
  const m = text.match(/(?:pieces|qty|quantity|count|postcards|mailers)[^\n$0-9]{0,12}([\d,]{2,7})/i)
    || text.match(/([\d,]{2,7})\s*(?:pieces|postcards|mailers|pcs)\b/i)
  return m ? m[1].replace(/,/g, '') : null
}

// Vendor / business name — the first substantial line that isn't a date,
// amount, or generic header.
function extractVendor(text: string): string | null {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  for (const line of lines.slice(0, 8)) {
    if (/^\$?[\d,.\s]+$/.test(line)) continue                 // just numbers
    if (/^(invoice|receipt|order|date|bill|statement|tax)\b/i.test(line)) continue
    if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(line)) continue // a date line
    const letters = (line.match(/[A-Za-z]/g) || []).length
    if (letters >= 3 && line.length <= 50) return line.replace(/[|,]+$/, '').trim()
  }
  return null
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request.headers.get('x-admin-key'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let file: File | null = null
  try {
    const form = await request.formData()
    const f = form.get('file')
    if (f instanceof File) file = f
  } catch {
    return NextResponse.json({ error: 'Expected a file upload' }, { status: 400 })
  }
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 15 MB)' }, { status: 400 })

  const isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)
  // Photos/scans carry no selectable text — accept the attachment but let the
  // user enter the amounts. (Server-side image OCR isn't available here.)
  if (!isPdf) {
    return NextResponse.json({
      ok: true, fields: {}, fileName: file.name,
      note: 'Image attached. Auto-read works on PDF receipts — enter the amounts for this one.'
    })
  }

  try {
    const { getDocumentProxy, extractText } = await import('unpdf')
    const buf = new Uint8Array(await file.arrayBuffer())
    const pdf = await getDocumentProxy(buf)
    const { text } = await extractText(pdf, { mergePages: true })
    const flat = String(text || '').replace(/ /g, ' ')
    if (!flat.trim()) {
      return NextResponse.json({ ok: true, fields: {}, fileName: file.name, note: 'No selectable text found — enter the details manually.' })
    }
    const fields = {
      vendor: extractVendor(flat),
      date: extractDate(flat),
      amount: extractAmount(flat),
      pieces: extractPieces(flat),
    }
    return NextResponse.json({ ok: true, fields, fileName: file.name })
  } catch (e) {
    console.error('[land-acq] parse-receipt failed:', e)
    return NextResponse.json({ error: 'Could not read that receipt — enter the details manually.' }, { status: 422 })
  }
}
