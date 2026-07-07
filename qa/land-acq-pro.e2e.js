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
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

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
    // Submitting with valid contact info saves the lead and shows confirmation.
    await page.fill('#ccPhone', '(321) 555-0100');
    await page.fill('#ccEmail', 'seller@example.com');
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
    await page.fill('#rfPhone', '(321) 555-0102');
    await page.fill('#rfEmail', 'jane@example.com');
    await page.click('#researchForm button[type=submit]');
    await page.waitForSelector('#researchMessage.success', { state: 'visible', timeout: 15000 });
    check('research request submits', true);

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

    // ---------- Offer Follow-Up Due (offer sent 3+ days, no movement) ----------
    check('offer follow-up block shows for a stale offer-sent lot',
      await page.locator('#offerFollowBlock').isVisible());
    check('offer follow-up shows a computed due date',
      /follow-up due/i.test(await page.textContent('#offerFollowList')));

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
    check('metrics: commission tracker removed', !(await page.textContent('.metrics')).includes('Commission'));
    check('scheduled-to-close metric populated', Number(await page.textContent('#mScheduled')) >= 1);
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

    // ---------- Approval: generate an offer on a New Lead ----------
    await page.waitForSelector('#newLeadsBlock .lead-row');
    await page.locator('#newLeadsBlock .lead-row').first().click();
    await page.waitForSelector('#actionButtons button', { timeout: 10000 });
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
    await page.fill('#offerAmount', '60000');
    check('over-stipend warning shows', await page.locator('#overWarn.show').isVisible());
    await page.click('#previewPacketBtn');
    check('cover letter preview shows expiration', (await page.textContent('#packetPreview')).includes('expires on'));
    check('document upload control present', await page.locator('#docUpload').count() === 1);
    check('commission defaults to 0% off-market', (await page.inputValue('#commission')) === '0%');
    await page.selectOption('#listingType', 'listed');
    await page.waitForTimeout(100);
    check('commission defaults to 3% when listed', (await page.inputValue('#commission')) === '3%');
    check('commission hint notes cash-to-close deduction', /cash to close/i.test(await page.textContent('#commissionHint')));
    // Listing-agent details save on their own (persist without regenerating).
    check('save agent details button present', await page.locator('#saveAgentBtn').count() === 1);
    await page.fill('#agentPhone', '(321) 555-7788');
    await page.fill('#agentEmail', 'agent@brokerage.com');
    await page.click('#saveAgentBtn');
    await page.waitForSelector('#agentSaved', { state: 'visible', timeout: 8000 });
    check('agent details save confirms', await page.locator('#agentSaved').isVisible());
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
    await page.locator('#lotRows tr').first().click();
    await page.waitForSelector('#epSummary.show', { timeout: 10000 });
    check('EP sign-off summary shows for Elizabeth', await page.locator('#epSummary.show').isVisible());
    check('EP summary lists stipend + offer', (await page.textContent('#epSummary')).includes('Approved Lot Stipend'));
    await page.locator('#actionButtons button', { hasText: 'Sign' }).click();
    await page.waitForSelector('#message.success', { timeout: 8000 });
    check('EP signature computes Thursday closing', (await page.textContent('#message')).includes('closing'));
    check('official notification logged', (await page.textContent('#notifList')).toLowerCase().includes('official'));
    check('IP + closing dates set on timeline',
      (await page.textContent('#tIp')) !== '—' && (await page.textContent('#tActualClose')) !== '—');

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
