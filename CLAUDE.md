# Adams Homes Dashboard — Project Structure & Isolation Rules

**CRITICAL: Projects in this monorepo are ISOLATED. Read this before editing anything.**

---

## 🚫 PROJECT ISOLATION MANDATE

This repository contains **multiple independent projects**. Each project is completely isolated:
- **No cross-project file access** — do not read/write/reference files from other projects
- **No shared dependencies** — each project manages its own config
- **No linking between projects** — never create links between Dylan, Land Acq Pro, or dashboard code
- **Separate deployments** — each project deploys independently

**Violation = data leak / broken site. Be careful.**

---

## 📁 Project Directories

### 🌰 Dylan the Acorn Website
**Location:** `/public/dylan-the-acorn/`  
**Domain:** https://dylantheacorn.com  
**Owner:** Seth Porter (via elizporter15@gmail.com)  
**Status:** LIVE ✅

**ONLY edit files in `/public/dylan-the-acorn/` when working on Dylan.**

**Dylan-specific rules:**
- Single static HTML file: `index.html` (no build step)
- All images in `images/` folder (official artwork only — never modify character drawings)
- Review filtering enforced in JavaScript (≥3 stars only)
- Batch changes before pushing (one push = one production deployment)
- NO references to other projects in Adams dashboard
- NO links to other project files
- Operations tracker: `/docs/DYLAN-SITE-OPERATIONS.md` — update when hosting/costs change

**What NOT to do:**
- ❌ Don't add middleware rules to Next.js (already added for you)
- ❌ Don't link to Land Acq Pro, Cleats to College, or dashboard files
- ❌ Don't modify images (crop/resize only via official process)
- ❌ Don't fabricate reviews (only real, ≥3-star reviews)
- ❌ Don't change domain setup without explicit approval
- ❌ Don't access `/public/land-acq-pro/` or `/app/` directories

---

### 🏠 Adams Homes Dashboard
**Location:** `/app/` and `/public/` (excepting Dylan)  
**Domain:** https://adams-homes-dashboard.vercel.app (or custom domains)  
**Status:** Primary project

When working on dashboard: ignore Dylan files completely.

---

### 📊 Land Acq Pro
**Location:** `/public/land-acq-pro/`  
**Status:** Separate project

When working on Land Acq Pro: ignore Dylan files completely.

---

### 🏈 Cleats to College
**Location:** TBD (if in this repo)  
**Status:** Separate project

When working on Cleats to College: ignore Dylan files completely.

---

## 📋 Current Instructions for Dylan Work

**Branch:** `claude/dylan-big-feelings-website-ntcrd2`

**Workflow:**
1. Edit ONLY in `/public/dylan-the-acorn/`
2. Test locally with static server (paths resolve correctly)
3. Batch multiple edits together
4. Commit with clear message
5. Push once (triggers one Vercel deployment)
6. Never push more than once per day (100 deployment account-wide cap)

**Never:**
- Push to other branches without permission
- Edit files outside `/public/dylan-the-acorn/`
- Add Dylan code to dashboard components
- Link Dylan to other projects
- Access other project files

---

## 🔐 File Access Rules

| Directory | Claude Access | Purpose |
|-----------|---------------|---------|
| `/public/dylan-the-acorn/` | ✅ Full | Dylan site (isolated) |
| `/public/dylan-the-acorn/images/` | ✅ Add only | Official artwork (no edits) |
| `/docs/DYLAN-SITE-OPERATIONS.md` | ✅ Update | Dylan operations tracker |
| `/app/` | ❌ Don't read/edit | Dashboard app code |
| `/public/land-acq-pro/` | ❌ Don't read/edit | Land Acq Pro (separate) |
| `/public/other-projects/` | ❌ Don't read/edit | Other isolated projects |
| `/.github/` | ❌ Don't modify | CI/CD (shared infrastructure) |
| `/middleware.ts` | ⚠️ Read-only | Hosts Dylan via rewrite rule |

---

## 📝 Important: Dylan Operations Tracker

File: `/docs/DYLAN-SITE-OPERATIONS.md`

**Keep this updated whenever:**
- Domains change
- Hosting moves
- Costs/renewals change
- Automated reminders are set up

**Do NOT edit anything else in `/docs/`** — other files may belong to dashboard or other projects.

---

## 🚀 Next Dylan Work Session

When returning to Dylan work:

1. **Verify isolation:**
   ```bash
   git status  # Check current branch
   git log -1  # Verify you're on claude/dylan-big-feelings-website-ntcrd2
   ```

2. **Only edit these files:**
   - `/public/dylan-the-acorn/index.html`
   - `/public/dylan-the-acorn/images/*` (new images only)
   - `/docs/DYLAN-SITE-OPERATIONS.md`

3. **Never reference:**
   - Other project files
   - Dashboard components
   - Land Acq Pro code
   - Any external projects

4. **After edits:**
   - Test locally
   - Commit with clear message
   - Push once
   - Done (Vercel deploys automatically)

---

## ⚠️ Violations & Recovery

**If you accidentally access another project's files:**
1. Stop immediately
2. Run `git diff` to see what changed
3. Discard those changes: `git checkout -- <file>`
4. Recommit Dylan-only changes

**If you accidentally push to wrong branch:**
1. Contact user immediately
2. Revert the push
3. Restart from correct branch

---

## 📞 Questions?

If unclear about project boundaries:
- **Dylan-specific:** Check `/public/dylan-the-acorn/CLAUDE.md`
- **Operations:** Check `/docs/DYLAN-SITE-OPERATIONS.md`
- **Deployments:** Check this file (isolation rules above)

**Golden rule:** When in doubt, ask. Don't guess about project boundaries.
