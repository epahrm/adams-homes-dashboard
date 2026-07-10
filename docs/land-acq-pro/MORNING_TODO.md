# Morning to-do — Land Acq Pro

_Left for Elizabeth. Everything below is either shipped and waiting on you, or a
short decision I need before I build the next piece._

## ✅ Shipped overnight (all merged to `main`, QA 149/149)
- Wholesaler as a **third deal type** + **Wholesaler CRM** (labels who they are)
  and the **spread** (what they made off us), logged at closing.
- **Download Closed (by month)** CSV — the year-long closings record.
- Earlier batch: premium "possible → TBD", confirm-offer-sent clock, seller-name
  fix on the VAC-14, Adams logo on the cover letter, follow-ups capped at 10,
  on-market listing links, commissions in metrics, cancellations out of ROI,
  Realtor CRM look-up, PDF/JPEG contract upload, off-market "Mailed → CRM".
- **Team demo:** shareable guide (Artifact link) + recorded walkthrough video.

## 👀 Waiting on you (quick, when you log in)
1. **Deploy is throttled.** Vercel hit its free-plan cap of **100 deploys/day**,
   so the **live site won't rebuild until the cap resets (~24h) or you upgrade to
   Pro**. Everything is merged to `main` — it just needs a deploy to go live.
   → Decide: wait for reset, or upgrade to Pro so it deploys now.
2. **Email lead feed + auto-emailed reports need the backend.** The Vercel Gmail
   env vars (`LANDACQ_GMAIL_USER`, `LANDACQ_GMAIL_APP_PASSWORD`, `CRON_SECRET`)
   are still malformed on your side (password length was 1640, should be 16).
   → Fix those in Vercel and the live email ingest + month-end report emails turn on.
   Until then: reports download on demand, sweeps run via the Redfin cron.

## ❓ Questions for me (I'll ask one at a time when you're ready)
- **Wholesaler spread** — should the total spread paid to wholesalers show up in
  the **metrics / reports** too (not just the Wholesaler CRM)? (yes / no)
- **Projections vs. actuals** — you mentioned tracking projections against actuals
  monthly/quarterly. I need your **monthly targets** (e.g. contracts, closings) to
  build the projection column against the actuals I already compute.
- **Closed export** — one CSV grouped by month is live. Want a **PDF** version too
  for sharing, or is CSV enough?

## 📎 Deliverables to share with your team
- **Guide (link):** the section-by-section platform tour (published as an Artifact).
- **Video:** `land-acq-pro-demo.webm` (sent in chat).
- Static copy of the guide: `docs/land-acq-pro/platform-guide.html`.

_Ping me when you're ready to log in and I'll walk the questions one by one._
