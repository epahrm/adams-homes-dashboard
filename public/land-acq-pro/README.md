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

- All data lives in `localStorage` under the key `landAcqSubmissions` — no backend required.
- Landing-page submissions appear in the admin dashboard within 5 seconds (auto-refresh).
- Clicking a row in the admin table opens the Offer Approval screen for that lot.
- Approving an offer sets the lot's status to `offer-sent` and returns to the dashboard.
- The dashboard seeds six sample Palm Bay lots on first load (one-time, guarded by a
  `landAcqSeeded_v2` flag) so the pipeline matches the approved sample.
- Legacy statuses from the previous landing page (`new`, `qualified`) are still recognized
  and displayed as PENDING.

## Where these pages are served

Because this folder lives under `public/`, the Next.js dashboard deployment serves the
pages directly at `/land-acq-pro/index.html`, `/land-acq-pro/admin.html`, and
`/land-acq-pro/offer-approval.html` (with `/land-acq-pro` redirecting to the landing
page) — so they can be tested live on any Vercel preview of this repo.

## Deploying to the live site (land-acq-pro-app)

These files are also drop-in replacements for the standalone site. Copy all three HTML
files to the root of the `epahrm/land-acq-pro-app` repository (overwriting `index.html`
and `admin.html`, adding `offer-approval.html`) and push — Vercel auto-deploys on push.
