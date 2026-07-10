import fs from 'fs';
const DIR = '/tmp/claude-0/-home-user-adams-homes-dashboard/dc05f3a4-13bd-50d7-9266-a80e27d7406b/scratchpad/demo-out';
const shots = JSON.parse(fs.readFileSync(DIR + '/shots-b64.json', 'utf8'));
const img = name => 'data:image/jpeg;base64,' + (shots.find(s => s.name === name) || {}).b64;

const seller = [
  { n:'01', img:'seller-hero', title:'The seller landing page',
    bullets:['A branded Adams Homes page an owner reaches from a postcard QR code or a texted link.',
      'Leads with the trust case — one of the nation’s largest homebuilders, all cash, no agents, no commissions, no fees.',
      'One job: help the owner find their lot and start an offer.'] },
  { n:'02', img:'seller-chooser', title:'Find your property',
    bullets:['Search by owner name or street address.',
      'One owner can hold many lots — a builder can own dozens. The page lists them <b>10 at a time</b> and the owner picks the right one.',
      'Two different owners can share a name, so every option shows the address to confirm.'] },
  { n:'03', img:'seller-match', title:'Confirm the property',
    bullets:['Shows the matched lot with county detail — size, zoning, utilities.',
      '“Yes, this is my property” moves them straight to the contact step.'] },
  { n:'04', img:'seller-contact', title:'Send my info for an offer',
    bullets:['Captures name, phone, and email so Kevin can send an all-cash offer.',
      'Can’t find the lot? A short research request (phone optional) routes straight to Kevin.'] },
];

const admin = [
  { label:'Overview', img:'admin-kpis', title:'Pipeline at a glance',
    bullets:['Live counts at every contract stage — pending signature, inspection, clear-to-close, closed this month.',
      'A monthly target vs. actual on accepted contracts keeps the team honest.'] },
  { label:'Leads', img:'admin-newleads', title:'New Leads inbox',
    bullets:['Inbound website / QR sellers — the most urgent, because they reached out — are separated from on-market lots.',
      'On-market rows carry the source and listing title so Kevin can act immediately.'] },
  { label:'Strategy', img:'admin-buybox', title:'The Buy Box',
    bullets:['The exact criteria the triage runs on — target Palm Bay ZIPs, lot-size range, stipend caps by utility type, and the offer rules.',
      'Editable as the acquisition strategy changes.'] },
  { label:'Sourcing', img:'admin-onmarket', title:'On-market opportunities',
    bullets:['Listings swept from the market and auto-scored: green = ready to send, yellow = review.',
      'Every row links straight to the live listing; “Send Offer” opens the contract packet.'] },
  { label:'Sourcing', img:'admin-offmarket', title:'Off-market opportunities',
    bullets:['County lots for blind mailers — no listing, so each gets the standard stipend offer.',
      '“Mailed ✉” records who Kevin mailed and moves that owner into the CRM as a Direct Mail contact.'] },
  { label:'Cadence', img:'admin-followups', title:'Follow-ups due',
    bullets:['A fixed multi-touch cadence so no lead goes cold, showing the last activity taken and what’s next.',
      'Offer-sent deals get a 3-day nudge if the seller hasn’t moved. Every queue caps at 10 rows with the true total shown.'] },
  { label:'Reporting', img:'admin-stats', title:'Contract stats & reports',
    bullets:['Contracts, closings, commissions to Adams Homes, and cancellations — by month, quarter, and year-to-date.',
      'Download the stats as a report, plus a separate “Closed (by month)” export that keeps the full year’s closings on record.'] },
  { label:'CRM', img:'admin-realtor', title:'Realtor CRM',
    bullets:['Every listing agent engaged, with their lots and pipeline.',
      'A one-click web look-up confirms an agent’s brokerage and contact before Kevin relies on it.'] },
  { label:'CRM', img:'admin-wholesaler', title:'Wholesaler CRM',
    bullets:['Wholesalers are a third deal type alongside on-market and off-market — each clearly labeled by who they are.',
      'The <b>spread</b> — what they made off us — is logged at closing and totaled per wholesaler.'] },
];

