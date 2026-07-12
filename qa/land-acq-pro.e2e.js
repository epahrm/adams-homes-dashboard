/**
 * Land Acq Pro end-to-end test suite.
 *
 * Run:  node qa/land-acq-pro.e2e.js
 * Requires the `playwright` package (npm i --no-save playwright) and the
 * pre-installed Chromium at /opt/pw-browsers/chromium (override with
 * CHROMIUM_PATH). Exits non-zero if any check fails.
 */
const path = require('path');
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'file://' + path.resolve(__dirname, '../public/land-acq-pro');
const EXECUTABLE = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (ok || !detail ? '' : '  -> ' + detail));
}

async function noHorizontalOverflow(page) {
  return page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

(async () => {
  let launchConfig = {};
  if (fs.existsSync(EXECUTABLE)) {
    launchConfig.executablePath = EXECUTABLE;
  }
  const browser = await chromium.launch(launchConfig);

  // ---------- Responsiveness: all pages, all widths ----------
  for (const width of [320, 390, 768, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    for (const file of ['index.html', 'admin.html', 'offer-approval.html']) {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(BASE + '/' + file);
      await page.waitForTimeout(300);
      check(`${file} @ ${width}px: no horizontal overflow`, await noHorizontalOverflow(page));
      check(`${file} @ ${width}px: no page errors`, errors.length === 0, errors.join('; '));
    }
    await ctx.close();
  }

  // ---------- Customer page privacy + locked copy ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    await page.goto(BASE + '/index.html');

    const html = (await page.content());
    check('index: no admin link', !/admin\.html|offer-approval\.html/i.test(html));
    check('index: no login UI', !/login/i.test(html));
    check('index: Adams Homes logo present', await page.locator('.hero-brand img').isVisible());
    const bodyText = await page.evaluate(() => document.body.innerText);
    check('index: no pricing on public page', !/\$\s?\d/.test(bodyText), bodyText.match(/\$\s?\d[^\s]*/)?.[0]);
    check('index: hero headline', bodyText.includes('Turn Your Empty Lot Into Cash'));
    check('index: hero subtitle', bodyText.includes('Adams Homes buys vacant residential lots directly'));
    check('index: exactly 2 process steps', await page.locator('.step').count() === 2);
    check('index: Kevin card copy', bodyText.includes('Kevin Nelson') && /regional land acquisitions/i.test(bodyText));
    check('index: fastest-closing value prop retained', bodyText.includes('No one closes faster than Adams Homes'));
    check('index: why sell now section', bodyText.includes('Why Sell Now?'));
    check('index: footer logo present', await page.locator('.footer-logo img').isVisible());
    check('index: Kevin photo present', await page.locator('.kevin-card img.photo').isVisible());

    // Tap targets (buttons) at least 44px tall on mobile
    const minBtn = await page.evaluate(() =>
      Math.min(...[...document.querySelectorAll('button')]
        .filter(b => b.offsetParent !== null)
        .map(b => b.getBoundingClientRect().height)));
    check('index: tap targets >= 44px', minBtn >= 44, 'min button height ' + minBtn);

    // ---------- Seller flow: verified match ----------
    await page.fill('#ownerName', 'John Smith');
    await page.click('#searchNameBtn');
    await page.waitForSelector('#resultPanel', { state: 'visible' });
    check('search by name finds county record',
      (await page.textContent('#recOwner')).trim() === 'John Smith');
    // "Yes, this is my property" reveals the contact-capture form (we need a
    // way to reach the seller before we save the lead).
    await page.click('#confirmBtn');
    await page.waitForSelector('#contactCapture', { state: 'visible', timeout: 15000 });
    check('contact form shown after confirming property',
      await page.locator('#offerContactForm #ccPhone').isVisible());
    check('seller name pre-filled from record',
      (await page.inputValue('#ccName')).trim().length > 0);
    // Optional notes/questions field on the landing form (not required).
    check('landing contact form has an optional notes field',
      await page.locator('#offerContactForm #ccNote').isVisible());
    // Submitting with valid contact info saves the lead and shows confirmation.
    await page.fill('#ccPhone', '(321) 555-0100');
    await page.fill('#ccEmail', 'seller@example.com');
    await page.fill('#ccNote', 'Is the septic already in?');
    await page.click('#offerContactForm button[type="submit"]');
    await page.waitForSelector('#confirmMsg', { state: 'visible', timeout: 15000 });
    check('confirmation message shows',
      (await page.textContent('#confirmMsg')).toLowerCase().includes('offer'));

    // Duplicate handling
    await page.fill('#streetAddress', '123 Maple Avenue');
    await page.click('#searchAddressBtn');
    await page.waitForSelector('#resultPanel', { state: 'visible' });
    await page.click('#confirmBtn');
    await page.waitForSelector('#contactCapture', { state: 'visible', timeout: 15000 });
    await page.fill('#ccPhone', '(321) 555-0101');
    await page.fill('#ccEmail', 'dupe@example.com');
    await page.click('#offerContactForm button[type="submit"]');
    await page.waitForSelector('#resultMessage.error', { state: 'visible', timeout: 15000 });
    check('duplicate submission blocked', true);

    // ---------- Seller flow: no match -> not-found note + Call/Email Kevin ----------
    await page.fill('#streetAddress', '999 Nowhere Blvd, Palm Bay');
    await page.click('#searchAddressBtn');
    await page.waitForSelector('#notFoundNote', { state: 'visible', timeout: 15000 });
    check('unknown property shows not-found note', true);
    check('Call Kevin button present', await page.locator('.cantfind a[href^="tel:"]').count() >= 1);
    check('Email Kevin button present', await page.locator('.cantfind a[href^="mailto:"]').count() >= 1);
    // Research request captures a lead into the pipeline
    await page.click('#researchForm button[type=submit]');
    check('research form validation fires', await page.locator('#rfNameError').isVisible());
    await page.fill('#rfName', 'Jane Doe');
    await page.fill('#rfAddress', 'Corner lot near Malabar Rd, Palm Bay');
    await page.fill('#rfEmail', 'jane@example.com');
    // Phone is optional on the research request — submit without it.
    await page.click('#researchForm button[type=submit]');
    await page.waitForSelector('#researchMessage.success', { state: 'visible', timeout: 15000 });
    check('research request submits without a phone number', true);

    // ---------- Seller flow: owner with multiple lots -> chooser ----------
    // An owner (e.g. a builder) can hold many parcels, and two owners can share
    // a name. When the county returns more than one, show a chooser and let the
    // seller pick their lot rather than guessing the first.
    // Stub the county API (file:// can't be network-routed) so the page sees an
    // owner holding three lots.
    // A builder returns many lots — show 10, and only reveal more if the seller
    // says none of those are theirs.
    await page.addInitScript(() => {
      const realFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (String(url).includes('/api/land-acq/county') && /northwest/i.test(String(url))) {
          const records = Array.from({ length: 12 }, (_, i) => ({
            address: (100 + i) + ' Soleway Ave NW, Palm Bay, FL 32907',
            owner: 'Adams Homes Of Northwest Florida Inc', lotSize: '0.23 acres', useDesc: 'Vacant Residential',
          }));
          return Promise.resolve(new Response(JSON.stringify({ records }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        return realFetch(url, opts);
      };
    });
    await page.goto(BASE + '/index.html');
    await page.fill('#ownerName', 'Adams Homes Of Northwest Florida');
    await page.click('#searchNameBtn');
    await page.waitForSelector('#chooserPanel', { state: 'visible', timeout: 15000 });
    check('chooser count reflects full match total', (await page.textContent('#chooserCount')).trim() === '12');
    check('chooser shows only first 10 lots', (await page.locator('#chooserList .chooser-item').count()) === 10);
    check('show-more control visible when lots remain', await page.locator('#chooserMore').isVisible());
    // "None of these are mine" reveals the remaining lots, then hides the button.
    await page.click('#chooserMore');
    check('show-more reveals remaining lots', (await page.locator('#chooserList .chooser-item').count()) === 12);
    check('show-more control hidden once all shown', !(await page.locator('#chooserMore').isVisible()));
    // Picking a lot from the chooser resolves to that exact property.
    await page.locator('#chooserList .chooser-item').nth(10).click();
    await page.waitForSelector('#resultPanel', { state: 'visible', timeout: 15000 });
    check('choosing a lot loads that property',
      (await page.textContent('#recAddress')).includes('110 Soleway'));

    // ---------- Regression: symbol-only search must not match a record (F1) ----------
    await page.goto(BASE + '/index.html');
    await page.fill('#ownerName', '!!##');
    await page.click('#searchNameBtn');
    await page.waitForSelector('#notFoundNote', { state: 'visible', timeout: 15000 });
    check('symbol-only search shows not-found instead of matching a record',
      !(await page.locator('#resultPanel').isVisible()));

    // ---------- Regression: stored XSS must not execute in admin pages ----------
    await page.evaluate(() => {
      const lots = JSON.parse(localStorage.getItem('landAcqSubmissions') || '[]');
      lots.push({
        id: 424242, address: '1 Exploit Test Ln, Palm Bay, FL', status: 'pending',
        createdAt: new Date().toISOString(), source: 'QR Landing Page',
        ownerContact: '<img src=x onerror="window.__xss=1"> | (321) 555-0000 | evil@example.com',
        utilities: '<script>window.__xss=1<\/script> / Sewer: None',
        taxValue: '<b onmouseover=1>$1</b>'
      });
      localStorage.setItem('landAcqSubmissions', JSON.stringify(lots));
    });

    // ---------- Admin password gate ----------
    await page.goto(BASE + '/admin.html');
    check('admin: gate blocks dashboard', await page.locator('#gateOverlay').isVisible());
    await page.click('#gateForm button');
    check('admin: empty password rejected', await page.locator('#gateError').isVisible());
    await page.selectOption('#gateRole', 'Elizabeth Porter');
    await page.fill('#gatePassword', 'AdamsHomes2026!');
    await page.click('#gateForm button');
    await page.waitForSelector('#lotRows tr');
    check('admin: offline demo banner shows when server unreachable',
      await page.locator('#modeBanner').isVisible());
    check('admin: signed-in user shown in header',
      (await page.textContent('.topbar .who')).includes('Elizabeth'));

    // ---------- Stipend panel ----------
    const stipendTiles = await page.locator('#stipendGrid .stipend-tile').count();
    check('stipend tiles render (3 utility types)', stipendTiles === 3);
    check('water/sewer stipend default is $50,000',
      (await page.textContent('#stipendGrid')).includes('$50,000'));
    await page.click('#stipendEditBtn');
    await page.fill('input[data-key="water-sewer"]', '52000');
    await page.click('#stipendForm button[type=submit]');
    await page.waitForSelector('#stipendMsg.ok', { timeout: 10000 });
    check('stipend save confirms', (await page.textContent('#stipendMsg')).includes('Elizabeth'));
    check('stipend tile updated to $52,000',
      (await page.textContent('#stipendGrid')).includes('$52,000'));
    const auditText = await page.textContent('#stipendAuditList');
    check('stipend change audit-logged with user + from/to',
      auditText.includes('Elizabeth') && auditText.includes('$50,000') && auditText.includes('$52,000'));
    check('stipend column present in table',
      (await page.locator('table thead th').allTextContents()).includes('Stipend'));

    // ---------- Buy Box reference panel ----------
    check('buy box notes panel present', await page.locator('#buyBoxPanel').count() === 1);
    await page.locator('#buyBoxPanel > summary').click();
    const bbText = await page.textContent('#buyBoxPanel');
    check('buy box notes list the criteria',
      /Palm Bay ZIPs/i.test(bbText) && /stipend/i.test(bbText) && /Vacant/i.test(bbText));
    check('buy box notes say where opportunities show',
      /On-Market Opportunities/i.test(bbText) && /Off-Market Opportunities/i.test(bbText));

    // ---------- Opportunity boxes always discoverable ----------
    check('on-market opportunities box visible (empty-state ok)',
      await page.locator('#oppsOnMarket').isVisible());
    check('off-market opportunities box visible (empty-state ok)',
      await page.locator('#oppsOffMarket').isVisible());
    check('on-market Sweep Now control present',
      await page.locator('#sweepNowBtn').isVisible());
    // ---------- Layout (desktop width): two-column pairing + one-row KPI tiles ----------
    // The rest of this suite runs at mobile width (390px), where .row2 rightly
    // stacks to one column — these two checks need a desktop-sized viewport,
    // so resize just for them and restore mobile width immediately after.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(150);
    const onBox = await page.locator('#oppsOnMarket').boundingBox();
    const offBox = await page.locator('#oppsOffMarket').boundingBox();
    check('on-market and off-market boxes render on the same row (side by side)',
      onBox && offBox && Math.abs(onBox.y - offBox.y) < 5 && onBox.x !== offBox.x);
    // Measure the tile containers, not inner text — a wrapped two-word label
    // shifts its own .num down without the grid itself wrapping to a new row.
    const kpiTops = await page.locator('.kpi-grid .kpi').evaluateAll(
      els => els.map(e => Math.round(e.getBoundingClientRect().top)));
    check('all 7 KPI tiles render on one row (no wrap)',
      kpiTops.length === 7 && new Set(kpiTops).size === 1, JSON.stringify(kpiTops));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300); // Wait for UI to settle
    // ---------- No auto-reject: Kevin decides (Offer / Nurture / GM Defer / Unsuitable) ----------
    const cogan = page.locator('#oppsOffMarket .opp-row', { hasText: 'Cogan' });
    check('opportunity row shows Hold — Nurture button',
      (await cogan.locator('button', { hasText: 'Hold — Nurture' }).count()) === 1);
    check('opportunity row shows GM Defer button',
      (await cogan.locator('button', { hasText: 'GM Defer' }).count()) === 1);
    check('opportunity row shows Unsuitable button',
      (await cogan.locator('button', { hasText: 'Unsuitable' }).count()) === 1);
    check('on-market opportunity row shows the MLS number',
      /MLS\s/.test(await page.textContent('#oppsOnMarket')));
    check('auto-rejected panel is gone', (await page.locator('#oppsRejected').count()) === 0);
    // Per-box search filters that box.
    await page.fill('#offMktSearch', 'Cogan');
    await page.waitForTimeout(150);
    check('off-market per-box search matches', (await page.textContent('#oppsOffMarket')).includes('Cogan'));
    await page.fill('#offMktSearch', 'zzzznomatch');
    await page.waitForTimeout(150);
    check('off-market per-box search filters out non-matches',
      !(await page.locator('#oppsOffMarket .opp-row', { hasText: 'Cogan' }).count()));
    await page.fill('#offMktSearch', '');
    await page.waitForTimeout(150);
    // Unsuitable reveals reason chips; picking one dismisses with the reason.
    await cogan.locator('button', { hasText: 'GM Defer' }).click();
    await page.waitForTimeout(250);
    check('GM Defer moves the lot into the Holds & GM Defer box',
      await page.locator('#oppsHolds').isVisible()
      && (await page.textContent('#oppsHolds')).includes('Cogan'));
    check('held lot can go back to the worklist',
      (await page.locator('#oppsHolds .opp-row', { hasText: 'Cogan' }).locator('button', { hasText: 'Back to Worklist' }).count()) === 1);
    await page.locator('#oppsHolds .opp-row', { hasText: 'Cogan' }).locator('button', { hasText: 'Back to Worklist' }).click();
    await page.waitForTimeout(250);
    check('back-to-worklist returns the lot to off-market', (await page.textContent('#oppsOffMarket')).includes('Cogan'));

    // Off-market lots can be marked "Mailed" -> added to the CRM as a contact.
    check('off-market opportunity row has a Mailed -> CRM action',
      (await page.locator('#oppsOffMarket .opp-row', { hasText: 'Cogan' }).locator('button', { hasText: 'Mailed' }).count()) === 1);
    await page.locator('#oppsOffMarket .opp-row', { hasText: 'Cogan' }).locator('button', { hasText: 'Mailed' }).click();
    await page.waitForTimeout(300);
    check('mailed off-market lot leaves the worklist and enters the CRM as a Direct Mail contact',
      !(await page.textContent('#oppsOffMarket')).includes('Cogan')
      && await page.evaluate(() => JSON.parse(localStorage.getItem('landAcqSubmissions') || '[]')
           .some(l => (l.address || '').includes('Cogan') && l.source === 'Direct Mail' && l.status === 'pending' && l.mailedAt)));
    // The sweep modal offers a bulk "Add as Mailed -> CRM".
    await page.click('#sweepBtn');
    await page.waitForSelector('#sweepOverlay.show', { timeout: 5000 });
    check('sweep modal offers Add as Mailed -> CRM', await page.locator('#swMailed').isVisible());
    await page.click('#swCancel');
    // On-market opportunities link straight through to the listing found online.
    check('on-market opportunity row has a View listing link',
      (await page.locator('#oppsOnMarket a.opp-listing-link').count()) >= 1);
    check('View listing link opens in a new tab',
      (await page.locator('#oppsOnMarket a.opp-listing-link').first().getAttribute('target')) === '_blank');

    // ---------- Offers Sent box (awaiting seller response) ----------
    // Note: The "Awaiting Seller Response" block was folded into the "Offers Sent" box
    // Check that the Offers Sent section exists and is accessible
    check('Offers Sent section is visible',
      (await page.locator('h3').filter({ hasText: 'Offers Sent' }).count()) >= 1);

    // ---------- Contract stats (month / quarter / YTD) + cancellations review ----------
    const statsHeads = await page.locator('#contractStats thead th').allTextContents();
    check('contract stats show month / quarter / YTD columns',
      statsHeads.some(h => /month/i.test(h)) && statsHeads.some(h => /quarter/i.test(h)) && statsHeads.some(h => /year to date/i.test(h)));
    check('contract stats list contracts, closed, commissions, cancellations',
      /Contracts Accepted/i.test(await page.textContent('#contractStats'))
      && /Commissions to Adams Homes/i.test(await page.textContent('#contractStats'))
      && /Cancellations/i.test(await page.textContent('#contractStats')));
    // Commissions now live in the lot-metrics section (Contract Stats).
    check('commissions appear as a metric with M/Q/YTD dollar values',
      /^\$/.test((await page.textContent('#csComM')).trim())
      && /^\$/.test((await page.textContent('#csComY')).trim()));
    // Month/quarter/YTD report is downloadable from the metrics card.
    check('contract-stats report download control present',
      await page.locator('#downloadStatsBtn').isVisible());
    const statsDl = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.click('#downloadStatsBtn');
    check('contract-stats report downloads as CSV', !!(await statsDl));
    check('cancellations are not a running list on the dashboard',
      !(await page.locator('#cancelReviewOverlay.show').isVisible()));
    await page.click('#reviewCancelBtn');
    await page.waitForSelector('#cancelReviewOverlay.show', { timeout: 5000 });
    check('review cancellations opens an on-demand modal',
      await page.locator('#cancelReviewOverlay #cancelTable').isVisible());
    await page.click('#crClose');

    // ---------- Receipt upload on mailing costs ----------
    check('receipt upload control present on mailing modal',
      (await page.locator('#mReceiptBtn').count()) === 1 && (await page.locator('#mReceiptFile').count()) === 1);
    const rcptAccept = await page.getAttribute('#mReceiptFile', 'accept');
    check('receipt input accepts pdf and images',
      /pdf/i.test(rcptAccept) && /(image|jpe?g)/i.test(rcptAccept));

    // ---------- Data sync to admin ----------
    const leadsText = await page.textContent('#newLeadsBlock');
    check('new leads (pending) reach the New Leads inbox',
      leadsText.includes('123 Maple Avenue') && leadsText.includes('Malabar'));
    check('new leads inbox visible', await page.locator('#newLeadsBlock').isVisible());
    // Inbound/QR leads route to the urgent "Website Leads" group with a count.
    check('website leads group visible for inbound QR leads',
      await page.locator('#nlWebGroup').isVisible());
    check('website leads count shown',
      Number(await page.textContent('#nlWebCount')) >= 1);

    // ---------- Kevin flow: pipeline table, filters, calendar ----------
    check('closing calendar renders two months', await page.locator('#calGrid .cal-month').count() === 2);
    check('calendar entries link to deals', await page.locator('#calGrid a.cal-close[href^="offer-approval.html?id="]').count() >= 1);
    check('calendar summary shows monthly counts', /closing.*this month.*scheduled next month/i.test(await page.textContent('#calSummary')));
    check('KPI: Pending EP Sig present', (await page.textContent('.kpi-grid')).includes('Pending EP Sig'));
    check('KPI: Clear to Close present', (await page.textContent('.kpi-grid')).includes('Clear to Close'));
    check('cancellations no longer shown as an ROI tile',
      !/Cancellations/i.test(await page.textContent('#opsRoi')));
    check('scheduled-to-close metric populated', Number(await page.textContent('#mScheduled')) >= 1);

    // ---------- Realtor CRM: name/brokerage + internet lookup ----------
    await page.locator('#realtorCrm > summary').click();
    check('realtor CRM lists a name and brokerage',
      (await page.locator('#realtorRows .r-name').count()) >= 1 && (await page.locator('#realtorRows .r-brok').count()) >= 1);
    check('realtor rows have a Look up link to confirm the agent online',
      (await page.locator('#realtorRows a.r-lookup').count()) >= 1
      && /google\.com\/search/.test(await page.locator('#realtorRows a.r-lookup').first().getAttribute('href')));

    // ---------- Global search: find any deal at any stage ----------
    await page.fill('#globalSearch', 'Garcia');
    await page.waitForTimeout(200);
    check('global search finds a deal by owner name',
      await page.locator('#globalSearchResults a[href^="offer-approval.html?id="]').count() >= 1
      && (await page.textContent('#globalSearchResults')).includes('Oak'));
    await page.fill('#globalSearch', 'zzzznope');
    await page.waitForTimeout(200);
    check('global search shows no-match state', (await page.textContent('#globalSearchResults')).toLowerCase().includes('no deal'));
    await page.fill('#globalSearch', '');
    await page.waitForTimeout(100);

    // ---------- Wholesaler CRM: third deal type + spread tracking ----------
    await page.locator('#wholesalerCrm > summary').click();
    check('wholesaler CRM lists a wholesaler with company',
      (await page.locator('#wholesalerRows .r-name').count()) >= 1
      && /Marcus Vale/.test(await page.textContent('#wholesalerRows')));
    check('wholesaler CRM shows the spread they made off us',
      /\$12,000/.test(await page.textContent('#wholesalerRows')));
    check('wholesaler CRM summary totals the spread paid',
      /total spread/i.test(await page.textContent('#wholesalerSummary')));

    // ---------- Closed deals CSV (sorted by month) ----------
    check('download-closed-by-month control present',
      await page.locator('#exportClosedCsv').isVisible());
    const closedDl = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.click('#exportClosedCsv');
    check('closed-by-month CSV downloads', !!(await closedDl));

    // ---------- Contract upload accepts PDF or JPEG ----------
    check('upload-contract control accepts PDF and JPEG',
      /pdf/i.test(await page.getAttribute('#contractFile', 'accept'))
      && /jpe?g/i.test(await page.getAttribute('#contractFile', 'accept')));
    check('upload-contract button notes PDF/JPEG',
      /jpe?g/i.test(await page.textContent('#contractBtn')));

    // Table shows only active-contract lots (no closed/declined/pending)
    const tbl = await page.textContent('#lotRows');
    check('table excludes closed lots', !tbl.includes('200 Harbor'));
    check('table excludes declined lots', !tbl.includes('987 Maple Drive'));
    check('table shows active lots', tbl.includes('321 Elm Court'));
    await page.selectOption('#fStatus', 'ctc');
    await page.waitForTimeout(200);
    check('status filter works', (await page.textContent('#lotRows')).includes('88 Sable'));
    await page.selectOption('#fStatus', 'all');
    await page.waitForTimeout(200);
    check('showing count renders', /Showing \d+-\d+ of \d+ lots/.test(await page.textContent('#showingCount')));
    check('target focuses on accepted contracts', (await page.textContent('.target')).includes('accepted contracts'));

    // ---------- New-lead actions: Send Offer / Email Response / Do Not Call ----------
    await page.waitForSelector('#newLeadsBlock .lead-row');
    check('lead row has Send Offer action',
      (await page.locator('#newLeadsBlock .lead-row').first().locator('button', { hasText: 'Send Offer' }).count()) >= 1);
    check('lead row has Do Not Call action',
      (await page.locator('#newLeadsBlock .lead-row').first().locator('button', { hasText: 'Do Not Call' }).count()) >= 1);
    check('website lead has an Email Response action',
      (await page.locator('#nlWebGroup .lead-row').first().locator('button', { hasText: 'Email Response' }).count()) >= 1);

    // ---------- Approval: generate an offer on a New Lead ----------
    await page.locator('#newLeadsBlock .lead-row').first().locator('button', { hasText: 'Send Offer' }).click();
    await page.waitForTimeout(500); // Wait for navigation
    await page.waitForSelector('#actionButtons button', { timeout: 15000 });
    check('approval screen loads lot', (await page.textContent('#pageTitle')).includes('Offer Approval:'));
    await page.locator('#actionButtons button', { hasText: 'Generate' }).click();
    check('premium Yes/No required before generating', await page.locator('#premiumError').isVisible());
    await page.check('input[name=hasPremium][value=no]');
    await page.selectOption('#utilityType', 'water-sewer');
    await page.fill('#offerAmount', '$30,000');
    await page.locator('#actionButtons button', { hasText: 'Generate' }).click();
    await page.waitForSelector('#message.success', { timeout: 8000 });
    check('offer generated with 14-day expiration', (await page.textContent('#message')).includes('Expires'));
    check('offer expiration date set on timeline', (await page.textContent('#tExpires')) !== '—');
    // Confirm-offer-sent starts the 3-day clock (not the moment the packet was built).
    check('confirm-offer-sent button present after generating',
      await page.locator('#actionButtons button', { hasText: 'Confirm Offer Sent' }).count() === 1);
    await page.locator('#actionButtons button', { hasText: 'Confirm Offer Sent' }).click();
    await page.waitForSelector('#message.success', { timeout: 8000 });
    check('confirming offer sent records the send + follow-up date',
      /marked sent/i.test(await page.textContent('#message')));
    check('confirm-sent button replaced by confirmation once sent',
      await page.locator('#actionButtons button', { hasText: 'Confirm Offer Sent' }).count() === 0);
    await page.fill('#offerAmount', '60000');
    check('over-stipend warning shows', await page.locator('#overWarn.show').isVisible());
    await page.click('#previewPacketBtn');
    check('cover letter preview shows expiration', (await page.textContent('#packetPreview')).includes('expires on'));
    // The printable packet's cover page carries the Adams Homes logo image.
    const packetHtml = await page.evaluate(() => buildPacketHtml());
    check('packet cover page embeds the Adams Homes logo',
      /class="cover-logo"/.test(packetHtml) && /adams-homes-logo\.png/.test(packetHtml));
    // Auto-filled Vacant Land Contract (VAC-14 + Adams Homes fixed terms)
    await page.click('#previewContractBtn');
    const contractText = await page.textContent('#packetPreview');
    check('filled contract populates Adams Homes buyer + escrow + broker terms',
      /Adams Homes of Northwest Florida/.test(contractText)
      && /Emmanuel, Sheppard & Condon/.test(contractText)
      && /N\. Duncan Hudnall/.test(contractText)
      && /Purchase Price:/.test(contractText)
      && /Due Diligence Period: 45 days/.test(contractText));
    await page.click('#previewPacketBtn');
    check('document upload control present', await page.locator('#docUpload').count() === 1);
    check('commission defaults to 0% off-market', (await page.inputValue('#commission')) === '0%');
    await page.selectOption('#listingType', 'listed');
    await page.waitForTimeout(100);
    check('commission defaults to 3% when listed', (await page.inputValue('#commission')) === '3%');
    // Wholesaler is a third deal type: reveals the wholesaler card + spread, $0 commission.
    await page.selectOption('#listingType', 'wholesaler');
    await page.waitForTimeout(100);
    check('wholesaler deal type reveals the Wholesaler card', await page.locator('#wholesalerCard').isVisible());
    check('wholesaler deal defaults commission to 0%', (await page.inputValue('#commission')) === '0%');
    await page.fill('#wsName', 'Marcus Vale');
    await page.fill('#wsPaid', '$12,000');
    await page.fill('#wsSold', '$24,000');
    check('wholesaler spread computes what they made off us',
      /\$12,000/.test(await page.textContent('#wsSpreadOut')));
    // Reset to listed so the following agent-card checks have their fields visible.
    await page.selectOption('#listingType', 'listed');
    await page.waitForTimeout(100);
    check('commission hint notes cash-to-close deduction', /cash to close/i.test(await page.textContent('#commissionHint')));
    // Listing-agent details save on their own (persist without regenerating).
    check('save agent details button present', await page.locator('#saveAgentBtn').count() === 1);
    // Listing agent gets a FL license # field + verify links for the contract lines.
    check('agent license field + verify links present',
      (await page.locator('#agentLicense').count()) === 1
      && (await page.locator('#lookupMfl').count()) === 1
      && (await page.locator('#lookupZillow').count()) === 1);
    await page.fill('#agentName', 'Sarah Lee');
    await page.waitForTimeout(50);
    check('myfloridalicense lookup targets the agent name',
      /LName=Lee/i.test(await page.getAttribute('#lookupMfl', 'href')));
    await page.fill('#agentLicense', 'BK3312099');
    await page.fill('#agentPhone', '(321) 555-7788');
    await page.fill('#agentEmail', 'agent@brokerage.com');
    await page.click('#saveAgentBtn');
    await page.waitForSelector('#agentSaved', { state: 'visible', timeout: 8000 });
    check('agent details save confirms', await page.locator('#agentSaved').isVisible());
    // Notes to Elizabeth save on their own (persist to the deal / CRM).
    check('notes-to-Elizabeth Save button present', await page.locator('#saveNotesBtn').count() === 1);
    await page.fill('#kevinNotes', 'Seller wants a fast close; flexible on date.');
    await page.click('#saveNotesBtn');
    await page.waitForSelector('#notesSaved', { state: 'visible', timeout: 8000 });
    check('notes save confirms', await page.locator('#notesSaved').isVisible());
    await page.selectOption('#listingType', 'off-market');
    await page.waitForTimeout(100);
    check('lot notes section present', await page.locator('#addNoteBtn').count() === 1);
    check('cover letter no longer says Kevin owns the deal', !(await page.textContent('#packetPreview')).includes('own your deal'));
    check('approval uses compact card grid', await page.locator('.grid').count() === 1);
    // add a lot note
    await page.fill('#lotNoteInput', 'Seller prefers a quick close.');
    await page.click('#addNoteBtn');
    await page.waitForTimeout(200);
    check('lot note saved to log', (await page.textContent('#lotNoteList')).includes('quick close'));

    // ---------- Approval: Elizabeth counter-signs (seller-first, EP last) ----------
    await page.goto(BASE + '/admin.html');
    await page.waitForSelector('#lotRows tr');
    await page.selectOption('#fStatus', 'pending-ep-sig');
    await page.waitForTimeout(200);
    // Data rows only — the table now has phase-title header rows too.
    check('pipeline table shows a phase title row', await page.locator('#lotRows tr.phase-row').count() >= 1);
    await page.locator('#lotRows tr:not(.phase-row)').first().click();
    await page.waitForSelector('#epSummary.show', { timeout: 10000 });
    check('EP sign-off summary shows for Elizabeth', await page.locator('#epSummary.show').isVisible());
    check('EP summary lists stipend + offer', (await page.textContent('#epSummary')).includes('Approved Lot Stipend'));
    await page.locator('#actionButtons button', { hasText: 'Sign' }).click();
    await page.waitForSelector('#message.success', { timeout: 8000 });
    check('EP signature computes Thursday closing', (await page.textContent('#message')).includes('closing'));
    check('official notification logged', (await page.textContent('#notifList')).toLowerCase().includes('official'));
    check('IP + closing dates set on timeline',
      (await page.textContent('#tIp')) !== '—' && (await page.textContent('#tActualClose')) !== '—');

    // ---------- Premium flagged "possible" must be finalized before signing ----------
    await page.evaluate(() => {
      const lots = JSON.parse(localStorage.getItem('landAcqSubmissions') || '[]');
      lots.push({ id: 555001, address: '5 Premium Test Ln, Palm Bay, FL 32907', status: 'pending-ep-sig',
        owner: 'Test Owner', offer: '$30,000', premiumPossible: true, premiumTBD: true,
        utilityType: 'water-sewer', createdAt: new Date().toISOString(), sellerReceivedAt: new Date().toISOString() });
      localStorage.setItem('landAcqSubmissions', JSON.stringify(lots));
    });
    await page.goto(BASE + '/offer-approval.html?id=555001');
    await page.waitForSelector('#epSummary.show', { timeout: 10000 });
    check('premium finalize row shows when amount is TBD', await page.locator('#premiumFinalizeRow').isVisible());
    await page.locator('#actionButtons button', { hasText: 'Sign' }).click();
    check('signing blocked until premium is entered',
      /premium amount before signing/i.test(await page.textContent('#message')));
    await page.fill('#premiumFinalizeAmt', '$2,500');
    await page.click('#premiumFinalizeBtn');
    await page.waitForSelector('#message.success', { timeout: 8000 });
    check('finalizing the premium clears the sign gate',
      /premium set to/i.test(await page.textContent('#message')) && !(await page.locator('#premiumFinalizeRow').isVisible()));

    // ---------- Regression: malicious lot renders as text, not markup ----------
    await page.goto(BASE + '/offer-approval.html?id=424242');
    await page.waitForSelector('#cOwnerContact', { timeout: 10000 });
    const xssFired = await page.evaluate(() => window.__xss === 1);
    const imgInjected = await page.locator('#cOwnerContact img, #cUtilities script').count();
    const rawShown = (await page.textContent('#cOwnerContact')).includes('<img');
    check('stored XSS neutralized on approval screen', !xssFired && imgInjected === 0 && rawShown);
    await page.goto(BASE + '/admin.html');
    await page.waitForSelector('#lotRows tr');

    // ---------- CSV export ----------
    const dl = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.click('#exportCsv');
    check('CSV export downloads', !!(await dl));

    const realErrors = consoleErrors.filter(t =>
      !t.includes('/api/land-acq') && !t.includes('Failed to load resource'));
    check('no console errors across flows (offline API fallback noise excluded)',
      realErrors.length === 0, realErrors.join('; '));
    await ctx.close();
  }

  await browser.close();

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length} checks, ${results.length - failed.length} passed, ${failed.length} failed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('SUITE CRASH:', e); process.exit(1); });
