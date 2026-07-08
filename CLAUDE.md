# Working notes for Claude sessions

## Communication
- Whenever you report a delivery/deployment update in chat, ALWAYS include
  the relevant live link(s) in that same message — preview URL and PR link —
  so the user never has to scroll back through the chat to find them.

## Travel planning
- Before any trip-planning work, read `docs/travel/` in this order:
  `PLANNING_STANDARD_V2.md` (wins on conflicts) →
  `EP_TRAVEL_PLANNER_REFERENCE_GUIDE.md` → `EXECUTIVE_TRAVEL_PLAYBOOK.md` →
  `PREFERENCES.md` → the relevant file in `cities/`.
- The family travel app lives at `public/travel/` (static, self-contained,
  offline-first). Bump `VERSION` in `public/travel/sw.js` whenever any file
  in that directory changes, or installed clients keep the old version.
