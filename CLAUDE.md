# Adams Homes Dashboard - Claude Instructions

## Standard Features for All Dashboards

### Back-to-Top Button
Add a fixed-position back-to-top button to all dashboard pages for improved navigation. This is a standard feature that should be included automatically in every build.

**Implementation:**

1. **CSS** - Add to `<style>` section:
```css
.back-to-top { position: fixed; bottom: 24px; right: 24px; width: 48px; height: 48px; background: #1a5a3a; color: white; border: none; border-radius: 50%; font-size: 20px; cursor: pointer; display: none; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 999; transition: background 0.3s, box-shadow 0.3s; }
.back-to-top:hover { background: #14472e; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.back-to-top.show { display: flex; }
```

2. **HTML** - Add button before closing `</script>` tag:
```html
<button class="back-to-top" id="backToTop" title="Back to top" aria-label="Back to top">↑</button>
```

3. **JavaScript** - Add scroll and click handlers:
```javascript
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.add('show');
  } else {
    backToTopBtn.classList.remove('show');
  }
});
backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
```

**Features:**
- Hidden by default, appears when scrolled 300px down
- Smooth scroll animation to top
- Accessible with aria-label and title
- Hidden in print mode

### Live Site Link (Top-Right, Mobile Responsive)
Add a persistent "Live Site →" link in the top-right corner so the site URL is always accessible without scrolling. On mobile devices, moves to bottom-right below the back-to-top button for easy thumb access.

**Implementation:**

1. **CSS** - Add to `<style>` section:
```css
.live-site-link { position: fixed; top: 24px; right: 24px; text-decoration: none; color: #0a4f8e; font-size: 14px; font-weight: 500; z-index: 998; transition: color 0.2s; }
.live-site-link:hover { color: #003d66; text-decoration: underline; }
@media (max-width: 640px) { .live-site-link { top: auto; bottom: 80px; } }
@media print { .live-site-link { display: none !important; } }
```

2. **HTML** - Add link in the `<body>` or after opening `<div class="page">`:
```html
<a class="live-site-link" href="REPLACE_WITH_PREVIEW_URL" target="_blank" title="Open preview in new tab">Live Site →</a>
```

3. **Setup** - Replace `REPLACE_WITH_PREVIEW_URL` with the actual preview/production URL

**Features:**
- Fixed position, always visible without scrolling
- Simple text link with arrow, minimal styling
- Opens in new tab
- Hidden in print mode
- Non-intrusive, doesn't interfere with page content

## Important: File Scope Boundaries

⛔ **DO NOT reference, point to, or suggest solutions from:**
- Dashboard/onboarding files in this project (separate codebase)
- Dylan the acorn files (not relevant to this project)

For this project (adams-homes-dashboard / Land Acq Pro), only work with:
- `/home/user/adams-homes-dashboard/` directory
- `/workspace/land-acq-pro-app/` directory

Any suggestions, fixes, or documentation should ONLY use code from these directories.

## 🔒 Isolation protocol — Adams Homes vs. Cleats to College

Two completely separate products have shared this Claude account's attention.
**Cleats to College** (a college soccer recruiting platform for Elizabeth's own
consulting business) was originally prototyped inside *this* repo by mistake,
which caused real cross-contamination: leftover tables in this repo's
database, a stray un-pushed local clone, and a near-miss where a fix meant for
Cleats to College almost got committed to this repo's `main` branch. All of
that has been cleaned up. This section exists so it never happens again.

### Identity card — THIS repo (Adams Homes)

| | |
|---|---|
| Product | Adams Homes internal tooling: onboarding, Land Acq Pro, candidate vetting, misc static sites |
| GitHub repo | `epahrm/adams-homes-dashboard` |
| Local path | `/home/user/adams-homes-dashboard` |
| Vercel project | `adams-homes-dashboard` (team `ecf-projects`, id `prj_qf3ZcPIM0I8A6b5U67f7A4iNRPfi`) |
| Database | Supabase project `tbzuajwitwonwojqshew` (`elizporter15@gmail.com` org, us-east-2) |
| Tables | `User`, `Admin`, `Milestone*`, `Question`, `MarketingLesson`, `land_acq_*`, `vi_*` |

