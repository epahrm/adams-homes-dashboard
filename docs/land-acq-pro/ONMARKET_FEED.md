# On-Market Feed — Setup & Go-Live Guide

How Land Acq Pro pulls **on-market listings** (Zillow, Realtor.com, Land.com,
LoopNet, Crexi, RealtyTrac) into the **On-Market Opportunities** box — the
compliant way, with no scraping.

---

## How it works

None of these portals allow automated scraping, and none offer a usable
listings API. The sanctioned path is the one they *want* you to use: a **saved
search that emails you matches**.

1. You create a saved search on each portal that matches our buy box.
2. Each portal emails new matches to **one dedicated Gmail inbox**.
3. The dashboard reads that inbox (daily by cron, or on-demand via **Sweep
   Now**), parses each listing, and files the Palm Bay ones as **On-Market
   Opportunities** with a green/yellow/red buy-box light.
4. **Duplicates are filtered automatically** — by address. A lot already in the
   pipeline (or one Kevin marked **Unsuitable**) never comes back, and lots
   that fail a hard buy-box rule are rejected.

We only ever read mail that the portals send us. Nothing is scraped.

---

## Which sites can be swept

| Site | Can we sweep it? | Account needed | What we get |
|------|------------------|----------------|-------------|
| **Zillow** | ✅ Yes | Free | Full detail — address + price + acreage + link |
| **Realtor.com** | ✅ Yes | Free | Full detail — address + price + acreage + link |
| **Land.com** (LandWatch / Lands of America) | ✅ Yes | Free | Full detail — address + price + acreage + link |
| **LoopNet** | ✅ Yes | Free account | Full detail (land/commercial) + link |
| **Crexi** | ⚠️ Partial | Free account | Often **link-only** alerts — we capture the listing title, acreage, and link, flagged for Kevin to open and confirm the address |
| **RealtyTrac** | ⚠️ Needs paid access | **Paid subscription** to receive alerts / foreclosure data | Full detail once subscribed |
| **Dotloop** | ❌ Not a listing source | — | Dotloop is transaction/e-sign software for deals already in progress — it doesn't list properties, so there's nothing to sweep |

Everything is filtered to **Palm Bay only** (ZIP 32905–32909); alerts for other
cities are ignored.

---

## What you need to do to go live

### 1. Create a dedicated Gmail
e.g. `landacq.leads@gmail.com`. Use it **only** for these alerts so the inbox
stays clean.

### 2. Enable an App Password
- Turn on 2-Step Verification on that Google account.
- Google Account → **Security → App passwords** → create one named "Land Acq".
- Copy the 16-character password (we store it as an env var, never in code).
- IMAP is on by default for Gmail; no other setting needed.

### 3. Create the saved searches
On each site above, sign in with (or forward alerts to) the dedicated Gmail and
create a saved search that matches the buy box, then set it to **email new
matches** (daily or instant):
- **Location:** Palm Bay, FL
- **Type:** Land / Lots / Vacant
- **Price:** up to ~$60,000 (stipend + show window)
- **Lot size:** up to ~0.45 acres

### 4. Set three environment variables in Vercel
Vercel → the project → **Settings → Environment Variables** (Production):

| Variable | Value |
|----------|-------|
| `LANDACQ_GMAIL_USER` | the dedicated Gmail address |
| `LANDACQ_GMAIL_APP_PASSWORD` | the 16-char app password (no spaces) |
| `CRON_SECRET` | a long random string (protects the daily job) |

### 5. Redeploy
After saving the variables, redeploy. That's it — the feed is live.

---

## Running it

- **Automatic:** a Vercel Cron runs **daily at 11:00 UTC (7:00 AM ET)**, reads
  new alerts, and files matches. Already configured in `vercel.json`.
- **On demand:** click **Sweep Now** on the On-Market Opportunities box to pull
  immediately. Until the three env vars are set, Sweep Now will say the feed
  "isn't connected yet."

Each run reports how many were **added new**, how many were **already had**
(deduped), and how many were **outside the buy box** (rejected).

---

## Notes

- **Dedupe key is the address**, so the same lot arriving from two portals (or
  two alerts) is stored once, and a lot you already worked or dismissed won't
  reappear.
- **Crexi link-only alerts** land flagged "needs address" — Kevin opens the
  link to confirm the parcel before offering.
- Nothing here touches the seller page or any public surface; it only adds to
  Kevin's internal On-Market Opportunities queue.
