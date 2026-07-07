# Lead Source Access — Running List

How each source feeds the system, what account/access it needs, and status.

**Important:** the app does **not** log into the listing portals (that would be
scraping / against their terms). Instead it reads the **saved-search alert
emails** those portals send to the dedicated inbox. So "access" = *you* create a
free account on each portal and point its alert emails at
**`landacq.leads@gmail.com`**. I read the emails, not the sites.

## On-market portals — email-alert feeds
| Source | Account | Cost | What to do | Status |
| --- | --- | --- | --- | --- |
| **Zillow** | Free | Free | Saved search (Palm Bay land) → email alerts → `landacq.leads@gmail.com` | Parser ✅ confirmed on a real Zillow listing |
| **Realtor.com** | Free | Free | Saved search → alerts → Gmail | Parser ready (same format); need one real alert to confirm |
| **Crexi** | Free | Free | Saved search → alerts → Gmail | Parser ✅ confirmed (you already get Crexi alerts) — repoint to the Gmail |
| **Land.com** (LandWatch / Lands of America) | Free | Free | Saved search → alerts → Gmail | Same pipeline; confirm on first alert |
| **LoopNet** | Free | Free | Saved search → alerts → Gmail | Same pipeline (commercial-heavy) |
| **RealtyTrac** (foreclosures) | **Paid** | ~$30–50/mo | Only if you want foreclosure leads; else skip (county court records are free) | Optional — flag if you want it |
| **MLS / IDX** | Via broker | Membership/feed | Confirm IDX/RETS/Spark access through Kevin/broker | ⏳ Pending your IDX answer |

## Public sources — no account, already wired
| Source | Access | Status |
| --- | --- | --- |
| **Brevard County / City of Palm Bay parcel + assessment data** | Public GIS API — no login | ✅ **Integrated.** Powers the on-demand county lookup at offer time AND the off-market mailer sweep (~14,000 absentee buy-box lots) |
| **Brevard County court records** (foreclosure filings) | Public records | 🔜 Not wired yet (later phase); free |

## What access *I* currently have
- ✅ **County / parcel data** — live, free, no account (built in).
- 🟡 **Dedicated Gmail** (`landacq.leads@gmail.com`) — you created it + an app
  password; I get access once the app password + `CRON_SECRET` are set as Vercel
  env vars (then the app reads the alert inbox).
- ❌ **Portal logins** (Zillow/Realtor/Crexi/Land.com/LoopNet/RealtyTrac) — I do
  **not** have or need these. You own free accounts; the system reads their
  alert emails. This is the legal, durable design.

## Your to-do to light up the on-market feed
1. Create/keep free accounts on Zillow, Realtor.com, Crexi, Land.com, LoopNet.
2. On each, save a **Palm Bay vacant land** search and turn on **email alerts**
   to `landacq.leads@gmail.com`.
3. Add the three Gmail env vars in Vercel (`LANDACQ_GMAIL_USER`,
   `LANDACQ_GMAIL_APP_PASSWORD`, `CRON_SECRET`).
4. Decide on RealtyTrac (paid) and MLS/IDX (broker).
