# Dylan the Acorn Website — Detailed Project Guide

**This is an ISOLATED project. Do not access files outside this directory.**

---

## 🎯 Project Overview

**Official website for "Dylan and the Big Feelings" by Seth Porter**
- **Domain:** https://dylantheacorn.com
- **Status:** Live ✅
- **Technology:** Single static HTML file (no build step)
- **Deployment:** Vercel (from GitHub branch `claude/dylan-big-feelings-website-ntcrd2`)
- **Owner:** elizporter15@gmail.com (Seth Porter, kid author)

---

## 📁 This Directory Structure

```
/public/dylan-the-acorn/
├── index.html              ← ONLY file to edit (all content + CSS + JS)
├── images/                 ← Official artwork (add new images here)
│   ├── book-cover.jpg
│   ├── dylan-*.jpg         ← Character and scene artwork
│   ├── seth-*.jpg          ← Author's journey photos
│   ├── squirrel.jpg
│   └── dylan-coloring-*.png ← Printable coloring pages
├── HOW-TO-UPDATE.md        ← User guide (reference only)
└── CLAUDE.md               ← This file
```

**Files OUTSIDE this directory are NOT Dylan's — don't touch them.**

---

## ✏️ How to Edit Dylan's Site

### Rule #1: BATCH CHANGES (CRITICAL)
Do NOT push after every edit. Instead:
1. Make multiple edits locally
2. Test thoroughly
3. Collect feedback into agreed list
4. Commit ALL changes as one batch
5. Push ONCE

**Why:** Each push triggers Vercel deployment (account-wide 100/day cap).

### Rule #2: ONLY EDIT index.html
- CSS: Inline in `<style>` tag
- JavaScript: Inline in `<script>` tag
- HTML: All content in this one file
- **No external files, no imports, no build step**

### Rule #3: IMAGES GO IN images/ FOLDER
- Add new images to `images/` directory
- Always use `/dylan-the-acorn/images/filename` paths (absolute)
- **Official artwork only** — never redraw, restyle, or generate Dylan character art
- Cropping/resizing of official art is OK; recreating is NOT OK
- Optimize before adding (web-ready JPEG/PNG)

### Rule #4: ONLY ADD REAL CONTENT
- **Reviews:** Only ≥3-star reviews (filter enforced in code)
- **Events:** Only real, scheduled events
- **Author bio:** Only Seth's real info
- **Merch:** No fictional products — link to real stores

---

## 📝 Edit Examples

### Adding a Review
```javascript
const REVIEWS = [
  {
    stars: 5,
    text: "My 8-year-old loves this book!",
    name: "Jamie R.",
    source: "Amazon Customer Review"
  },
  // Add more reviews here
];
```

### Adding an Event
```javascript
const EVENTS = [
  {
    month: "Sep", day: "14",
    title: "Story Time & Book Signing",
    details: "Main Street Library, 10:30 AM"
  },
];
```

### Adding a Character
Find `<!-- TO ADD MORE CHARACTERS -->` in HTML and copy a card, update name/description.

### Adding a Resource
Add a new card in the **Free Resources** section with:
- Preview image (200px height)
- Title and description
- Download button linking to `/dylan-the-acorn/images/your-file.png`

---

## 🚫 NEVER DO THESE

❌ **Don't reference other projects:**
- No links to `/land-acq-pro/`, `/app/`, or other dashboard paths
- No imports from dashboard code
- No mentioning Adams Homes Dashboard or other projects
- No linking to external projects

❌ **Don't modify images:**
- Don't edit Dylan's appearance (color, style, pose)
- Don't change character artwork
- Only crop/resize official artwork copies
- Never generate AI art of Dylan or other characters
- Keep characters visually consistent with illustrations

❌ **Don't fake content:**
- No fabricated reviews (user guides filter: ≥3 stars only)
- No fictional events
- No made-up author bio details
- No non-existent merchandise

❌ **Don't change infrastructure:**
- Don't touch Porkbun DNS records (unless explicitly instructed)
- Don't modify Vercel project settings (unless explicitly instructed)
- Don't change middleware routing
- Don't modify GitHub workflow files

❌ **Don't add complexity:**
- No build step
- No external dependencies
- No API calls (mailto for contact is fine)
- No dynamic database connections
- Keep it static HTML

---

## 🧪 Local Testing (ALWAYS do this)

Before committing, always test locally:

```bash
# Start a test server in this directory
python3 -m http.server 8000 -d /public/dylan-the-acorn/

# Visit http://localhost:8000
# Test:
# - All navigation links work (#story, #characters, etc.)
# - Images load correctly
# - Buttons/CTAs link to correct places (Amazon, Instagram, etc.)
# - Mobile responsiveness (resize browser to 375px width)
# - Forms work (mailto links open email)
# - Review/event filtering works correctly
```

---

## 📋 Content Management

