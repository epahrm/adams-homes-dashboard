# Market Scan & Buy-Box Triage

Finds vacant lots that fit the buy box, scores each one, and drops the good
ones on Kevin's dashboard with a green/yellow/red light and a pre-filled offer.

## Green / Yellow / Red triage
- 🟢 **GREEN — ready to send:** meets every buy-box rule, offer at/under
  stipend, no flags.
- 🟡 **YELLOW — review:** buyable but needs a look — offer/asking over stipend,
  a yellow flag (flood zone A/AE, HOA, minor easement), or missing data.
- 🔴 **RED — auto-rejected:** fails a hard rule (wrong zoning, has a structure,
  disallowed utilities, size outside 0.25–2 ac, wetlands, landlocked,
  deed-restricted). Logged with the reason, not shown as an opportunity.

Kevin acts on each: **Add to Pipeline** (becomes a lead), **Hold**, or **Skip**.

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

## Next steps to go live
1. Confirm MLS/IDX access (unlocks the on-market feed).
2. Build the `/api/land-acq/market-scan` endpoint: query the FL DOR layer for
   Palm Bay vacant residential in the value range, de-dupe by parcel against
   existing lots, insert new matches as `status: 'opportunity'`.
3. Schedule it (Vercel Cron) — the handoff spec's Tuesday 2 AM cadence.
4. Notify Kevin of new opportunities (wire once email is turned on).

Today the dashboard scores and triages opportunities from seeded scan results;
wiring step 2 swaps the seed for the live feed with no UI changes.
