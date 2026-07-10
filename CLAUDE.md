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

## ⚠️ Cleats to College does NOT live here

**Cleats to College** (a college soccer recruiting platform for Elizabeth's own
consulting business, unrelated to Adams Homes) was originally prototyped inside
this repo by mistake. It has been **fully migrated out**. Its real home:

- **Repo:** `epahrm/cleats-to-college` (private) — use `add_repo` to bring it into
  session scope if it isn't already there
- **Deploy:** its own Vercel project (`cleats-to-college`, team `ecf-projects`) —
  a different project from this one
- **Database:** its own Neon Postgres project — **not** this repo's Supabase
  project (`tbzuajwitwonwojqshew`)

If asked to build, fix, or extend anything about Cleats to College, soccer
recruiting, athletes/coaches, or Elizabeth's consulting practice — **do not
create or edit files in this repo.** Go to the `cleats-to-college` repo instead.

This repo's own database (`tbzuajwitwonwojqshew`) holds only this repo's tables
(`User`, `Admin`, `Milestone*`, `Question`, `MarketingLesson`, `land_acq_*`,
`vi_*`). Row Level Security is enabled on all of them with no policies — the
app connects as the table-owning `postgres` role via Prisma, which bypasses RLS
by design, and nothing here uses Supabase's anon/client API. Do not add tables
here for any product other than Adams Homes' own tools.
