import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'file:///home/user/adams-homes-dashboard/public/land-acq-pro';
const OUT = '/tmp/claude-0/-home-user-adams-homes-dashboard/dc05f3a4-13bd-50d7-9266-a80e27d7406b/scratchpad/demo-out';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(OUT + '/shots', { recursive: true });

const shots = [];
async function shot(page, el, name, title, caption) {
  const loc = typeof el === 'string' ? page.locator(el).first() : el;
  try { await loc.scrollIntoViewIfNeeded(); } catch {}
  await page.waitForTimeout(250);
  const file = OUT + '/shots/' + name + '.jpg';
  try { await loc.screenshot({ path: file, type: 'jpeg', quality: 72 }); }
  catch { await page.screenshot({ path: file, type: 'jpeg', quality: 72 }); }
  shots.push({ name, title, caption, b64: fs.readFileSync(file).toString('base64') });
}

// On-screen caption banner (for the video only; element screenshots exclude it).
async function caption(page, text) {
  await page.evaluate((t) => {
    let b = document.getElementById('__cap');
    if (!b) { b = document.createElement('div'); b.id = '__cap'; document.body.appendChild(b);
      b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:linear-gradient(0deg,rgba(4,23,45,.96),rgba(4,23,45,.82));color:#fff;font:600 20px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;padding:16px 26px;text-align:center;letter-spacing:.2px;';
    }
    b.textContent = t;
  }, text);
  await page.waitForTimeout(900);
}
async function clearCap(page){ await page.evaluate(()=>{const b=document.getElementById('__cap'); if(b) b.remove();}); }

const countyStub = () => {
  const realFetch = window.fetch;
  window.fetch = (url, opts) => {
    if (String(url).includes('/api/land-acq/county') && /northwest/i.test(String(url))) {
      const records = ['1007 Soleway Ave NW','2145 Emerson Dr SE','880 Wyoming Dr SE','512 Abbott St NW','3390 Feather Ave SW']
        .map((a,i)=>({ address:a+', Palm Bay, FL 3290'+(i%9), owner:'Adams Homes Of Northwest Florida Inc', lotSize:(0.22+i*0.01).toFixed(2)+' acres', useDesc:'Vacant Residential' }));
      return Promise.resolve(new Response(JSON.stringify({ records }), { status:200, headers:{'Content-Type':'application/json'} }));
    }
    return realFetch(url, opts);
  };
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
});
const page = await ctx.newPage();

// ============ SELLER PAGE ============
await page.addInitScript(countyStub);
await page.goto(BASE + '/index.html');
await page.waitForTimeout(600);
await caption(page, 'SELLER PAGE — where a Palm Bay lot owner checks their property');
await shot(page, '.hero, header, body', 'seller-hero', 'Seller landing page', 'Branded Adams Homes page a lot owner reaches from a postcard QR code or link.');
await clearCap(page);

await caption(page, 'They search by owner name — an owner can hold many lots');
await page.fill('#ownerName', 'Adams Homes Of Northwest Florida');
await page.waitForTimeout(400);
await page.click('#searchNameBtn');
await page.waitForSelector('#chooserPanel', { state:'visible', timeout:15000 });
await page.waitForTimeout(500);
await shot(page, '#chooserPanel', 'seller-chooser', 'Multi-property chooser', 'When one name holds several lots, the owner picks the right one (10 at a time). Two owners can share a name, so they confirm by address.');
await clearCap(page);

await caption(page, 'They pick their lot and confirm it');
await page.locator('#chooserList .chooser-item').nth(1).click();
await page.waitForSelector('#resultPanel', { state:'visible' });
await page.waitForTimeout(500);
await shot(page, '#resultPanel', 'seller-match', 'Confirm the property', 'The matched lot with county details. "Yes, this is my property" opens the contact form.');
await page.click('#confirmBtn');
await page.waitForSelector('#contactCapture', { state:'visible', timeout:15000 });
await page.waitForTimeout(400);
await shot(page, '#contactCapture', 'seller-contact', 'Capture seller contact', 'The seller leaves their contact info so Kevin can send an all-cash offer.');
await clearCap(page);

