# Land Acq Pro — Open Items Checklist

Living checklist, last updated 2026-07-11 after the 2026-07-10 outage and
overnight hardening pass. Full incident detail: `INCIDENT_2026-07-10.md`.

Status legend: ✅ done · ⏳ waiting on you · 🔜 deferred to a later session

---

## 🔴 Critical — security & structural

**1. `palm-bay-scattered-lots-07092026` still deploys from `adams-homes-dashboard`, not `land-acq-pro-app`** — 🔜 deferred
Root cause of the cross-project contamination pattern (it's why `sales-onboarding` picked up a Land Acq Pro debug commit tonight). Fix is a deliberate repo migration — not started. Do this before the multi-city expansion, not after, or every new city inherits the same problem.

**2. 13 `Rec*` (Cleats to College) tables live in the shared Supabase DB, real data, RLS disabled** — ⏳ waiting on you
I can't run `DROP TABLE` myself (permanent data deletion is a "you drive" action regardless of confirmation). Exact SQL was sent earlier tonight for the Supabase SQL Editor (`https://supabase.com/dashboard/project/tbzuajwitwonwojqshew/sql/new`) — still pending.

**3. RLS disabled on 16 tables** (13 `Rec*` + `vi_interview_invitations`/`vi_interview_date_options`/`vi_interview_selections`) — ⏳ waiting on you
Same reason as #2 — modifying database access control is yours to run. SQL sent alongside the `DROP TABLE` statements. Test the interview-scheduling flow right after running it.

**4. `LAND_ACQ_ADMIN_KEY` exposed twice** — ⏳ waiting on you
Once in a screenshot pasted into this chat, once in a commit message on the **public** GitHub repo (`curl -H 'x-admin-key: AdamsHomes2026!' ...`, commit `4d6182d`). ✅ *Partially mitigated tonight*: removed the hardcoded `'AdamsHomes2026!'` fallback from `lib/land-acq-db.ts` so the code no longer has a permanent backup copy of it — but the actual env var value is still the exposed one. Rotate it in Vercel when you're at a computer: Settings → Environment Variables → `LAND_ACQ_ADMIN_KEY` → new value → tell Kevin.

**5. Database password also visible in this chat's history** (from the DATABASE_URL screenshot/paste) — ⏳ waiting on you
Same fix as before: Supabase → Reset password → update `DATABASE_URL` in Vercel with the new value (same pooler format).

---

## ✅ Fixed tonight (2026-07-10 → 2026-07-11)

- `DATABASE_URL` — direct connection → Transaction Pooler (the actual outage fix)
- Hardcoded `laAdminKey = 'bypass'` removed from `offer-approval.html`
- Contract PDF: Seller name coordinate bug (was landing on Buyer's line, then crossing the underline) — fixed and visually verified
- Contract PDF: Seller's Broker name and signature Print Name — were never wired to any data at all, now filled from real fields
- County-card override boxes (address/parcel/owner) — now pre-fill the actual input, not just a caption underneath
- `ingest-email` cron frequency — every 15 min → 3x/day (6am/noon/6pm)
- **`ingest-email`, `sweep-redfin`, `check-mls-status` cron paths were all wrong** (`/app/api/.../route.ts` instead of `/api/...`) — every single scheduled run 404'd since these crons were added; none had ever actually executed automatically. Fixed in `vercel.json`.
- Real file storage for lot documents — was metadata-only (`{name, size}`), files never actually stored anywhere. Now backed by a real `land_acq_documents` table (bytea, same pattern as this app's existing candidate-photo/interview-video storage — no new bucket or secret needed), with upload/download/delete wired into `offer-approval.html`.
- Hardcoded admin-key fallback removed from source (see #4 above — partial fix, rotation still needed)

---

## 🟠 Needs verification once you're at a computer

**6. Zillow/Gmail ingestion pipeline status unverified post-reinstatement** — the cron path bug above means it's *never* run automatically regardless of the account-disable issue, so this needs a fresh look: click "Ingest Zillow Emails" in `admin.html` now that the cron path is fixed, and check for an IMAP auth error (Google may have invalidated the app password when the account was disabled/reinstated).

---

## 🟡 Scoped but deferred (product features, not urgent)

7. Dotloop e-signature automation (Kevin sends manually via his own login today)
8. Automated seller notifications ("contract received" / "fully executed") — needs an email-sending service decision
9. ~~Real file storage~~ ✅ done tonight (see above)
10. Privacy Policy / Terms pages — still placeholders, needs your attorney's language
12. Closing thank-you/referral letter — placeholder draft live, needs your final wording
14. Realtor.com / Land.com / LoopNet alert parsers — built, need one real alert each to confirm (Zillow + Crexi already confirmed)
15. Brevard County court records (foreclosure filings) — no clean public API found; likely needs a paid source or manual pull
16. MLS/IDX feed — pending confirmation from Kevin/broker on access

## 🟢 Decisions recorded

11. **Brand secondary color: red** (not forest green) — marketing/postcard work scheduled for later, not tonight
13. **RealtyTrac: skip the paid subscription.** Researching free alternatives now — will report back with specific options (county clerk foreclosure filings, free portal alert feeds, etc.)

---

## 🔵 Multi-city expansion (Port St. Lucie this weekend, then Palm Coast / Poinciana / Okeechobee)

Deferred until items above are settled — starting the expansion on top of an unresolved repo-migration problem (#1) just multiplies it across 5 cities instead of 1. When ready:
- Architecture: one shared codebase (not 5 forks), separate Vercel project + separate Supabase database per city
- Code refactor needed: buy-box rules, GIS parcel-service URL, and Redfin region ID are currently hardcoded to Palm Bay across 6 files
- Per-county research needed: St. Lucie / Flagler / Okeechobee County property-appraiser GIS endpoints (Poinciana spans Polk + Osceola — dual-county complexity)
- You're getting the Port St. Lucie domain today; Gmail account after that's fully active (not immediately, to avoid repeating today's account-disable issue)
