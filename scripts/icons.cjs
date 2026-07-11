/* Genera los PNG de marca (icons 192/512, apple-touch 180 y og.png 1200x630)
   renderizando SVG con Edge headless. Correr cuando cambie la identidad. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/Public/cristobal/barberia/BarberIA/node_modules/playwright-core');

const PUB = path.join(__dirname, '..', 'public');
const ICONS = path.join(PUB, 'icons');

const faviconSvg = fs.readFileSync(path.join(PUB, 'favicon.svg'), 'utf8');
// Variante full-bleed (sin esquinas redondeadas) para apple-touch y maskable
const squareSvg = faviconSvg.replace('rx="14"', 'rx="0"');

const iconPage = (svg) => `<!DOCTYPE html><body style="margin:0;display:grid;place-items:center;height:100vh">
  <div style="width:100vmin;height:100vmin">${svg.replace('<svg ', '<svg style="width:100%;height:100%" ')}</div>
</body>`;

const ogPage = `<!DOCTYPE html><html><head>
  <link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Nunito:wght@800&display=swap" rel="stylesheet">
</head><body style="margin:0;width:1200px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
  background:linear-gradient(180deg,#04081a 0%,#0d1f4d 60%,#0e3d1d 100%);font-family:'Luckiest Guy','Arial Black',sans-serif">
  <div style="display:flex;align-items:center;gap:34px">
    <div style="width:190px;height:190px">${squareSvg.replace('<svg ', '<svg style="width:100%;height:100%;border-radius:42px" ')}</div>
    <div style="font-size:150px;color:#ffd100;text-shadow:0 6px 0 #a97a00,0 14px 40px rgba(0,0,0,.6);letter-spacing:4px">BOMBAZO</div>
  </div>
  <div style="font-family:Nunito,sans-serif;font-weight:800;font-size:34px;color:#9fb0d8">Tanda de penales &middot; Mundial 2026 &middot; Patea, ataja y gana el torneo</div>
</body></html>`;

(async () => {
  fs.mkdirSync(ICONS, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  const shots = [
    { html: iconPage(faviconSvg), size: 512, out: path.join(ICONS, 'icon-512.png') },
    { html: iconPage(faviconSvg), size: 192, out: path.join(ICONS, 'icon-192.png') },
    { html: iconPage(squareSvg), size: 180, out: path.join(ICONS, 'apple-touch-icon.png') },
  ];
  for (const s of shots) {
    await page.setViewportSize({ width: s.size, height: s.size });
    await page.setContent(s.html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: s.out, omitBackground: true });
    console.log('OK', path.basename(s.out));
  }

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(ogPage, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400); // fuentes
  await page.screenshot({ path: path.join(PUB, 'og.png') });
  console.log('OK og.png');

  await browser.close();
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
