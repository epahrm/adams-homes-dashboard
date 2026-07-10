# Land Acq Pro — To-Do & Decisions for Elizabeth

Running list of things that need your input, wording, or a decision. I'll keep
adding to this as we go.

## Needs your wording / design
- [ ] **Closing thank-you + referral letter** — a *placeholder draft* is live on
      the closed-deal screen (warm "stork bringing a baby home / building a home
      for a new family" theme + referral ask). **Finalize the wording**, and
      decide if it should be a **designed printable piece** (letterhead, imagery)
      vs. plain letter. Send me your version and I'll drop it in.

## Needs a decision / answer
- [ ] **MLS / IDX feed** — confirm with Kevin/broker whether Adams has IDX/RETS/
      Spark access (unlocks the automated on-market feed).
- [ ] **Brand secondary color** — postcard handoff says navy + *forest green*;
      logo/site are navy + *red*. Which for postcards/emails?
- [x] **Kevin's contact confirmed** (locked everywhere):
      Kevin Nelson · Regional Land Acquisitions · Adams Homes — Orlando ·
      4401 Vineland Rd. A-11, Orlando, FL 32811 · (407) 523-0908 ·
      ecland@adamshomes.com · www.AdamsHomes.com

## Needs your action (to go live)
- [ ] **Database** — the production DB is currently down (Supabase free tier
      paused). Move to **Neon free tier** (no hard pausing + restore/backups,
      no cost) or upgrade Supabase to Pro. Just set `DATABASE_URL` in Vercel;
      tables auto-create. See the database note below.
- [ ] **Lead-source accounts** — create free accounts + saved-search alerts on
      Zillow / Realtor.com / Crexi / Land.com / LoopNet, pointed at
      `landacq.leads@gmail.com`. Full list + status in **SOURCES.md**.
- [ ] **Turn off the Vercel login wall** + set the admin password
      (`LAND_ACQ_ADMIN_KEY`) — see LAUNCH_CHECKLIST.md.
- [ ] **Email feeds:** point your Zillow/Crexi saved-search alerts at
      `landacq.leads@gmail.com`, and add the three Vercel env vars
      (`LANDACQ_GMAIL_USER`, `LANDACQ_GMAIL_APP_PASSWORD`, `CRON_SECRET`).
- [ ] **Postcards:** you're designing the artwork — I'll build upload
      placeholders (front/back + QR slot) and the tracking around them.

## Later (planned build, no action needed now)
- Off-market county sweep · motivation ranking · "needs attention" alerts ·
  automated email send · admin settings page · ROI reports · multi-market.
  (Full list in FEATURES.md.)
