# Land Acq Pro — Launch Checklist

Everything needed to take the demo to a permanent, production launch.

## 1. Hosting & domain
- [ ] Decide the public URL (e.g. `landacq.adamshomes.com` or the Vercel
      domain) and point DNS at the deployment.
- [ ] Turn OFF Vercel deployment protection for the public/seller page so
      sellers can reach it (keep the admin pages behind the password gate).
- [ ] Generate the QR code for the postcards pointing at the seller landing URL.

## 2. Secrets & environment (Vercel project settings)
- [ ] `LAND_ACQ_ADMIN_KEY` — set a strong shared admin password (replaces the
      demo default). Consider separate Kevin/Elizabeth passwords later.
- [ ] `DATABASE_URL` — confirm the Supabase Postgres connection (already wired).
- [ ] Brevard County: confirm live search works from the production servers
      (BCPAO sits behind Cloudflare; if it blocks the server, add an API key or
      a scraping allowance, otherwise sellers fall back to the research form).

## 3. Data
- [ ] First real API call auto-creates the `land_acq_lots` and
      `land_acq_settings` tables — verify they exist and that Kevin/Elizabeth
      see the same pipeline from different devices.
- [ ] Confirm the stipend defaults (Well/Septic $30k, Water/Septic $30k,
      Water/Sewer $50k) and that changes log to the audit trail.

## 4. E-signature (Dotloop)
- [ ] Provide Dotloop access for Kevin's account (API/OAuth or documented
      manual send).
- [ ] Wire "Generate & Send Offer via Dotloop" to create/send the loop with the
      contract template + cover letter + county property card.

## 5. Email / notifications
- [ ] Choose the sender (SendGrid API key or a Gmail app password) and add it
      to the environment.
- [ ] Connect the two seller notifications: "contract received" and "fully
      executed / official."
- [ ] Optional: notify Elizabeth when a deal reaches "Pending EP Signature," and
      Kevin/GM when a deal is "Manager Driven."

## 6. Document storage
- [ ] Stand up real file storage (Supabase Storage bucket) so lot document
      uploads persist the actual files, not just filenames.

## 7. Content & branding
- [ ] Replace Kevin's photo if a newer headshot is preferred (currently set).
- [ ] Confirm final cover-letter wording and the contract template are current.
- [ ] Add Privacy Policy / Terms pages (footer links are placeholders).

## 8. Testing & sign-off
- [ ] Run the QA suite (`node qa/land-acq-pro.e2e.js`) — should be all green.
- [ ] End-to-end live test: seller submit → appears in dashboard → Kevin offer
      via Dotloop → seller signs → Kevin marks received → Elizabeth signs →
      timeline + Thursday closing computed → notifications delivered.
- [ ] Verify on real devices: iPhone, Android, iPad, desktop.

## 9. Operations
- [ ] Confirm database backups are on (Supabase automatic backups).
- [ ] Decide who can change stipends and rotate the admin password on a schedule.
- [ ] Basic monitoring/uptime check on the public URL.