### Reviews Section
- Empty state shows "Reviews are sprouting!" (graceful fallback)
- Only reviews with `stars >= 3` display (enforced in JavaScript line ~506)
- Source field is optional but recommended
- Format: name (first + last initial), source (Amazon/Teacher/etc), text

### Events Section
- Empty state shows "New events are being planned!" (graceful fallback)
- Month/day format only (e.g., "Sep", "14")
- Multiple events can exist, ordered by date
- Always include location and time

### Resources Section (Coloring Pages)
- Download links point to `/dylan-the-acorn/images/filename`
- Preview images are 200px height for consistency
- Users can right-click to save or print directly from browser
- All PDFs/images must be web-optimized

---

## 🔗 External Links (ONLY these allowed)

✅ **ALLOWED:**
- Amazon product pages (Dylan books): amazon.com links only
- Amazon reviews page
- Instagram @dylantheacorn
- Contact email: elizporter15@gmail.com
- Formspree (when newsletter is upgraded)

❌ **NOT ALLOWED:**
- Links to other pages in adams-homes-dashboard
- Links to /app/, /land-acq-pro/, or other projects
- Social media except Instagram
- Third-party analytics or tracking
- External stylesheets or scripts (inline only)

---

## 🎨 Design Consistency

**Colors (use CSS variables):**
- Green: `#2e7d46` (nature, calm, growth)
- Brown: `#8b5a2b` (earthy, warm, acorn)
- Red/Swirl: `#ff6b57` (big feelings, emotion)
- Cream: `#fff8ec` (background, approachable)
- Tan: `#d9a05b` (secondary, autumn)

**Fonts:**
- Headings: Baloo 2 (playful, kid-friendly)
- Body: Nunito (readable, modern)

**Layout:**
- Corner radius: 22px (rounded, approachable)
- Max width: 1080px (readable, not overwhelming)
- Spacing: 72px sections (breathing room)

**Animations:**
- Subtle (bob, drift, fade)
- Hover effects on clickable elements
- No disorienting or overstimulating effects

---

## 📊 Operations & Tracking

**Operations tracker:** `/docs/DYLAN-SITE-OPERATIONS.md`

**When to update operations file:**
- Domain renews or changes → update expiry date
- Hosting setup changes → update provider/location
- Costs change → update cost summary
- New integrations added → add to table
- Auto-renew status changes → update immediately

**Current status:**
- Domain: dylantheacorn.com (Porkbun, expires May 24, 2027)
- Hosting: Vercel free tier (from GitHub)
- Newsletter: mailto (can upgrade to Formspree)
- Instagram: @dylantheacorn
- Contact: elizporter15@gmail.com

---

## 🚀 Git Workflow

**Branch:** `claude/dylan-big-feelings-website-ntcrd2`

```bash
# Before starting
git status  # Verify on correct branch
git pull    # Get latest changes

# After edits
git status  # Review what changed
git diff    # Check all changes are Dylan-only
git add public/dylan-the-acorn/  # Stage Dylan files only
git commit -m "Clear, descriptive message"
git push -u origin claude/dylan-big-feelings-website-ntcrd2
```

**Commit messages:**
- Be specific: "Add 3 Amazon reviews + personalize Seth's bio"
- Don't be vague: Avoid "Update site" or "Fix stuff"
- Reference what changed: "Add event for Sep 14 library signing"
- Include why: "Enables parents to see Seth's timeline journey"

---

## ✅ Pre-Push Checklist

Before every push:
- [ ] All edits are in `/public/dylan-the-acorn/` only
- [ ] No references to other projects (dashboard, Land Acq Pro, etc.)
- [ ] No fabricated content (reviews, events, bio)
- [ ] No character artwork modifications (only official art)
- [ ] All images optimized and in `images/` folder
- [ ] Tested locally and works correctly
- [ ] Mobile responsive (tested at 375px width)
- [ ] All links work (tested in browser)
- [ ] Commit message is clear and specific
- [ ] Ready to push as single batch (or part of agreed batch)

---

## 🚨 Common Mistakes

❌ **Pushing multiple times a day**
→ Use up quota; batch instead

❌ **Linking to other projects**
→ Breaks isolation; remove link

❌ **Modifying character art**
→ Violates owner rules; use official art only

❌ **Adding fake reviews**
→ Undermines credibility; only real reviews ≥3 stars

❌ **Testing in production**
→ Always test locally first

---

## 📞 Questions Before Editing?

**Ask user for permission if:**
- Adding major new sections (not in current design)
- Changing domain, hosting, or infrastructure
- Adding external dependencies or APIs
- Adding tracking/analytics
- Modifying character appearances

**Proceed without asking if:**
- Adding real reviews/events/content
- Fixing bugs or typos
- Improving responsive design
- Adding new free resources (coloring, PDFs)
- Updating operations tracker

---

**Golden rule:** This is Seth's book, Seth's domain, Seth's rules. Respect the project boundaries and the batching workflow. When in doubt, ask the user.
