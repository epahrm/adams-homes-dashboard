// Parses listing-alert emails (saved-search alerts the portals send us) into
// candidate lots. This is the sanctioned way to cover sites that prohibit
// scraping: we only read the emails they legitimately send to our inbox.
//
// It extracts what is present IN the email text — address, price, acreage,
// and the listing link. Anything the email doesn't contain is left blank and
// gets flagged for review downstream (never auto-fetched from the portal).
//
// Source-specific tuning happens once we have real sample emails; the generic
// text extractor below is the fallback that already handles most alert formats.

export type ParsedListing = {
  address: string
  listPrice: number | null
  acres: number | null
  url: string | null
  source: string
}

const SENDER_SOURCE: Array<[RegExp, string]> = [
  [/zillow\.com/i, 'Zillow'],
  [/realtor\.com/i, 'Realtor.com'],
  [/crexi\.com/i, 'Crexi'],
  [/land\.com|landsofamerica|landwatch/i, 'Land.com'],
  [/loopnet\.com|costar/i, 'LoopNet'],
  [/realtytrac\.com/i, 'RealtyTrac'],
]

export function sourceFromSender(from: string): string {
  for (const [re, name] of SENDER_SOURCE) if (re.test(from)) return name
  return 'Portal Alert'
}

// Strip HTML to visible text so the same patterns work on HTML or plain emails.
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const PALM_BAY = /\bPalm\s*Bay\b/i

// A US street address ending in Palm Bay, FL + a 5-digit ZIP. The lookbehind
// stops a price fragment ("$28,000") from being read as the street number.
const ADDRESS_RE =
  /(?<![\d,$])(\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,5}?)\s*,?\s*Palm\s*Bay\s*,?\s*FL\s*(\d{5})/gi
const PRICE_G = /\$\s?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,7})\b/g
const ACRES_RE = /([0-9]+(?:\.[0-9]+)?)\s*ac(?:re|res|\.)?\b/i
const SQFT_RE = /([0-9]{1,3}(?:,?[0-9]{3})|[0-9]{4,7})\s*sq\.?\s*ft/i

function toNum(s: string): number {
  return parseInt(s.replace(/[^0-9]/g, ''), 10)
}

// Pull candidate listing URLs out of the raw HTML (href attributes + bare
// links) before tags are stripped, so we can match each listing to its link.
function extractUrls(html: string): string[] {
  const urls: string[] = []
  let m: RegExpExecArray | null
  const href = /href\s*=\s*["']?(https?:\/\/[^"'\s>]+)/gi
  while ((m = href.exec(html)) !== null) urls.push(m[1])
  const bare = /https?:\/\/[^\s"'<>]+/gi
  while ((m = bare.exec(html)) !== null) urls.push(m[0])
  return urls
}

// The last price appearing in a window (portal alerts put price just before
// the address); returns null if none.
function lastPrice(win: string): number | null {
  let m: RegExpExecArray | null
  let last: string | null = null
  PRICE_G.lastIndex = 0
  while ((m = PRICE_G.exec(win)) !== null) last = m[1]
  return last ? toNum(last) : null
}

// Split a listing-alert email into per-listing chunks around each address so
// price/acreage/url are matched to their own listing, not a neighbour's.
export function parseListingEmail(input: {
  from: string
  subject?: string
  html?: string
  text?: string
}): ParsedListing[] {
  const source = sourceFromSender(input.from)
  const rawHtml = input.html || ''
  const body =
    input.text && input.text.length > rawHtml.length / 3
      ? input.text
      : htmlToText(rawHtml || input.text || '')
  if (!PALM_BAY.test(body)) return []
  const urls = extractUrls(rawHtml)

  const matches: Array<{ addr: string; num: string; idx: number; end: number }> = []
  let m: RegExpExecArray | null
  ADDRESS_RE.lastIndex = 0
  while ((m = ADDRESS_RE.exec(body)) !== null) {
    const street = m[1].replace(/\s+/g, ' ').trim()
    matches.push({
      addr: street + ', Palm Bay, FL ' + m[2],
      num: (street.match(/^\d+/) || [''])[0],
      idx: m.index,
      end: m.index + m[0].length,
    })
  }

  const out: ParsedListing[] = []
  const seen = new Set<string>()
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i]
    const key = cur.addr.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.has(key)) continue
    seen.add(key)

    const prevEnd = i > 0 ? matches[i - 1].end : 0
    const nextIdx = i + 1 < matches.length ? matches[i + 1].idx : body.length
    // Price sits just before the address; look back but not into the prior listing.
    const preWin = body.slice(Math.max(prevEnd, cur.idx - 140), cur.idx)
    // Acreage/size follows the address.
    const postWin = body.slice(cur.end, Math.min(nextIdx, cur.end + 240))
    let price = lastPrice(preWin)
    if (price == null) price = lastPrice(postWin)

    const acresM = postWin.match(ACRES_RE) || preWin.match(ACRES_RE)
    const sqftM = !acresM ? postWin.match(SQFT_RE) : null

    // Match the URL whose slug contains this listing's street number.
    const url = urls.find((u) => cur.num && u.includes(cur.num)) || urls.find((u) => /homedetail|listing|property|\/homes\//i.test(u)) || null

    out.push({
      address: cur.addr,
      listPrice: price,
      acres: acresM ? parseFloat(acresM[1]) : sqftM ? +(toNum(sqftM[1]) / 43560).toFixed(2) : null,
      url,
      source,
    })
  }
  return out
}
