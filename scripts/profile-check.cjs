/* Verifica la personalización: cambiar piel/pelo/dorsal actualiza al héroe
   del menú y el dorsal del pateador dentro del partido. */
const path = require('path');
const { chromium } = require('C:/Users/Public/cristobal/barberia/BarberIA/node_modules/playwright-core');

const OUT = path.join(__dirname, '..', '.smoke');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  // Elegir piel clara, pelo rubio y dorsal 23
  await page.click('[data-ref="skins"] .dot-swatch:first-child');
  await page.click('[data-ref="hairs"] .dot-swatch[data-value="#C9A227"]');
  await page.click('.chip-num[data-num="23"]');
  await page.waitForTimeout(300);

  const heroNumber = await page.$eval('.hero svg text', (t) => t.textContent.trim());
  const heroSkinOk = await page.$eval('.hero svg', (svg) => svg.innerHTML.includes('#F8D5B0'));
  await page.screenshot({ path: path.join(OUT, 'profile-menu.png') });

  // En el partido, el pateador debe llevar el dorsal 23
  await page.click('.btn-big');
  await page.waitForSelector('#scene.guide', { timeout: 20000 });
  const shooterNumber = await page.$eval('#shooter .sh-number', (t) => t.textContent.trim());
  await page.screenshot({ path: path.join(OUT, 'profile-match.png') });

  const ok = heroNumber === '23' && heroSkinOk && shooterNumber === '23';
  console.log(`héroe: dorsal ${heroNumber}, piel personalizada ${heroSkinOk}; pateador: dorsal ${shooterNumber}`);
  console.log(ok ? 'OK: personalizacion aplicada en menu y partido' : 'FALLO: personalizacion no aplicada');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
