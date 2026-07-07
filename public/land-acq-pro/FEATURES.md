# Land Acq Pro — Feature List

Palm Bay Lot Acquisition Platform. A running list of everything the system does,
kept up to date for review and to present to leadership. ✅ = built & working ·
🟡 = partial · 🔜 = planned.

---

## 1. Seller-facing landing page
- ✅ Public page with **zero admin/login exposure** (sellers never see the back office)
- ✅ **Knockout desktop hero** — layered navy gradient + architectural texture, two-column with a floating "100% Cash Offer" card
- ✅ Red **trust/stats band** — 35+ years, 75,000+ lots purchased, 100% cash, days to close
- ✅ On-brand (Adams Homes navy + red, "Value, Simplified™"), fully responsive on phone/tablet/desktop
- ✅ Property **search by owner name or address** against Brevard County records, with a research/fallback form when a property isn't found automatically
- ✅ Value props, "how it works" steps, and Kevin's introduction/contact
- ✅ QR-code entry point (postcard → scan → land here → search → offer)

## 2. Lead generation
- ✅ **Inbound:** QR postcard scans and landing-page submissions flow straight into Kevin's queue
- ✅ **On-market via saved-search email alerts** (the legal alternative to scraping): the system reads alert emails from Zillow, Realtor.com, Crexi, Land.com, LoopNet, RealtyTrac and parses each listing — address, price, acreage, MLS #, brokerage, link
  - ✅ Handles both "full-detail" alerts (address + price) and "link-only" alerts (Crexi)
  - ✅ Automatically ignores non–Palm Bay listings
- ✅ **Off-market county sweep** — dashboard tool that pulls vacant residential Palm Bay lots in the buy box straight from county records (owner + mailing address), with tunable filters (lot size, max land value, absentee-owners-only). Preview the count, **download the mailing list**, or add them to the worklist. ~14,000 absentee-owned buy-box lots available.
- 🟡 **On-market MLS/IDX feed** — pending confirmation of MLS access
- ✅ **CSV contact upload** — Kevin bulk-imports owner/mailer contact lists (dedupes automatically)
  - ✅ **Review-and-confirm step** — the upload shows exactly what will be added (address, owner, stage, offer) and flags rows already in the system; nothing enters the pipeline until Kevin clicks **Confirm & Add**
  - ✅ Optional **`Stage` column** so in-progress deals land at their real pipeline stage (mailer contacts default to the worklist)
- ✅ **Add existing deal/contract** — drop an in-progress deal into the pipeline at any stage

## 3. Buy box & green/yellow/red triage
- ✅ Locked **buy box**: Palm Bay ZIPs, vacant residential, 0.22–2 acres, utility rules, price ceilings
- ✅ **Stipends by utility type** (Well/Septic $30k, Water/Septic $30k, Water/Sewer $50k), editable with a full audit log
- ✅ Palm Bay lots **default to Well/Septic ($30k)** unless the listing says otherwise
- ✅ **$10k show-window** — shows lots up to $10k over stipend (offer & negotiate); excludes anything higher
- ✅ **Triage lights:** 🟢 ready to send · 🟡 review (over stipend, auction/foreclosure, flood zone, missing data) · 🔴 auto-rejected (logged with reason)
- ✅ Suggested offer always capped at the stipend

## 4. Daily offer worklist (no reliance on memory)
- ✅ **New Opportunities** queue — every showable lot with its light, reason, and suggested offer
- ✅ Per-lot actions: **Send Offer / Hold / Unsuitable**
- ✅ **Unsuitable = removed permanently** (the scan can never re-add it)
- ✅ **Seller declines → 30-day re-offer:** lot resurfaces in a **Re-offer Due** list prompting a follow-up if still listed

