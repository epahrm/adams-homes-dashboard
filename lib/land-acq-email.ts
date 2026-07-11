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
  mls?: string | null
  brokerage?: string | null
  agentName?: string | null
  agentPhone?: string | null
  agentEmail?: string | null
  agentLicense?: string | null
  daysOnMarket?: number | null
  // true when the email had no street address (link-only alert, e.g. Crexi):
  // the lead still lands, flagged for Kevin to open the listing and confirm.
  needsAddress?: boolean
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

// Extract agent details from email body (name, phone, email, license).
// Looks for patterns like "Listing Agent: Name", phone numbers, emails, and license #.
// If window is provided, extracts agent info from that specific listing's context window.
function extractAgentDetails(body: string, window?: string): {
  agentName?: string
  agentPhone?: string
  agentEmail?: string
  agentLicense?: string
} {
  const result: Record<string, string> = {}
  // Search in provided window (per-listing context) if given; otherwise search full body.
  // Caller handles fallback by merging email-level and listing-level extraction.
  const searchText = window || body

  // Agent name: look for "Listed by:", "Listing Agent:", or "Agent:" followed by name.
  // "Listed by: Eddy Desir 954-272-8123" is the standard Zillow format.
  // More flexible: allow lowercase start, single-word names, better apostrophe handling.
  let m = searchText.match(/(?:Listed\s+by|Listing\s+Agent|Agent)\s*:?\s*([A-Z][A-Za-z\s.'-]{1,45}?)(?:\s+\d|\n|,|$)/i)
  if (m) {
    let name = m[1].trim()
    // Remove trailing "Phone", "Email", etc. if accidentally included
    name = name.replace(/\s+(Phone|Email|License|Mobile|Tel|Brokerage).*$/i, '')
    if (name.length > 2) result.agentName = name
  }

  // Phone: look for (XXX) XXX-XXXX or XXX-XXX-XXXX or similar patterns
  // Match phone labels + the phone number up to a newline
  m = searchText.match(/(?:Phone|Mobile|Tel)\s*:?\s*([\d\s\-().+]+?)(?:\n|$)/i)
  if (m) {
    const phone = m[1].trim()
    // Only keep if it looks like a valid phone (has at least 10 digits)
    if (/\d{10,}/.test(phone.replace(/\D/g, ''))) {
      result.agentPhone = phone
    }
  }

  // Email: look for email addresses (standard format)
  m = searchText.match(/(?:Email|Contact)\s*:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  if (m) result.agentEmail = m[1].trim()

  // License: look for license # patterns like "License #" or "License:" or "Lic #"
  // Typically FL licenses are 2 uppercase letters + digits, or just a number
  m = searchText.match(/(?:License|Lic\.?)\s*#?\s*:?\s*([A-Z0-9]{4,20}?)(?:\n|$)/i)
  if (m) result.agentLicense = m[1].trim()

  return result
}

// Extract days on market (DOM) from email body.
// Looks for patterns like "1 day on Zillow" or "5 days on Market".
// Falls back to calculating DOM from listing date if explicit DOM not found.
function extractDaysOnMarket(body: string): number | null {
  // First try explicit "X days on market" pattern
  let m = body.match(/(\d+)\s+days?\s+on\s+(?:zillow|market|site)/i)
  if (m) return parseInt(m[1], 10)

  // Fallback: look for listing date (common patterns: "Listed", "List Date", "Date Listed", etc.)
  // Match dates like "2026-07-08", "July 8", "7/8/2026", "07/08/2026"
  m = body.match(/(?:listed|list\s+date|date\s+listed|on\s+market)\s*:?\s*([A-Za-z]+ \d{1,2}(?:,? \d{4})?|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i)
  if (m) {
    try {
      const listDate = new Date(m[1])
      if (!isNaN(listDate.getTime())) {
        const today = new Date()
        const dom = Math.floor((today.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24))
        return dom >= 0 ? dom : null
      }
    } catch (e) {
      // Date parsing failed, return null
    }
  }

  return null
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
  const emailAgentDetails = extractAgentDetails(body) // Email-level fallback
  const daysOnMarket = extractDaysOnMarket(body)

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
    // Acreage/size follows the address; expand window for agent info extraction.
    const postWin = body.slice(cur.end, Math.min(nextIdx, cur.end + 240))
    // Expanded context window for per-listing agent extraction
    const agentWin = body.slice(cur.idx, Math.min(nextIdx, cur.end + 300))
    // Try to extract agent info from this listing's context; fall back to email-level
    const agentDetails = Object.assign({}, emailAgentDetails, extractAgentDetails(body, agentWin))
    let price = lastPrice(preWin)
    if (price == null) price = lastPrice(postWin)

    const acresM = postWin.match(ACRES_RE) || preWin.match(ACRES_RE)
    const sqftM = !acresM ? postWin.match(SQFT_RE) : null

    // Match the URL whose slug contains this listing's street number.
    const url = urls.find((u) => cur.num && u.includes(cur.num)) || urls.find((u) => /homedetail|listing|property|\/homes\//i.test(u)) || null

    // Realtor / MLS from the listing footer, e.g.
    // "MLS ID #1059125. Space Coast AOR" or "MLS ID #2026019833, Keller Williams Island Life RE. Florida Gulf Coast MLS"
    const mlsM = postWin.match(/MLS\s*ID?\s*#?\s*([A-Z0-9][A-Z0-9-]{3,})/i)
    const brokM = postWin.match(/MLS\s*ID?\s*#?\s*[A-Z0-9-]+\s*[.,]\s*([A-Z][A-Za-z0-9 &'./-]+?)(?:\.\s|\.$|$)/i)

    out.push({
      address: cur.addr,
      listPrice: price,
      acres: acresM ? parseFloat(acresM[1]) : sqftM ? +(toNum(sqftM[1]) / 43560).toFixed(2) : null,
      url,
      source,
      mls: mlsM ? mlsM[1] : null,
      brokerage: brokM ? brokM[1].trim() : null,
      agentName: agentDetails.agentName,
      agentPhone: agentDetails.agentPhone,
      agentEmail: agentDetails.agentEmail,
      agentLicense: agentDetails.agentLicense,
      daysOnMarket,
    })
  }

  // Fallback for link-only alerts (Crexi et al.) that carry no street address —
  // capture the listing title, city, acreage, and the "View Property" link so
  // the lead still reaches Kevin, flagged to open and confirm.
  if (out.length === 0) out.push(...parseCardAlerts(rawHtml, body, source, agentDetails, daysOnMarket))
  return out
}

// Title (no sentence punctuation, so it can't swallow the notice text) +
// "Palm Bay, FL" + "Land | N acres".
const CARD_RE =
  /([A-Z0-9][A-Za-z0-9 '&/-]{2,48}?)\s+(Palm\s*Bay)\s*,?\s*FL\s+Land\s*[|·\-–]\s*([\d.]+)\s*acres?/gi

function parseCardAlerts(rawHtml: string, body: string, source: string, agentDetails: ReturnType<typeof extractAgentDetails>, daysOnMarket: number | null): ParsedListing[] {
  const out: ParsedListing[] = []
  const seen = new Set<string>()
  // "View Property" links point at each listing (portal tracking URLs).
  const propUrls: string[] = []
  let hm: RegExpExecArray | null
  const viewRe = /<a[^>]+href=["']?(https?:\/\/[^"'\s>]+)[^>]*>(?:[^<]|<(?!\/a))*?View\s+Property/gi
  while ((hm = viewRe.exec(rawHtml)) !== null) propUrls.push(hm[1])

  let m: RegExpExecArray | null
  let n = 0
  CARD_RE.lastIndex = 0
  while ((m = CARD_RE.exec(body)) !== null) {
    const title = m[1].replace(/\s+/g, ' ').trim()
    const acres = parseFloat(m[3])
    const key = (title + acres).toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      address: title + ' — Palm Bay, FL',
      listPrice: null,
      acres: Number.isFinite(acres) ? acres : null,
      url: propUrls[n] || propUrls[0] || null,
      source,
      agentName: agentDetails.agentName,
      agentPhone: agentDetails.agentPhone,
      agentEmail: agentDetails.agentEmail,
      agentLicense: agentDetails.agentLicense,
      daysOnMarket,
      needsAddress: true,
    })
    n++
  }
  return out
}
