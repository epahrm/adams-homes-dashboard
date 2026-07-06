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
    check('search by name finds county record',
      await page.locator('#resultPanel').isVisible() &&
      (await page.textContent('#recOwner')).trim() === 'John Smith');
    await page.click('#confirmBtn');
    check('confirmation message shows',
      await page.locator('#confirmMsg').isVisible() &&
      (await page.textContent('#confirmMsg')).includes('Property verified'));

    // Duplicate handling
    await page.fill('#streetAddress', '123 Maple Avenue');
    await page.click('#searchAddressBtn');
    await page.click('#confirmBtn');
    check('duplicate submission blocked',
      await page.locator('#resultMessage.error').isVisible());

    // ---------- Seller flow: fallback ----------
    await page.fill('#streetAddress', '999 Nowhere Blvd, Palm Bay');
    await page.click('#searchAddressBtn');
    check('fallback form shows for unknown property', await page.locator('#fallbackPanel').isVisible());
    await page.click('#fallbackForm button[type=submit]');
    check('fallback validation fires', await page.locator('#fbOwnerNameError').isVisible());
    await page.fill('#fbOwnerName', 'Jane Doe');
    await page.fill('#fbPhone', '(321) 555-0102');
    await page.fill('#fbEmail', 'jane@example.com');
    await page.click('#fallbackForm button[type=submit]');
    check('fallback submits',
      await page.locator('#fallbackMessage.success').isVisible());

    // ---------- Data sync to admin ----------
    await page.goto(BASE + '/admin.html');
    await page.waitForSelector('#lotRows tr');
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

    // Validation: zero offer rejected
    await page.click('a[data-edit="offerAmount"]');
    await page.fill('#offerAmount', '$0');
    await page.click('#approveBtn');
    check('zero offer rejected', await page.locator('#message.error').isVisible());
    await page.fill('#offerAmount', offer);
    await page.click('#approveBtn');
    check('approve sends offer',
      await page.locator('#message.success').isVisible() &&
      (await page.textContent('#message')).includes('Offer sent to'));
    await page.waitForURL('**/admin.html', { timeout: 5000 });
    check('approve returns to dashboard + status updated',
      (await page.locator('#lotRows .pill').allTextContents()).includes('OFFER SENT'));

    // ---------- CSV export ----------
    const dl = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.click('#exportCsv');
    check('CSV export downloads', !!(await dl));

    check('no console errors across flows', consoleErrors.length === 0, consoleErrors.join('; '));
    await ctx.close();
  }

  await browser.close();

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length} checks, ${results.length - failed.length} passed, ${failed.length} failed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('SUITE CRASH:', e); process.exit(1); });