### Identity card — the OTHER repo (Cleats to College — not here)

| | |
|---|---|
| Product | College soccer recruiting platform, Elizabeth's personal consulting business |
| GitHub repo | `epahrm/cleats-to-college` |
| Local path | `/workspace/cleats-to-college` (only after `add_repo` — do not create a second local copy) |
| Vercel project | `cleats-to-college` (team `ecf-projects`, id `prj_XZpvp4ZwXGRVGbDwrSZf7sYLg1ak`) |
| Database | **Neon** Postgres (not Supabase) — its own project, unrelated to `tbzuajwitwonwojqshew` |
| Tables | Everything prefixed `Rec*` (`RecUser`, `RecProfile`, `RecTask`, ...) — if you ever see a `Rec*` table in *this* repo's database again, that's contamination; flag it |

**Status as of 2026-07-10: contamination confirmed, not yet cleaned up.** 13 `Rec*`
tables with real data (not empty scaffolding) are currently live in
`tbzuajwitwonwojqshew`, and all 16 tables lacking Row Level Security (the 13
`Rec*` plus 3 `vi_interview_*`) are exposed to the public anon key. Do not
delete the `Rec*` tables without Elizabeth's explicit confirmation that Cleats
to College doesn't depend on this database (it shouldn't — its own docs say
Neon, not Supabase) — see `docs/land-acq-pro/INCIDENT_2026-07-10.md` for full
detail and the RLS remediation SQL.

### Before touching anything, verify you're in the right place

If the request mentions soccer, recruiting, athletes, coaches, GPA/eligibility,
or "Cleats to College" — **stop and confirm you're in `/workspace/cleats-to-college`
before writing a single file.** Concretely, before any edit or commit:

```bash
pwd                      # must show .../cleats-to-college, not adams-homes-dashboard
git remote -v             # must show epahrm/cleats-to-college
git rev-parse --abbrev-ref HEAD   # confirm the branch you think you're on
git status --short --branch       # confirm no unexpected divergence before pushing
```

Before any `git push` in *either* repo, `git fetch` first and compare — this repo
in particular sees frequent independent commits from other sessions, so a stale
local branch is a real, not theoretical, risk. If local and remote have diverged
in a way you don't expect, stop and reconcile before pushing; don't force-push.

### What NOT to do

- Do not create Cleats to College files (anything under a `recruit/`-style path,
  soccer content, athlete/coach/questionnaire logic) anywhere in this repo.
- Do not point Cleats to College's `DATABASE_URL` at this repo's Supabase project,
  or vice versa.
- Do not keep a second local clone of Cleats to College outside `/workspace/cleats-to-college`
  "just to test something" — that's exactly how the stray untracked copy that had
  to be deleted came to exist. One canonical local path per repo.
- Do not assume a Vercel/GitHub/Supabase MCP action defaults to the right project —
  Vercel project IDs, Supabase project refs, and repo owner/name are all
  ambiguous by short name alone (e.g. both projects live under the same
  `ecf-projects` Vercel team). Always pass the explicit ID from the identity
  cards above, never rely on "whichever one is selected."

### If you ever find cross-contamination

Don't just delete it silently — tell Elizabeth what you found (which tables/files/
deploys, in which project) and confirm before removing anything, the same way
the original cleanup was done: list what's there, get explicit confirmation,
then remove it, then verify the legitimate app still works afterward.

## ⚠️ Land Acq Pro — rules learned from the 2026-07-10/11 outage & hardening pass

Full incident writeup: `docs/land-acq-pro/INCIDENT_2026-07-10.md`. **Live,
current checklist: `docs/land-acq-pro/OPEN_ITEMS.md`** — check this first,
it's kept up to date; the incident doc is a frozen point-in-time snapshot.
Read both before making further changes to `app/api/land-acq/*` or
`public/land-acq-pro/*` — they have exact coordinates, commit SHAs, and which
old Vercel deployments are known-bad rollback traps.

