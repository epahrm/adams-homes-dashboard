# Land Acq Pro — Feature Sheet

Every function, grouped by what the **seller sees** vs. what the **team uses**.
Palm Bay vacant-lot acquisition platform · Adams Homes.

---

# 🟦 CUSTOMER-FACING — Seller Landing Page
*Public page at **/sell** (adams-homes-dashboard.vercel.app/sell). Zero login, zero admin surface.*

| # | Function | What it does |
|---|----------|--------------|
| 1 | **Cash-offer hero** | "Turn Your Empty Lot Into Cash" — national-builder, cash-forward positioning; floating "100% Cash" offer card. |
| 2 | **Property search** | Seller types their **address or owner name**; the page looks it up against **Brevard County records** in real time. |
| 3 | **Research-request form** | If the lookup can't auto-match, a short form (name, address, phone, email) captures the lead instead. |
| 4 | **Instant lead capture** | Every search/submission is saved and lands in Kevin's dashboard as a **New Lead**. |
| 5 | **QR postcard entry** | Scanning the mailer QR opens this page; the scan is **logged to that property/batch** for campaign tracking. |
| 6 | **Trust / stats band** | 65,000+ homes, 75,000+ lots, 100% cash, days-to-close — credibility at a glance. |
| 7 | **"Why Adams Homes" cards** | Scale, no-banks/no-delays, lots purchased, proven local team. |
| 8 | **How-it-works steps** | Plain-language walkthrough of the sell process. |
| 9 | **Kevin introduction + contact** | Photo, name, title, **click-to-call** and **email** buttons; "offers sent Mon–Fri." |
| 10 | **Security & polish** | HTTPS/secure, fully mobile-responsive, all data rendered safely, **no link to any admin page**. |

---

# 🟥 ADMIN — Pipeline Dashboard
*Password-gated at **/land-acq-pro/admin.html** · Kevin & Elizabeth share one live board.*

### Access & overview
| Function | What it does |
|----------|--------------|
| **Login gate + role toggle** | Password-protected; sign in as **Kevin** or **Elizabeth**. |
| **KPI tiles** | Pending EP Sig · IP · Manager Driven · Survey Rcv'd · CD Approved · CTC · Closed (MTD). |
| **Monthly target tracker** | Progress toward 50 accepted contracts/month. |

### Daily worklists (nothing rides on memory)
| Function | What it does |
|----------|--------------|
| **New Leads** | QR scans + seller submissions awaiting a first offer. |
| **Follow-Ups Due** | Multi-touch cadence (call → call → text → 2nd mailer → re-offer); shows who to contact, the channel, and how overdue. **Log Touch** advances it. |
| **New Opportunities** | Buy-box matches with 🟢/🟡/🔴 light + suggested offer; **Send Offer / Hold / Unsuitable**. |
| **Re-offer Due** | Declined sellers resurface after 30 days for a follow-up offer. |

### Lead intake tools (toolbar)
| Function | What it does |
|----------|--------------|
| **+ Add Deal / Contract** | Drop an existing/in-progress deal into the pipeline at the right stage. |
| **Import Contacts (CSV)** | Bulk-upload mailer lists or deals with a **review-and-confirm** preview (flags duplicates); optional `Stage` column. |
| **Off-Market Sweep** | Pulls vacant Palm Bay lots from county records for blind mailers; preview count, download list, or add to worklist. |
| **Postcards / QR** | Generates the batch QR + mailing-list export for the print vendor; tracks scans. |

### Buy box & money
| Function | What it does |
|----------|--------------|
| **Stipend panel** | Approved stipends by utility type (Well/Septic $30k, Water/Septic $30k, Water/Sewer $50k); editable with audit log. |
| **Costs, ROI & Renewals** | Accounts/subscriptions w/ **renewal alerts**, mailing costs (print + postage separate), **ROI tiles**, **commission tracker** (3% listed / $0 off-market, held-vs-given-away), **cancellations by reason**, **lead-source conversion**. |

### Pipeline, CRM & data
| Function | What it does |
|----------|--------------|
| **Live deal table** | Active deals with status/day/source filters + pagination. |
| **Closing calendar** | This month + next, clickable deals, monthly counts. |
| **Realtor CRM** | Every listing agent engaged, ranked by volume, with contact + pipeline breakdown. |
| **Export** | Pipeline to **CSV / PDF**. |
| **Lot notes & docs** | Per-lot note log and document uploads. |

---

# 🟧 ADMIN — Offer Approval Screen
*Opened per deal from the dashboard (**offer-approval.html**).*

| Function | What it does |
|----------|--------------|
| **Auto county-record pull** | On open, fills owner, mailing address, parcel #, acreage, land use; **confirms the lot is vacant**. |
| **Stipend check** | Shows the applicable stipend and warns if the offer goes over. |
| **Offer terms** | Offer amount (capped at stipend), EMD ($100 default), **commission to Adams** (3% listed / $0 off-market, Kevin-confirmed, shown as a cash-to-close deduction). |
| **Listing-agent auto-fill** | For listed deals: agent name, brokerage, phone, email, MLS # — offer routes to the agent. |
| **Lot premiums** | Corner ($8k preset), oversized, waterview, cul-de-sac, etc. — separate from stipend. |
| **Cover letter** | Auto-generated from Kevin (credibility + urgency, 14-day expiry, e-sign ready). |
| **Signature order + timeline** | Seller signs first, **Elizabeth counter-signs last**; VAC-14 math auto-sets IP (sig +45d) and Thursday closing. |
| **Seller Declined / Cancel** | Sets the 30-day re-offer, or logs a cancelled contract with a reason. |
| **Notes to Elizabeth** | Free-text handoff notes on the deal. |
| **Post-closing thank-you card** | Stork "deliver a dream home" artwork with a download-to-send button on closed deals. |

---

# ⚙️ Platform (behind the scenes)
- Hosted on **Vercel** + shared **Supabase Postgres** (one live pipeline for the whole team).
- **County data** via the public City-of-Palm-Bay parcel service (no bot-wall).
- **On-market leads** via saved-search email alerts (Zillow/Realtor/Crexi/etc.) — legal alternative to scraping.
- **Speed-to-lead alert** to Kevin the moment a seller submits (activates with outbound email).
- **91+ automated QA checks** run on every change; security-reviewed (no admin surface on the seller page, all data rendered safe).
