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