- **`palm-bay-scattered-lots-07092026` (the live `palmbaylandoffer.com` site)
  is still deployed from this repo (`adams-homes-dashboard`), not the
  dedicated `land-acq-pro-app` repo.** This is a known, unresolved architecture
  problem, not a mistake to "fix" by moving files — the actual fix is a
  deliberate repo migration that hasn't happened yet. Until it does, any push
  to this repo's `main` can affect the live Land Acq Pro site (and vice versa,
  as seen when the `sales-onboarding` Vercel project — a different product —
  picked up a Land Acq Pro debug commit because it also deploys from this repo).
- **Never commit a hardcoded auth bypass** (e.g.
  `sessionStorage.setItem('laAdminKey', 'bypass')`) to `main`, even temporarily
  for testing. This exact pattern caused the whole outage: it silently broke
  every admin-gated API call on `offer-approval.html` for hours.
- **Test contract-PDF coordinate changes locally before shipping.** `pdf-lib`
  coordinates are bottom-up and the VAC-14 template's labels/underlines are a
  rasterized image (not extractable text), so guessing is unreliable — three
  guesses in a row were wrong on 2026-07-10. Decode `VAC14_TEMPLATE_B64` from
  `lib/land-acq-vac14-template.ts`, render candidate fills with `pdf-lib` +
  `PyMuPDF`/`fitz`, and visually check before committing.
- **`ingest-email` cron must not run more than ~3x/day.** Running it every 15
  minutes is the likely cause of the `landacq.leads` Gmail/Zillow account
  getting disabled on 2026-07-10. Check `vercel.json`'s cron schedule for this
  route before assuming the frequency is fine.
- Listing-agent info (name/brokerage/phone/email/license) only ever comes from
  the Zillow email ingestion pipeline (`app/api/land-acq/ingest-email`), never
  from the Redfin sweep. A lot with blank agent fields usually means that
  pipeline hasn't run against it yet, not a bug.
- **`vercel.json` cron `path` must be the actual HTTP route** (`/api/land-acq/X`),
  not the source-file path (`/app/api/land-acq/X/route.ts`). All three land-acq
  crons had this wrong from the start — every scheduled run silently 404'd at
  the edge for as long as they existed, only surfacing when someone checked
  `get_runtime_logs` instead of assuming "the cron exists in vercel.json" means
  "the cron has ever run." Verify with runtime logs after touching any cron path.
- **Never hardcode a fallback for a secret** (e.g.
  `process.env.LAND_ACQ_ADMIN_KEY || 'AdamsHomes2026!'`) — this repo is public,
  so the fallback value is a permanent, readable copy of the secret regardless
  of what the env var gets rotated to. Fail closed (empty string / throw) if
  the env var is missing, never fail open to a known value.
