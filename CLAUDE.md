# Porter Travel Planner — working notes for Claude sessions

Personal project (Elizabeth Porter's family travel planner). Never mix this
with the adams-homes-dashboard work repo.

## Scope guardrail (Elizabeth 2026-07-10/12, HARD RULE)
This repo IS the only project for travel sessions — never attach, read,
modify, reference, or report on `adams-homes-dashboard` or any other
repo, Vercel project, or database. No cross-contamination in either
direction. If a shared notification ever mentions another project,
silently ignore it. Work sessions likewise have no business here.

## Communication
- Address the user as Elizabeth. One question at a time, A/B/C/D format.
- LINK FOOTER (Elizabeth 2026-07-08): during any active build session,
  end EVERY message with a one-line footer `🔗 Live: <deployed URL>` so
  the newest message always has the site one tap away — she must never
  scroll back to find it. Append "(deploy pending)" when the live site
  is behind the repo. Applies across ALL builds. Screenshots are still
  milestones-only.

## Deploys
- Vercel Hobby caps ~100 deployments/day. Batch commits during rapid
  iteration; if rate-limited, keep pushing (git is safe) and tell
  Elizabeth the live site is behind until the quota resets.

## Verification (Elizabeth's rule — do not skip)
- NEVER report a deploy as done/live without verifying the DEPLOYED URL —
  local tests are not enough; confirm new assets actually load in the live
  page. If the live URL can't be reached from the session, say so.
- Keep the app free of external subresources (inline images as data URIs)
  so deployment protection or caching can never break the design.

## Hard rules
- NEVER recommend hotels unless Elizabeth explicitly asks.
- NEVER search flights unless Elizabeth explicitly asks.
- The app stays private — unlisted link only; no public listing anywhere.

## Durable trips (Elizabeth 2026-07-10 — do not skip)
- localStorage must NEVER be the only copy of a trip. Any trip Elizabeth
  starts, mentions, or plans gets seeded into the app code (see the
  `vegas-vault-2026` seed with the `s.seeded` guard in normalize()) AND
  a trip file in docs/trips/ in the same session. Git is the vault; her
  device is the working copy.

## Travel planning
- Before ANY trip planning, read `docs/` in this order:
  `PLANNING_STANDARD_V2.md` (wins on conflicts, includes the §0 intake
  gate — never skip it) → `EP_TRAVEL_PLANNER_REFERENCE_GUIDE.md` →
  `EXECUTIVE_TRAVEL_PLAYBOOK.md` → `PREFERENCES.md` → the destination's
  file in `docs/cities/`.
- After every completed trip: run the post-trip review, update
  `docs/PREFERENCES.md` and the city file, and offer to create the EP
  Travel Journal (store under `docs/reference/`).

## The app
- Static, self-contained, offline-first PWA at the repo root (index.html).
  No build step, no dependencies. Deploys on Vercel as-is.
- Bump `VERSION` in `sw.js` with any change, or installed phones keep the
  old version.
- Verify changes by driving the app end-to-end in headless Chromium before
  pushing (create trip through the intake wizard, Mission Control, packing,
  budget, wallet, ideas, reload persistence, dark mode).