## 5. Offer & contract
- ✅ Kevin's **offer-approval screen**: deal details, stipend check, offer terms (3% commission, $100 EMD defaults), premiums, notes to Elizabeth
- ✅ **Specialty premiums** (corner $8k preset, extended driveway, waterview, no rear neighbor, oversized, cul-de-sac, other) — separate from stipend
- ✅ **Cover letter** auto-generated from Kevin (friendly + urgency, 14-day expiry)
- ✅ **Listing-agent auto-fill** for listed deals (name, brokerage, phone, email, MLS #) — offer routes to the agent
- ✅ Contract template attached to the offer packet; county property card included
- ✅ **Seller signs first, Elizabeth counter-signs last** (official) — legally safe order
- ✅ **Contract timeline math (VAC-14):** IP = Elizabeth's signature + 45 days; closing = 10 business days after IP; always the Thursday on/before
- 🟡 E-signature via **Dotloop** (Kevin sends via his login for now; full API integration is Phase 2)
- 🟡 **Email delivery** of offers (agent vs owner templates specified; manual for now, auto-send Phase 2)

## 6. County data (on-demand enrichment)
- ✅ When Kevin opens a lot to make an offer, the system **auto-pulls the county record** for that address
- ✅ Fills **owner name, owner mailing address, parcel #, acreage, land use**, and **confirms the lot is vacant** (flags any structure)
- ✅ Public City-of-Palm-Bay parcel data (no bot-wall); intersections without a street number are handled gracefully
- ✅ Completes a 🟡 "verify" lead into a ready-to-send offer packet

## 7. Realtor CRM
- ✅ Every listing agent/brokerage engaged becomes a tracked contact **automatically**
- ✅ Ranked by lot volume, with contact info and pipeline breakdown (to-offer / in-progress / closed)
- ✅ Stays in sync — derived from the deals, no manual data entry

## 8. Pipeline, dashboard & closing
- ✅ **Palm Bay Lot Pipeline** dashboard shared live between Kevin and Elizabeth
- ✅ KPI tiles: Pending EP Sig, IP, Manager Driven, Survey Rcv'd, CD Approved, CTC, Closed (MTD)
- ✅ **Closing calendar** (this month + next) with clickable deals and monthly counts
- ✅ Active-only deal table with status/day/source filters, pagination
- ✅ Monthly target tracker (50 accepted contracts/month)
- ✅ Off-market vs listed + lead-source tracking
- ✅ Lot document uploads + **Lot Notes** log
- ✅ Seller notifications logged on contract-received and when Elizabeth signs

## 9. Post-closing
- ✅ **Thank-you card** for closed deals — Elizabeth's designed **stork-delivering-a-home** artwork ("You helped deliver a dream home"), shown on the closed-deal screen with a Download-to-send/print button
  - 🔜 Optional later: personalize with the seller's name, and a matching referral ask

## 10. Data in/out
- ✅ **Export to CSV / PDF** of the pipeline
- ✅ **Import contacts (CSV)** and **Add Deal/Contract** (covered above)

## 11. Costs, ROI & renewals (business operations)
- ✅ **Costs, ROI & Renewals panel** in the dashboard — a live money view shared by Kevin and Elizabeth
- ✅ **Accounts & Subscriptions tracker** — every paid data site / tool / vendor with its **login, cost, billing cycle (monthly/annual/one-time/"confirm RI"), and next renewal date**; renewals due within 30 days are flagged so nothing lapses
  - 🔒 **Passwords are not stored** — a "credential location" field points at your shared password manager instead (security by design)
- ✅ **Postcard / mailing costs** — per-batch log with **print cost and postage kept as separate lines**, rolled up to a running total + total postage
- ✅ **ROI tiles** — Deals Contracted · Mailing Spend · **Cost per Contract** (mail spend ÷ contracts) · Subscriptions/yr · Cancellations
- ✅ **Cancelled-contract tracker** — log terminated contracts with a **reason** (Location, Neighbor, Soils, Endangered species, Title/fraud, Other) and see the reason breakdown at a glance
- ✅ **Commission tracker (Adams Homes)** — buyer-side commission on **on-market (listed) deals only** (off-market = $0). Default **3%**, Kevin confirms per deal (it can vary), shown live in dollars as a **cash-to-close deduction**. The dashboard rolls up **total commission held, average %, and how many deals kept the full 3% vs. were reduced/waived** — so leadership can see whether Kevin is holding the rate or giving it away

## 12. Platform
- ✅ Hosted on Vercel + shared Supabase Postgres (Kevin & Elizabeth see one live pipeline)
- ✅ Password-gated admin with Kevin/Elizabeth role toggle; offline demo mode for previews
- ✅ Security: seller page has no admin surface, all data rendered XSS-safe, public submissions can't set pipeline stage
- ✅ **91-check automated QA suite**, run on every change

---

## 13. Postcard / QR campaign (mailer engine)
- ✅ **Postcard/QR tool** in the dashboard — name a batch, pick the recipient pool
- ✅ **Batch QR code** generated (navy, print-quality) to drop on the postcard artwork; downloadable PNG
- ✅ **Per-property QR sheet** (printable) — each lot gets a unique QR for per-lot scan tracking / variable-data mailing
- ✅ **Mailing-list CSV export** (owner + mailing address + property) for the print/mail vendor
- ✅ **Scan tracking** — when an owner scans a postcard QR and lands on the site, the scan is logged to that lot/batch
- ✅ Postcard artwork **upload placeholders** (front/back) — you design the art; real file storage is on the launch checklist
- 🔜 Full campaign analytics (scans-over-time, conversion funnel, template A/B), opt-out management

## Planned next (in priority order)
- 🔜 **Nightly auto-run** of the off-market sweep + email ingest (the sweep tool itself is built)
- 🔜 **Motivation ranking** — prioritize out-of-area / long-tenure / tax-delinquent owners
- 🔜 **"Needs attention" alerts** — offers pending, IP dates, Thursday closings due
- 🔜 **Automated email send** (offer distribution) + **admin settings** page (editable contact, company info, default offer/EMD/commission)
- 🔜 **Source/board/campaign ROI reports**; **multi-market expansion** (Poinciana, Port St. Lucie, Okeechobee, Palm Coast)
