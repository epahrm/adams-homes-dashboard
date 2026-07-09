# Working notes for Claude sessions

## Verification (Elizabeth's rule — do not skip)
- NEVER report a deploy as done/live without verifying the DEPLOYED URL —
  local tests are not enough. Fetch the live page and confirm new assets
  actually load (Vercel preview protection 302s subresources to SSO, which
  local testing never catches). If the live URL can't be reached from the
  session, say so explicitly rather than implying it was checked.
- Prefer inlining assets (data URIs) in public/travel — the app must have
  no external subresources so protection/caching can't break it.

## Deploys
- Vercel Hobby caps ~100 deployments/day and each push triggers a build.
  BATCH commits during rapid iteration — do not push after every small
  change. If rate-limited, keep committing+pushing (work stays safe in
  git); the newest commit deploys when the quota resets (~24 h). Always
  tell Elizabeth when the live preview is behind the repo.

## Communication
- LINK FOOTER (Elizabeth 2026-07-08, supersedes the big-pushes-only link
  rule): during ANY active build session, end EVERY message with a
  one-line footer: `🔗 Live: <deployed URL>` so the newest message always
  has the site one tap away — Elizabeth must never scroll back to find
  it. Append "(deploy pending — showing vN)" when the live site is behind
  the repo. This applies across ALL builds/projects, not just travel.
- Screenshots are still milestones-only.

## Travel planning
- Before any trip-planning work, read `docs/travel/` in this order:
  `PLANNING_STANDARD_V2.md` (wins on conflicts) →
  `EP_TRAVEL_PLANNER_REFERENCE_GUIDE.md` → `EXECUTIVE_TRAVEL_PLAYBOOK.md` →
  `PREFERENCES.md` → the relevant file in `cities/`.
- The family travel app lives at `public/travel/` (static, self-contained,
  offline-first). Bump `VERSION` in `public/travel/sw.js` whenever any file
  in that directory changes, or installed clients keep the old version.