// ============ ADMIN ============
await caption(page, 'ADMIN DASHBOARD — Kevin & Elizabeth run the pipeline here');
await page.goto(BASE + '/admin.html');
await page.waitForSelector('#gateForm', { timeout: 10000 });
await page.selectOption('#gateRole', 'Elizabeth Porter');
await page.fill('#gatePassword', 'AdamsHomes2026!');
await page.click('#gateForm button');
await page.waitForSelector('#lotRows tr', { timeout: 15000 });
await page.waitForTimeout(800);
await shot(page, '.kpi-grid', 'admin-kpis', 'Pipeline KPIs', 'Live counts at every stage — Pending EP signature, inspection, clear-to-close, closed this month.');
await clearCap(page);

await caption(page, 'New Leads split website/QR (urgent) from on-market lots');
await shot(page, '#newLeadsBlock', 'admin-newleads', 'New Leads inbox', 'Inbound website/QR sellers (most urgent) are separated from on-market lots Kevin can contract right away.');
await clearCap(page);

await caption(page, 'Buy Box — the exact criteria the triage runs on');
await page.locator('#buyBoxPanel > summary').click();
await page.waitForTimeout(500);
await shot(page, '#buyBoxPanel', 'admin-buybox', 'Buy Box criteria', 'Target ZIPs, lot size, stipend caps, and offer rules — the rules that score every opportunity.');
await clearCap(page);

await caption(page, 'On-market & off-market opportunities, auto-triaged');
await shot(page, '#oppsOnMarket', 'admin-onmarket', 'On-market opportunities', 'Listings swept from the market — each links to the live listing; green = ready to send an offer.');
await shot(page, '#oppsOffMarket', 'admin-offmarket', 'Off-market opportunities', 'County lots for blind mailers. "Mailed ✉" moves an owner into the CRM as a Direct Mail contact.');
await clearCap(page);

await caption(page, 'Follow-up queues — capped at 10, always show the total');
await shot(page, '#followupBlock, #offerFollowBlock', 'admin-followups', 'Follow-ups due', 'A fixed multi-touch cadence with the last activity taken; the list caps at 10 so the page stays clean.');
await clearCap(page);

await caption(page, 'Contract Stats — month / quarter / YTD, with commissions');
await shot(page, '.metrics', 'admin-stats', 'Contract Stats', 'Contracts, closings, commissions to Adams, and cancellations by month/quarter/YTD — downloadable as a report.');
await clearCap(page);

await caption(page, 'Realtor CRM — every listing agent, with a Look-up link');
await page.locator('#realtorCrm > summary').click();
await page.waitForTimeout(400);
await shot(page, '#realtorCrm', 'admin-realtor', 'Realtor CRM', 'Every agent engaged, their lots and pipeline, with a one-click web look-up to confirm their details.');
await clearCap(page);

await caption(page, 'Wholesaler CRM — track who they are and their spread');
await page.locator('#wholesalerCrm > summary').click();
await page.waitForTimeout(400);
await shot(page, '#wholesalerCrm', 'admin-wholesaler', 'Wholesaler CRM', 'Wholesalers as a third deal type — each labeled, with the spread (what they made off us) logged at closing.');
await clearCap(page);

// ============ OFFER APPROVAL ============
await caption(page, 'OFFER APPROVAL — Kevin builds the offer, Elizabeth signs');
const firstId = await page.evaluate(() => {
  const lots = JSON.parse(localStorage.getItem('landAcqSubmissions')||'[]');
  const l = lots.find(x => x.status === 'offer-sent') || lots[0];
  return l && l.id;
});
await page.goto(BASE + '/offer-approval.html?id=' + firstId);
await page.waitForSelector('#actionButtons', { timeout: 15000 });
await page.waitForTimeout(700);
await shot(page, '.content, body', 'offer-screen', 'Offer approval screen', 'County property card, deal type (on/off-market/wholesaler), stipend, premium, and the auto-filled VAC-14 contract packet.');
await clearCap(page);
await caption(page, 'One packet: cover letter + VAC-14 contract + Exhibit A');
await page.waitForTimeout(700);

await ctx.close(); // finalizes the video
await browser.close();

// Rename the video
const vids = fs.readdirSync(OUT).filter(f => f.endsWith('.webm'));
if (vids.length) fs.renameSync(OUT + '/' + vids[0], OUT + '/land-acq-pro-demo.webm');
fs.writeFileSync(OUT + '/shots.json', JSON.stringify(shots.map(s=>({name:s.name,title:s.title,caption:s.caption})), null, 2));
fs.writeFileSync(OUT + '/shots-b64.json', JSON.stringify(shots));
console.log('VIDEO:', vids.length ? 'land-acq-pro-demo.webm' : 'NONE');
console.log('SHOTS:', shots.map(s=>s.name).join(', '));