const offer = { img:'offer-screen', title:'Offer approval & the contract packet',
  bullets:['The county property card, deal type (on-market / off-market / wholesaler), utility stipend, and any lot premium — or “premium possible, amount TBD” to finalize at closing.',
    'The literal Florida VAC-14 contract, auto-filled with the verified seller, price, and terms.',
    'Kevin confirms the offer was actually sent (that starts the 3-day clock); Elizabeth counter-signs to make it official.',
    'One packet to send: cover letter with the Adams Homes logo + the contract + an Exhibit A county property card.'] };

const li = b => '<li>' + b + '</li>';
const sellerCards = seller.map(s => `
  <article class="card">
    <div class="card-head"><span class="step">${s.n}</span><h3>${s.title}</h3></div>
    <figure><img loading="lazy" src="${img(s.img)}" alt="${s.title}"></figure>
    <ul>${s.bullets.map(li).join('')}</ul>
  </article>`).join('');

const adminCards = admin.map(s => `
  <article class="card">
    <div class="card-head"><span class="tag">${s.label}</span><h3>${s.title}</h3></div>
    <figure><img loading="lazy" src="${img(s.img)}" alt="${s.title}"></figure>
    <ul>${s.bullets.map(li).join('')}</ul>
  </article>`).join('');

const offerCard = `
  <article class="card">
    <div class="card-head"><span class="tag">Offer</span><h3>${offer.title}</h3></div>
    <figure><img loading="lazy" src="${img(offer.img)}" alt="${offer.title}"></figure>
    <ul>${offer.bullets.map(li).join('')}</ul>
  </article>`;

const css = `
:root{
  --paper:#f6f4ef; --surface:#ffffff; --ink:#16202e; --muted:#586675;
  --navy:#0a2c52; --navy-2:#14406e; --accent:#a6772c; --line:#e5e0d6;
  --shadow:0 1px 2px rgba(16,32,46,.06),0 6px 22px rgba(16,32,46,.08);
}
@media (prefers-color-scheme:dark){
  :root{ --paper:#0d1520; --surface:#15202c; --ink:#e9eff5; --muted:#9db0c1;
    --navy:#8fc0ec; --navy-2:#b9d6f2; --accent:#d29f4d; --line:#25313e;
    --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 26px rgba(0,0,0,.35); }
}
:root[data-theme="light"]{ --paper:#f6f4ef; --surface:#ffffff; --ink:#16202e; --muted:#586675;
  --navy:#0a2c52; --navy-2:#14406e; --accent:#a6772c; --line:#e5e0d6;
  --shadow:0 1px 2px rgba(16,32,46,.06),0 6px 22px rgba(16,32,46,.08); }
:root[data-theme="dark"]{ --paper:#0d1520; --surface:#15202c; --ink:#e9eff5; --muted:#9db0c1;
  --navy:#8fc0ec; --navy-2:#b9d6f2; --accent:#d29f4d; --line:#25313e;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 26px rgba(0,0,0,.35); }
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,sans-serif;
  -webkit-font-smoothing:antialiased;}
.wrap{max-width:940px;margin:0 auto;padding:0 22px}
.display{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;}
h1,h2,h3{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
  text-wrap:balance;font-weight:600;line-height:1.15;margin:0;}
a{color:var(--accent)}

/* Header */
header.hero{background:
  radial-gradient(120% 140% at 88% -20%, rgba(166,119,44,.18), transparent 60%),
  linear-gradient(180deg,#0a2c52,#0c3358);
  color:#eef3f8;padding:56px 0 46px;border-bottom:3px solid var(--accent);}
header.hero .wrap{max-width:940px}
.eyebrow{font:600 12px/1 ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:.22em;
  text-transform:uppercase;color:#e0c07f;margin:0 0 16px}
header.hero h1{font-size:clamp(34px,6vw,54px);color:#fff;letter-spacing:-.01em}
header.hero .lede{color:#c8d6e6;font-size:clamp(17px,2.4vw,20px);max-width:60ch;margin:16px 0 0}
.meta{display:flex;flex-wrap:wrap;gap:10px 26px;margin-top:26px;
  font:600 13px/1 ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:.04em;color:#9fb6cf}
.meta b{color:#e0c07f;font-weight:700}

/* Part intros */
.part{padding:56px 0 8px}
.part .kicker{font:600 12px/1 ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:.22em;
  text-transform:uppercase;color:var(--accent);margin:0 0 12px}
.part h2{font-size:clamp(26px,4vw,36px);color:var(--navy)}
.part p.intro{color:var(--muted);max-width:64ch;margin:14px 0 0;font-size:17px}

/* Cards */
.cards{display:flex;flex-direction:column;gap:30px;padding:30px 0 8px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;
  box-shadow:var(--shadow);padding:22px 22px 8px;overflow:hidden}
.card-head{display:flex;align-items:baseline;gap:14px;margin-bottom:16px}
.card-head h3{font-size:22px;color:var(--ink)}
.step{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-size:30px;font-weight:600;
  color:var(--accent);line-height:1;min-width:1.6em}
.tag{font:600 11px/1 ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;
  color:var(--accent);border:1px solid var(--line);border-radius:999px;padding:6px 11px;white-space:nowrap}
figure{margin:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#f0f3f7}
@media (prefers-color-scheme:dark){figure{background:#0c141d}}
:root[data-theme="light"] figure{background:#f0f3f7}
:root[data-theme="dark"] figure{background:#0c141d}
figure img{display:block;width:100%;height:auto}
.card ul{list-style:none;margin:18px 0 14px;padding:0;display:flex;flex-direction:column;gap:11px}
.card li{position:relative;padding-left:22px;color:var(--muted);font-size:15.5px;line-height:1.55}
.card li b{color:var(--ink);font-weight:700}
.card li::before{content:"";position:absolute;left:2px;top:9px;width:8px;height:8px;border-radius:2px;
  background:var(--accent);transform:rotate(45deg)}

footer{border-top:1px solid var(--line);margin-top:64px;padding:34px 0 60px;color:var(--muted);font-size:14px}
footer b{color:var(--ink)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
`;