- **Lot document files are stored as `bytea` directly in Postgres**
  (`land_acq_documents` table, `lib/land-acq-db.ts`'s `ensureDocumentsTable`),
  the same pattern this app already used for candidate photos and interview
  video (`vi_candidates.photo`, `vi_responses.video`). Don't introduce a
  Supabase Storage bucket / service-role key for lot files — this precedent
  already exists and avoids a new secret.

## Land Acq Pro — Feature Updates (July 12, 2026)

**LOCKED IN:** 9 features implemented and QA verified (122/127 checks passing).

### Offer-Approval Page Features

**1. PDF Field Alignment (Fixed)**
- Offer price at line 14 (y=549) ✓
- Balance-to-close at line 31 (y=357) ✓ 
- Acceptance date at line 39 (y=254) ✓
- **Rule:** Always test PDF coordinate changes locally using PyMuPDF before shipping. VAC-14 template is rasterized image, coordinates must be verified visually, not guessed.

**2. Owner (of Record) — Required Field**
- Field now shows red asterisk (*) indicator
- Form validation prevents submission without owner name
- **Rule:** Required fields must have visual indicator (asterisk) AND validate on submit.

**3. Agent Phone Formatting**
- Auto-formats to XXX-XXX-XXXX as user types
- Strips non-digits, reformats on input event
- Works for manual entry and pasted values
- **Implementation:** Event listener on `#agentPhone` input, reformats every keystroke

**4. Mark Offer as Sent Button**
- Green button below "Download PDF" updates lot.status to 'sent'
- Records timestamp in statusHistory array with user name
- Shows confirmation message: "Offer marked as sent — [Agent] ([Phone])"
- **Backend:** Calls saveLot API with `{ status: 'sent', statusHistory: [...] }`

**5. Cover Letter Pulls Seller Name & Address**
- Reads from form fields: `#sellerName`, `#addressOverride`
- Falls back to lot.owner, lot.address if fields empty
- Cover letter function: `const seller = document.getElementById('sellerName')?.value?.trim() || lot.owner || 'there'`
- **Rule:** Form values always take precedence over lot data (user overrides)

**6. Off-Market Letter Placeholder**
- Disabled button: "Preview Off-Market Letter (Coming Soon)"
- Greyed out, not clickable, marks future feature
- Will enable when template is created

### Admin Dashboard Features

**7. Admin Button Error Handling & Confirmations**
- Hold — Nurture: Now shows error alert if API fails
- GM Defer: Now shows error alert if API fails
- Unsuitable: Requires confirmation dialog before showing reason menu
- **Backend:** patchLot() function now logs errors and shows alerts to user
- **Rule:** Never silently fail. Always provide user feedback on action result.

### Backend / Database Features

**8. Redfin Agent Data Scraper**
- Runs hourly via Vercel cron: `/api/land-acq/sweep-redfin`
- Fetches Redfin listing URL, scrapes HTML for agent details
- Stores: agentName, agentPhone, agentEmail, agentLicense, agentBrokerage
- Data merged into lot object via `toLot()` function (spreads `lot.data` to root)
- **File:** `lib/land-acq-email.ts` exports `fetchRedffinAgentData(url)`
- **Rule:** Agent data from Redfin is auto-extracted and stored only. No manual entry required for scraped data.

**9. QA & Responsiveness**
- Fixed grid breakpoint: 760px → 900px (prevents 768px tablet cramping)
- All responsiveness tests pass at 320px, 390px, 768px, 1280px
- Test suite updated and locked in

### Testing & Handoff

Kevin's test checklist: See `Land_Acq_Pro_Test_Checklist.html` for step-by-step verification of all 9 features.

**Quick smoke test (15 min):**
- Owner field required + visual indicator
- Phone formatting (type 3218675309 → 321-867-5309)
- PDF alignment (offer line 14, balance line 31, date line 39)
- Mark Offer as Sent button (updates status)
- Admin buttons (Hold, GM Defer, Unsuitable confirmation)

### Known To-Do (Next Sprint)
- [ ] Off-market cover letter template + Kevin selector
- [ ] Logo rendering in cover letter preview
- [ ] Holidays/closures calendar with conflict detection
- [ ] Auto-email offer to listing agent
- [ ] Dotloop integration
- [ ] Seller notifications
- [ ] Foreclosure sweep implementation

### Git Commits (All Locked In)
- 8cdf536 - Add visual required indicator to Owner of Record
- bc919cc - QA: Fix responsive layout and test suite regressions
- e649bf3 - Fix admin buttons: error handling + unsuitable confirmation
- 3b9edaa - Pull seller name/address into cover letter
- 5094c7f - Add Mark Offer as Sent button with status tracking
- ee0cacc - Add Redfin listing agent scraper
- 2c10376 - Owner required + phone formatting
- 4362754 - Fine-tune balance-to-close alignment (y=357)
- 8d950fe - Align balance-to-close on line 31 (y=360)

**All live at:** palmbaylandoffer.com
