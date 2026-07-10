import { DEFAULT_STIPENDS } from './land-acq-db'

// Buy box — locked purchasing filters for the Palm Bay pilot. Every candidate
// lot (from the FL DOR feed, the MLS feed, or a portal alert email) is scored
// against these before it reaches Kevin's dashboard. Mirrors the client-side
// evaluateBuyBox in public/land-acq-pro/admin.html.

export const BUY_BOX = {
  zips: ['32905', '32906', '32907', '32908', '32909'],
  // Palm Bay minimum lot size. Standard platted lots are ~0.23 ac; set to 0.22
  // for now to include them (adjust here if the target lot size changes).
  minAcres: 0.22,
  maxAcres: 2,
  defaultOffer: 30000, // starting cash offer; Kevin can override
  showWindow: 10000, // show lots up to $10k over stipend (offer & negotiate)
  floodReview: ['A', 'AE'], // insurable but needs sign-off
}

export type Lot = {
  address?: string
  acres?: number
  lotSize?: string
  utilities?: string
  utilityType?: string
  lotStipend?: number
  offerSuggested?: number
  listPrice?: number
  zoningClass?: string
  listStatus?: string
  agentBrokerage?: string
  hasStructure?: boolean
  wetlands?: boolean
  landlocked?: boolean
  deedRestricted?: boolean
  floodZone?: string
  hoa?: boolean
  minorEasement?: boolean
  parcel?: string
  owner?: string
  ownerContact?: string
}

export type Triage = { light: 'green' | 'yellow' | 'red'; reasons: string[]; offer: number }

const money = (n: number) => '$' + Number(n || 0).toLocaleString('en-US')

export function acresOf(l: Lot): number | null {
  if (typeof l.acres === 'number') return l.acres
  const m = String(l.lotSize || '').match(/([\d.]+)\s*acre/i)
  return m ? parseFloat(m[1]) : null
}

export function inferUtilityType(l: Lot): string {
  if (l.utilityType) return l.utilityType
  const u = (l.utilities || '').toLowerCase()
  // Palm Bay default: assume Well/Septic ($30k stipend) unless the listing
  // specifies city water/sewer.
  if (!u) return 'well-septic'
  const water = /water:\s*city|city water|water:\s*available/.test(u) && !/water:\s*none/.test(u)
  const sewer = /sewer:\s*city|city sewer/.test(u) && !/sewer:\s*none/.test(u)
  if (water && sewer) return 'water-sewer'
  if (water && !sewer) return 'water-septic'
  return 'well-septic'
}

export function lotStipend(l: Lot, defaults: Record<string, number> = DEFAULT_STIPENDS): number | null {
  if (typeof l.lotStipend === 'number') return l.lotStipend
  const t = inferUtilityType(l)
  return t ? defaults[t] : null
}

// green = meets every rule, at/under stipend, no flags → ready to send
// yellow = buyable but needs review (over stipend, a yellow flag, missing data)
// red = fails a hard rule → auto-rejected, logged
export function scoreBuyBox(l: Lot, defaults: Record<string, number> = DEFAULT_STIPENDS): Triage {
  const red: string[] = []
  const yellow: string[] = []
  const acres = acresOf(l)
  const stipend = lotStipend(l, defaults)
  // The asking price (on-market) drives the show window; fall back to the
  // suggested/default offer when there is no list price.
  const price =
    typeof l.listPrice === 'number'
      ? l.listPrice
      : typeof l.offerSuggested === 'number'
        ? l.offerSuggested
        : BUY_BOX.defaultOffer
  // Suggested offer never exceeds the stipend (Kevin offers his max and negotiates).
  const offer = stipend != null ? Math.min(price, stipend) : price

  // Price show-window: >$10k over stipend is excluded; within $10k needs review.
  if (stipend != null && price > stipend + BUY_BOX.showWindow)
    red.push('Asking ' + money(price) + ' is over ' + money(BUY_BOX.showWindow) + ' above ' + money(stipend) + ' stipend')

  if (l.hasStructure) red.push('Has a structure (not a vacant lot)')
  if (l.zoningClass && !/resid/i.test(l.zoningClass)) red.push('Zoning not residential')
  if (acres != null && (acres < BUY_BOX.minAcres || acres > BUY_BOX.maxAcres))
    red.push('Lot ' + acres + ' ac outside ' + BUY_BOX.minAcres + '–' + BUY_BOX.maxAcres + ' ac')
  if (l.wetlands) red.push('Wetlands on parcel')
  if (l.landlocked) red.push('No road access (landlocked)')
  if (l.deedRestricted) red.push('Deed restriction prohibits builder')
  if (/shared|mobile/i.test(l.utilities || '')) red.push('Utilities not acceptable (shared/mobile)')

  if (stipend != null && price > stipend && price <= stipend + BUY_BOX.showWindow)
    yellow.push(money(price) + ' is ' + money(price - stipend) + ' over ' + money(stipend) + ' stipend — offer & negotiate')
  if (l.floodZone && BUY_BOX.floodReview.includes(String(l.floodZone).toUpperCase()))
    yellow.push('Flood zone ' + l.floodZone + ' — insurable, needs sign-off')
  if (l.hoa) yellow.push('HOA restriction')
  if (l.minorEasement) yellow.push('Minor easement')
  if (/auction|foreclos/i.test(l.listStatus || '')) yellow.push('Auction/foreclosure — review process')
  // On-market listings reach the seller through the listing agent, and the
  // parcel is pulled at offer time — so only off-market leads need owner/parcel
  // before they can go green.
  const onMarket = typeof l.listPrice === 'number' || !!l.agentBrokerage || /listing|active|auction/i.test(l.listStatus || '')
  if (!onMarket && (!l.parcel || !(l.ownerContact || l.owner)))
    yellow.push('Missing owner/parcel — verify before offer')

  const light = red.length ? 'red' : yellow.length ? 'yellow' : 'green'
  const reasons = red.length ? red : yellow.length ? yellow : ['Meets every buy-box rule — ready to send']
  return { light, reasons, offer }
}