const html = `<header class="hero"><div class="wrap">
  <p class="eyebrow">Adams Homes &middot; Regional Land Acquisitions</p>
  <h1>Land Acq Pro</h1>
  <p class="lede">The vacant-lot acquisition platform for Palm Bay — from the moment a lot owner finds their property to a signed, all-cash contract. This is a section-by-section tour of what the platform does.</p>
  <div class="meta"><span>Two surfaces: <b>seller page</b> &amp; <b>admin workspace</b></span><span>Palm Bay, FL</span><span>Companion <b>video walkthrough</b> included</span></div>
</div></header>

<main class="wrap">
  <section class="part">
    <p class="kicker">Part 1 &middot; The seller experience</p>
    <h2>What a lot owner sees</h2>
    <p class="intro">A homeowner reaches this page from a postcard QR code or a link. In four steps they find their lot and hand us what we need to send an offer.</p>
  </section>
  <div class="cards">${sellerCards}</div>

  <section class="part">
    <p class="kicker">Part 2 &middot; The admin workspace</p>
    <h2>How Kevin &amp; Elizabeth work the pipeline</h2>
    <p class="intro">Every lead, opportunity, follow-up, contract, and metric in one place — built to be scanned and acted on, not read top to bottom.</p>
  </section>
  <div class="cards">${adminCards}${offerCard}</div>

  <footer>
    <p><b>Land Acq Pro</b> — built for Adams Homes Regional Land Acquisitions, Palm Bay FL. Screens shown use demonstration data. The companion video walks through these same flows live.</p>
  </footer>
</main>`;

fs.writeFileSync('/home/user/adams-homes-dashboard/land-acq-pro-guide.html', '<style>' + css + '</style>\n' + html);
console.log('wrote land-acq-pro-guide.html', Math.round(fs.statSync('/home/user/adams-homes-dashboard/land-acq-pro-guide.html').size/1024) + 'KB');
