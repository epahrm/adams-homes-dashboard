# Land Acq Pro — Requirements & Open Items

Living spec for the Palm Bay Lot Acquisition Platform. Updated as Elizabeth
reviews page by page.

## Done / in the current build
- Seller landing page (branded, logo top + footer, live county search, research
  lead capture, Kevin's photo/contact).
- Admin dashboard: password gate with Kevin/Elizabeth identity; compact stipend
  panel (editable defaults by utility type, audit log with who/when, per-lot
  snapshot, over-stipend flag); pipeline KPIs (Pending EP Sig, IP, Manager
  Driven, Survey Rcv'd, CD Approved, CTC, Closed MTD); accepted-contracts
  target; compact metrics (closed this month / pending / scheduled); closing
  calendar (this + next month) with clickable deals and monthly counts; New
  Leads inbox; active-only pipeline table.
- Shared backend: /api/land-acq/lots, /county, /settings.

## New batch (2026-07-06) — to build

### Offer packet & timelines (Page 3 / approval)
- [ ] Attach the **blank contract template** sent to sellers (Elizabeth to provide the file).
- [ ] **Cover letter from Kevin** — friendly, creates urgency; states the offer
      expires in 2 weeks.
- [ ] **Offer expiration date** = offer-generated date + 14 days (auto).
- [ ] **IP (inspection period) date** = Elizabeth's signature date + N days
      (N to be read from the contract).
- [ ] **Closing date** — we only close on **Thursdays**: contract shows a default
      closing date; actual close is the **Thursday before** it. (Needs the
      contract's IP length + days-to-close to compute the default date.)
- [ ] **Review the contract** to derive the timeline math (IP length, days to close).

### Deal metadata
- [ ] Track **off-market vs listed** per deal.
- [ ] Track **lead source** (mailer, email, QR, etc.).

### Signatures & notifications (seller signs first, Elizabeth signs last)
- [ ] E-sign via **Dotloop** using Kevin's login.
- [ ] Notify the **seller** when we **receive their signed contract**.
- [ ] Notify the **seller** when **Elizabeth signs** (so they know it's official).

### Files & property data
- [ ] **Upload function** on every lot file so Kevin can add documents.
- [ ] When a property is identified, include the **county property-appraiser
      property card** in the seller's email and back to Kevin.

## Needed from Elizabeth
- Blank contract template file (PDF/DOCX).
- Contract timeline rules: inspection-period length; days from acceptance/
  signature to the default closing date.
- Dotloop access details for Kevin's account (API/OAuth or manual-send).
- Email sending: which service (SendGrid, Gmail app password, etc.).

## Suggested additions (my "what else did you miss")
- **Key-date alerts**: offer expiring, IP ending, EP signature pending, closing
  this week — so nothing in a 50/month pipeline slips.
- **Next action + owner** per deal (Kevin / EP / GM / title co) with a due date.
- **Title/closing company** field + contact per deal.
- **EMD** already on the approval card; add proof-of-deposit upload.
- **Lost/declined reason** capture for analytics.
- **Financial roll-up**: projected $ closing this month / total under contract.
- **Per-deal activity log** (running notes/history), not just one notes field.
