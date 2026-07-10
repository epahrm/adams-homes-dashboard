import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport:{ width:1000, height:1400 } });
await p.goto('file:///home/user/adams-homes-dashboard/docs/land-acq-pro/platform-guide.html', { waitUntil:'load' });
// Force every screenshot to load (they're lazy) and wait for decode before printing.
await p.evaluate(async () => {
  document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; });
  await Promise.all([...document.images].map(i => i.decode ? i.decode().catch(()=>{}) :
    (i.complete ? Promise.resolve() : new Promise(r => { i.onload = i.onerror = r; }))));
});
await p.emulateMedia({ media:'print', colorScheme:'light' });
await p.addStyleTag({ content:`
  @page{ size:Letter; margin:12mm; }
  .wrap{ max-width:100% !important; padding:0 18px !important; }
  .card-head, figure{ break-inside:avoid; page-break-inside:avoid; }
  .part{ break-after:avoid; page-break-after:avoid; }
  header.hero{ padding:40px 0 34px !important; }
  .cards{ gap:20px !important; }
  figure img{ max-height:4.4in; width:auto !important; max-width:100%; margin:0 auto; }
  figure{ display:flex; justify-content:center; }
`});
await p.waitForTimeout(400);
await p.pdf({ path:'demo-out/land-acq-pro-guide.pdf', format:'Letter', printBackground:true,
  margin:{ top:'12mm', bottom:'12mm', left:'12mm', right:'12mm' } });
await b.close();
console.log('pdf written');
