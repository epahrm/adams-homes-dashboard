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
    check('index: Adams Homes logo present', await page.locator('.brand-block img').isVisible());
    const bodyText = await page.evaluate(() => document.body.innerText);
    check('index: no pricing on public page', !/\$\s?\d/.test(bodyText), bodyText.match(/\$\s?\d[^\s]*/)?.[0]);
    check('index: locked headline', bodyText.includes('No One Closes Faster Than Adams Homes'));
    check('index: locked subtitle', bodyText.includes('Get your instant offer. We do all the work. You sit back and relax.'));
    check('index: exactly 2 process steps', await page.locator('.step').count() === 2);
    check('index: Kevin card copy', bodyText.includes('Kevin owns your deal from start to finish'));
    check('index: trust badges', bodyText.includes('Licensed Builder'));

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
    await page.click('#confirmBtn');
    await page.waitForSelector('#confirmMsg', { state: 'visible', timeout: 15000 });
    check('confirmation message shows',
      (await page.textContent('#confirmMsg')).includes('Property verified'));

    // Duplicate handling
    await page.fill('#streetAddress', '123 Maple Avenue');
    await page.click('#searchAddressBtn');
    await page.waitForSelector('#resultPanel', { state: 'visible' });
    await page.click('#confirmBtn');
    await page.waitForSelector('#resultMessage.error', { state: 'visible', timeout: 15000 });
    check('duplicate submission blocked', true);

    // ---------- Seller flow: fallback ----------
    await page.fill('#streetAddress', '999 Nowhere Blvd, Palm Bay');
    await page.click('#searchAddressBtn');
    await page.waitForSelector('#fallbackPanel', { state: 'visible', timeout: 15000 });
    check('fallback form shows for unknown property', true);
    await page.click('#fallbackForm button[type=submit]');
    check('fallback validation fires', await page.locator('#fbOwnerNameError').isVisible());
    await page.fill('#fbOwnerName', 'Jane Doe');
    await page.fill('#fbPhone', '(321) 555-0102');
    await page.fill('#fbEmail', 'jane@example.com');
    await page.click('#fallbackForm button[type=submit]');
    await page.waitForSelector('#fallbackMessage.success', { state: 'visible', timeout: 15000 });
    check('fallback submits', true);

    // ---------- Regression: symbol-only search must not match a record (F1) ----------
    await page.goto(BASE + '/index.html');
    await page.fill('#ownerName', '!!##');
    await page.click('#searchNameBtn');
    await page.waitForSelector('#fallbackPanel', { state: 'visible', timeout: 15000 });
    check('symbol-only search falls back instead of matching a record',
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
    await page.fill('#gatePassword', 'AdamsHomes2026!');
    await page.click('#gateForm button');
    await page.waitForSelector('#lotRows tr');
    check('admin: offline demo banner shows when server unreachable',
      await page.locator('#modeBanner').isVisible());

    // ---------- Data sync to admin ----------
    const tableText = await page.textContent('#lotRows');
    check('seller submissions reach dashboard',
      tableText.includes('123 Maple Avenue') && tableText.includes('999 Nowhere Blvd'));

    // ---------- Kevin flow: KPIs, filters, pagination ----------
    const outreach = Number(await page.textContent('#kpiOutreach'));
    check('outreach KPI populated', outreach > 0, String(outreach));
    await page.selectOption('#fStatus', 'declined');
    await page.waitForTimeout(200);
    check('declined filter works', (await page.textContent('#lotRows')).includes('987 Maple Drive'));
    await page.selectOption('#fStatus', 'all');
    await page.waitForTimeout(200);
    check('showing count renders', /Showing \d+-\d+ of \d+ lots/.test(await page.textContent('#showingCount')));

    // ---------- Kevin flow: approval ----------
    await page.locator('#lotRows tr').first().click();
    await page.waitForSelector('#approveBtn');
    check('approval screen loads lot', (await page.textContent('#pageTitle')).includes('Offer Approval:'));
    const offer = await page.inputValue('#offerAmount');
    check('offer default populated', /\$[\d,]+/.test(offer), offer);

    // Validation: zero and negative offers rejected (F2)
    await page.click('a[data-edit="offerAmount"]');
    await page.fill('#offerAmount', '$0');
    await page.click('#approveBtn');
    check('zero offer rejected', await page.locator('#message.error').isVisible());
    await page.fill('#offerAmount', '-5000');
    await page.click('#approveBtn');
    check('negative offer rejected', await page.locator('#message.error').isVisible());
    await page.fill('#offerAmount', offer);
    await page.click('#approveBtn');
    check('approve sends offer',
      await page.locator('#message.success').isVisible() &&
      (await page.textContent('#message')).includes('Offer sent to'));
    await page.waitForURL('**/admin.html', { timeout: 5000 });
    check('approve returns to dashboard + status updated',
      (await page.locator('#lotRows .pill').allTextContents()).includes('OFFER SENT'));

    // ---------- Regression: malicious lot renders as text, not markup ----------
    await page.goto(BASE + '/offer-approval.html?id=424242');
    await page.waitForSelector('#approveBtn');
    const xssFired = await page.evaluate(() => window.__xss === 1);
    const imgInjected = await page.locator('#cOwnerContact img, #cUtilities script, #cTax b').count();
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
