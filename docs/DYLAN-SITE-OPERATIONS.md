# Dylan the Acorn — Operations Tracker

Admin reference for dylantheacorn.com. Lives in `docs/` (private repo), NOT in
`public/`, so it is never served on the website. Keep this file updated
whenever hosting, costs, or accounts change — automated reminders (below)
assume it is accurate.

_Last updated: 2026-07-08_

## Where everything lives

| Asset | Provider / location | Login owner | Cost | Renewal / expiry |
|---|---|---|---|---|
| Domain `dylantheacorn.com` | Porkbun (order 10453999) | elizporter15@gmail.com | ~$11.08/yr | **May 24, 2027** — enable auto-renew! |
| Website hosting | Vercel, project `adams-homes-dashboard` (team `ecf-projects`), served from `public/dylan-the-acorn/` via middleware host rule | Vercel team login | $0 (Hobby plan) | None — but 100 deployments/day account-wide cap; batch pushes |
| Site source code | GitHub `epahrm/adams-homes-dashboard`, folder `public/dylan-the-acorn/` | GitHub account | $0 | None |
| Book listing (paperback) | Amazon KDP — ASIN B0H2KTZP97 | KDP account | $0 | None |
| Book 1 listing | Amazon — ASIN B0H2G8RC2P | KDP account | $0 | None |
| Instagram | @dylantheacorn | Instagram login | $0 | None |
| Contact email | elizporter15@gmail.com (event requests, merch waitlist, newsletter) | Gmail | $0 | None |
| Newsletter form | Not yet set up — currently mailto. Planned: Formspree free tier | — | $0 | — |

## Action checklist (as of last update)

- [ ] Vercel: add `dylantheacorn.com` + `www.dylantheacorn.com` to project domains
- [ ] Porkbun: set A record `@ → 76.76.21.21`, CNAME `www → cname.vercel-dns.com`
- [ ] Porkbun: turn ON auto-renew for the domain
- [ ] Collect first Amazon reviews → paste best ones into site (only ≥3 stars display; filter is enforced in code)
- [ ] Personalize Seth's bio on the author page
- [ ] First event for the events section
- [ ] Optional: Formspree account for real newsletter signups
- [ ] Optional: submit site to Google Search Console once domain is live

## Automated reminders (Claude Routines)

| Reminder | When | What it does |
|---|---|---|
| Domain renewal warning | One-shot, May 10, 2027 | Emails/notifies: dylantheacorn.com renews May 24 at Porkbun; verify auto-renew + card on file |
| Quarterly health check | 3rd of Jan/Apr/Jul/Oct | Checks the site is up, images load, and domain expiry isn't near; notifies only if something needs attention |

## Costs summary

Total running cost: **~$11/year** (domain only). Everything else is free tier.
