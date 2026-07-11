/* Smoke test visual: abre el build con Edge headless, navega el flujo
   completo (menú → patear → atajar) y guarda screenshots en .smoke/. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/Public/cristobal/barberia/BarberIA/node_modules/playwright-core');

const OUT = path.join(__dirname, '..', '.smoke');
const URL = 'http://localhost:4173/';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone-ish vertical
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, '1-menu.png') });

  // cambiar de equipo para ver el héroe cambiar de camiseta
  await page.click('.chips [data-id="esp"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, '2-menu-espana.png') });
  await page.click('.chips [data-id="col"]');

  // jugar
  await page.click('.btn-big');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '3-partido-patear.png') });

  // patear a la esquina superior izquierda
  await page.click('.zone[data-zone="0"]', { force: true });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, '4-tiro-resultado.png') });
  await page.waitForTimeout(1600);

  // fase de atajar
  await page.screenshot({ path: path.join(OUT, '5-atajar.png') });
  await page.click('.zone[data-zone="8"]', { force: true });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, '6-atajada-resultado.png') });

  // desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '7-desktop.png') });

  await browser.close();
  console.log(errors.length ? `ERRORES DE CONSOLA:\n${errors.join('\n')}` : 'OK: sin errores de consola');
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
