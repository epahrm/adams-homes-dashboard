# Market Scan & Buy-Box Triage

Finds vacant lots that fit the buy box, scores each one, and drops the good
ones on Kevin's dashboard with a green/yellow/red light and a pre-filled offer.

## Price show-window
Show every lot up to **$10,000 over the stipend** (Kevin offers his stipend and
negotiates). Lots more than $10k over are excluded.
- 🟢 **GREEN — ready to send:** at/under stipend, meets every rule, no flags.
- 🟡 **YELLOW — review/negotiate:** $1–$10k over stipend, OR a flag (auction/
  foreclosure, flood zone A/AE, HOA, easement), OR (off-market only) missing
  owner/parcel. On-market listings reach the seller via the listing agent and
  the parcel is pulled at offer time, so those don't need owner/parcel to go
  green.
- 🔴 **RED — excluded:** more than $10k over stipend, or fails a hard rule
  (structure, wrong zoning, size outside 0.25–2 ac, wetlands, landlocked,
  deed-restricted). Logged with the reason, not shown as an opportunity.

Suggested offer is always capped at the stipend.

## Daily worklist (so nothing rides on memory)
Every showable lot stays in the **New Opportunities** queue until Kevin acts:
- **Send Offer** → opens the offer screen for that lot.
- **Hold** → parks it (`opportunity-hold`).
- **Unsuitable** → `dismissed`: removed and **never shown again**. The row is
  kept so the unique address key blocks the scan from ever re-adding it.

**Seller declines an offer →** the lot becomes `offer-denied` with a
`nextReviewAt` 30 days out. When that date arrives it surfaces in the
**Re-offer Due** section prompting Kevin to send another offer if it's still
listed (**Reviewed — 30d** re-arms the timer; **Unsuitable** drops it).

## Data sources — the honest version
Live-scraping the big portals is **not** a durable foundation:
- **BCPAO** (county appraiser site) is behind a **Cloudflare bot-wall** — returns
  a 403 to automated requests. Confirmed live.
- **Zillow / Realtor.com / LoopNet** prohibit automated scraping in their terms
  and actively block bots — fragile and a legal/ToS risk for Adams Homes.

Use legitimate, queryable data instead:

| Need | Source | Status |
| --- | --- | --- |
| **Off-market** buy-box lots | **FL DOR statewide assessment roll** (ArcGIS FeatureServer) — the same authoritative county data, exposed as a real API. Fields: land-use code, land value, acreage, situs address/ZIP, owner, parcel, last-sale year. | **Validated** — queryable, no bot-wall |
| **On-market** listings | **MLS / IDX feed** (Space Coast REALTORS or an IDX/RETS/Spark provider) | Pending — confirm access |

FL DOR layer: `services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0`
(Brevard = `CO_NO` 5; vacant residential = `DOR_UC` `000`.)

## Buy box (Palm Bay pilot — edit `BUY_BOX` in admin.html)
- **ZIPs:** 32905, 32906, 32907, 32908, 32909
- **Type:** vacant residential lots only (no structures)
- **Lot size:** 0.25–2 acres (ideal 0.5)
- **Utilities:** Well/Septic, City Water/Septic, or City Water/City Sewer
  (not septic-only, well-only, shared, or mobile-home)
- **Default offer:** $30,000 cash (Kevin can override); over-stipend → yellow
- **Red flags:** wetlands, landlocked, deed restriction, non-residential zoning
- **Yellow flags:** flood zone A/AE, HOA, minor easement

## Portal alerts (sites that prohibit scraping)
Instead of scraping Zillow / Realtor.com / LoopNet / Crexi / Land.com /
RealtyTrac, we use each site's own **saved-search email alerts** — a feature
they offer — pointed at a dedicated Gmail. Reading mail sent to us is not
scraping and violates no terms.

Pipeline: **Gmail inbox → `/api/land-acq/ingest-email` → parse → buy-box triage
→ `opportunity` lots**. Built and wired:
- `lib/land-acq-email.ts` — parses listing address / price / acreage / URL out
  of the alert email text (source-agnostic; ignores non-Palm-Bay listings).
- `app/api/land-acq/ingest-email/route.ts` — reads unread alerts over IMAP,
  scores each with `scoreBuyBox`, inserts green/yellow matches as opportunities
  (deduped by address), logs reds, marks the message read.
- `vercel.json` cron runs it daily (`0 11 * * *` = 7 AM ET; change to taste).

### Environment variables (add in Vercel → Settings → Environment Variables)
- `LANDACQ_GMAIL_USER` — the dedicated Gmail address
- `LANDACQ_GMAIL_APP_PASSWORD` — a Gmail **app password** (needs 2-Step on)
- `CRON_SECRET` — any random string; lets the scheduled job authenticate
  (Vercel sends it as `Authorization: Bearer …`)

Until those are set the endpoint returns `{ configured: false }` and does
nothing — safe to deploy before the mailbox is ready.

### Two alert-email shapes (learned from a real Crexi alert)
- **Address-inline** (Zillow, Realtor.com): the email lists street address +
  price per property → full parse + auto-triage + suggested offer.
- **Link-only** (Crexi and similar): the email gives only title + city +
  acreage + a "View Property" link — no street address or price. The parser
  captures those and files a 🟡 lead ("open listing to confirm"); Kevin clicks
  through to get the address/price. (Crexi also skews commercial/multifamily,
  often outside the residential buy box.)

### Honest status
- Buy-box scorer + email parser: **built and unit-tested** against a realistic
  Zillow sample *and the real Crexi alert format* — correct per-listing
  price/acreage/URL, non-Palm-Bay listings dropped, link-only cards handled.
- IMAP fetch: **can't be tested from the build sandbox** (no non-HTTPS egress) —
  validated on the first real deploy + alert.
- Still want a real **Zillow/Realtor** alert to confirm their exact address +
  price markup; the parser handles the common structure already.

## Next steps to go live
1. Set the three env vars above; set up one saved-search alert → dedicated Gmail.
2. Forward the first real alert so the parser can be tuned to the exact format.
3. Confirm MLS/IDX access (unlocks the richer on-market feed).
4. Build `/api/land-acq/market-scan` for the FL DOR off-market feed (same
   insert-as-`opportunity` pattern), on its own daily cron.
5. Notify Kevin of new opportunities (wire once outbound email is turned on).
