# Land Acq Pro — Complete Page Set

Static pages for the Land Acq Pro system, rebuilt to match the approved sample designs
(QR Landing Page, Admin Lot Tracker, and Kevin's Offer Approval screen).

## Files

| File | Screen |
|------|--------|
| `index.html` | Public QR landing page — hero, "Why Sellers Choose Adams Homes", Search Your Lot (by owner name or street address), lead capture form, Kevin Nelson contact card, footer |
| `admin.html` | Admin Dashboard — Lot Tracker: Palm Bay Lot Pipeline KPI cards, monthly target banner, filters (City / Status / Days in Stage / Source), Quick Metrics, lot table with status pills, pagination, Export to CSV / PDF, Refresh Data |
| `offer-approval.html` | Admin Dashboard — Offer Approval: Brevard County record card, offer details (editable Offer Amount / EMD / Commission), routing box, Approve & Send Offer |

## How the pages work together

- **Shared store (Kevin + Elizabeth always in sync):** submissions and status changes
  are saved through `/api/land-acq/lots` into the shared Postgres database, so every
  admin sees the same pipeline from any device. The dashboard re-fetches every 5 seconds.
- **Live county search:** the landing page verifies lots through
  `/api/land-acq/county`, a server-side proxy to the Brevard County Property
  Appraiser. If the county site is unreachable (their Cloudflare protection can
  intermittently block automated requests), the seller falls back to Kevin's
  research form — no lead is ever lost.
- **Admin password gate:** `admin.html` and `offer-approval.html` require the shared
  admin password before loading. Set it with the `LAND_ACQ_ADMIN_KEY` environment
  variable in Vercel (default: `AdamsHomes2026!` — change it). The seller page has
  no login and no links to the admin pages.
- **Offline/demo mode:** when the pages are opened without the server (e.g. from
  disk), they fall back to this browser's `localStorage` and show a demo-mode banner.
  The dashboard seeds six sample Palm Bay lots in that mode only.
- Clicking a row in the admin table opens the Offer Approval screen; approving sets
  the lot to `offer-sent` and routes to the listing agent (MLS) or owner (off-market).
- Legacy statuses from the previous landing page (`new`, `qualified`) still display
  as PENDING.

## Where these pages are served

Because this folder lives under `public/`, the Next.js dashboard deployment serves the
pages directly at `/land-acq-pro/index.html`, `/land-acq-pro/admin.html`, and
`/land-acq-pro/offer-approval.html` (with `/land-acq-pro` redirecting to the landing
page) — so they can be tested live on any Vercel preview of this repo.

## Deploying to the live site (land-acq-pro-app)

The HTML files can still be copied to the standalone `epahrm/land-acq-pro-app`
repository, but the shared store, live county search, and password verification live
in this repo's API routes — standalone copies run in offline/demo mode unless those
endpoints are made available to them.
