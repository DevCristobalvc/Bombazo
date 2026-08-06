/* Verifica la personalización: cambiar piel/pelo/dorsal actualiza al héroe
   del menú y el dorsal del pateador dentro del partido. */
const path = require('path');
const { chromium } = require('C:/Users/Public/cristobal/barberia/BarberIA/node_modules/playwright-core');

const OUT = path.join(__dirname, '..', '.smoke');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  // Abrir el menú "Más" y el desplegable de personalización
  await page.click('[data-ref="moreBtn"]');
  await page.evaluate(() => { const d = document.querySelector('.mm-details'); if (d) d.open = true; });
  await page.waitForTimeout(150);
  // Elegir piel clara, pelo rubio, afro, dorsal 23 y nombre
  await page.click('[data-ref="skins"] .dot-swatch:first-child');
  await page.click('[data-ref="hairs"] .dot-swatch[data-value="#C9A227"]');
  await page.click('[data-style="afro"]', { force: true });
  await page.click('.chip-num[data-num="23"]', { force: true });
  await page.fill('[data-ref="name"]', 'CRISTOBAL');
  await page.waitForTimeout(300);

  const heroNumber = await page.$eval('.mm-avatar svg text', (t) => t.textContent.trim());
  const heroSkinOk = await page.$eval('.mm-avatar svg', (svg) => svg.innerHTML.includes('#F8D5B0'));
  await page.screenshot({ path: path.join(OUT, 'profile-menu.png') });

  // En el partido: dorsal 23, nombre en la espalda y peinado afro
  await page.click('[data-ref="moreClose"]');
  await page.click('.mm-play');
  await page.waitForSelector('#scene.guide', { timeout: 20000 });
  const shooterNumber = await page.$eval('#shooter .sh-number', (t) => t.textContent.trim());
  const shooterName = await page.$eval('#shooter .sh-name', (t) => t.textContent.trim());
  const styleOk = await page.$eval('#scene', (svg) => svg.dataset.shStyle === 'afro');
  await page.screenshot({ path: path.join(OUT, 'profile-match.png') });

  const ok = heroNumber === '23' && heroSkinOk && shooterNumber === '23' && shooterName === 'CRISTOBAL' && styleOk;
  console.log(`héroe: dorsal ${heroNumber}, piel ok ${heroSkinOk}; pateador: dorsal ${shooterNumber}, nombre "${shooterName}", afro ${styleOk}`);
  console.log(ok ? 'OK: personalizacion aplicada en menu y partido' : 'FALLO: personalizacion no aplicada');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
