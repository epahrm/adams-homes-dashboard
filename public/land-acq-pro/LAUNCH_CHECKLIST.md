# Land Acq Pro — Go-Live Plan

Locked decisions (July 2026):
- **Hosting:** launch on the free Vercel URL now, add a branded domain later.
- **E-signature:** Kevin sends offers through his own Dotloop login (no API integration yet).
- **Seller emails:** manual for now — Kevin emails sellers himself until we automate.

That means launch comes down to three switches, then a QR code and a test.

---

## Step 1 — Turn the site on (Elizabeth, ~2 min in Vercel)
- [ ] vercel.com → **adams-homes-dashboard** project → **Settings → Deployment
      Protection** → set **Vercel Authentication** to **Off** → **Save**.
      (This makes the public seller page reachable. The admin pages still have
      their own password gate, so they stay protected.)

## Step 2 — Set the admin password (Elizabeth, ~1 min in Vercel)
- [ ] Settings → **Environment Variables** → add **`LAND_ACQ_ADMIN_KEY`** =
      the password you want Kevin & Elizabeth to use → Save.
- [ ] Confirm **`DATABASE_URL`** (Supabase) is present so Kevin and Elizabeth
      share one live pipeline across devices. First real save auto-creates the
      `land_acq_lots` and `land_acq_settings` tables.

## Step 3 — Publish to the permanent URL (Claude, on your OK)
- [ ] Merge the pull request to `main` so the pages deploy to the permanent
      address: **https://adams-homes-dashboard.vercel.app/land-acq-pro/**
      (Currently they live only on the preview branch.)

## Step 4 — QR code + postcards (ready now)
- [ ] QR code generated pointing at the seller landing URL above. It "activates"
      the moment Steps 1 and 3 are done. Drop it on the postcard artwork.

## Step 5 — End-to-end test on real devices (Claude + Elizabeth)
- [ ] Seller opens the QR/link on a phone → searches property → submits.
- [ ] Deal appears in Kevin's dashboard.
- [ ] Kevin sets stipend/offer, sends the packet via **Dotloop (his login)**.
- [ ] Seller signs → Kevin marks "contract received" → Elizabeth signs.
- [ ] Timeline computes IP (+45 days) and the Thursday closing date.
- [ ] Verify on iPhone, Android, and desktop.

---

## Live pages
- Seller landing: `/land-acq-pro/`
- Pipeline dashboard: `/land-acq-pro/admin.html`
- Offer approval: `/land-acq-pro/offer-approval.html`

## Deferred (do after launch — not blockers)
- [ ] Branded domain (e.g. `landacq.adamshomes.com`) — needs IT/DNS.
- [ ] Automated seller emails ("contract received" / "fully executed").
- [ ] Dotloop API automation (auto-create + send the loop).
- [ ] Real file storage (Supabase Storage bucket) so lot uploads keep the
      actual files, not just filenames.
- [ ] Confirm Brevard County (BCPAO) live search works from production; sellers
      fall back to the research form if it's blocked.
- [ ] Privacy Policy / Terms pages (footer links are placeholders).
- [ ] Rotate the admin password on a schedule; consider separate
      Kevin/Elizabeth passwords.
