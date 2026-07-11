/* Smoke test visual: abre el build con Edge headless, navega el flujo
   completo (menú → patear → atajar), verifica que NO exista scroll de
   página en varios viewports y guarda screenshots en .smoke/. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/Public/cristobal/barberia/BarberIA/node_modules/playwright-core');

const OUT = path.join(__dirname, '..', '.smoke');
const URL = 'http://localhost:4173/';

async function assertNoPageScroll(page, label, failures) {
  const metrics = await page.evaluate(() => ({
    docScroll: document.documentElement.scrollHeight,
    bodyScroll: document.body.scrollHeight,
    inner: window.innerHeight,
  }));
  const ok = metrics.docScroll <= metrics.inner + 1 && metrics.bodyScroll <= metrics.inner + 1;
  if (!ok) failures.push(`${label}: scrollHeight ${metrics.docScroll}/${metrics.bodyScroll} > viewport ${metrics.inner}`);
  return ok;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone-ish vertical
  const errors = [];
  const failures = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, '1-menu.png') });
  await assertNoPageScroll(page, 'menu 390x844', failures);

  // teléfono pequeño
  await page.setViewportSize({ width: 360, height: 640 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, '1b-menu-small.png') });
  await assertNoPageScroll(page, 'menu 360x640', failures);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);

  // cambiar de equipo para ver el héroe cambiar de camiseta
  await page.click('.chips [data-id="esp"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, '2-menu-espana.png') });
  await page.click('.chips [data-id="col"]');

  // jugar
  await page.click('.btn-big');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '3-partido-patear.png') });
  await assertNoPageScroll(page, 'partido 390x844', failures);

  // patear a la esquina superior izquierda: zona + barra de potencia
  await page.click('.zone[data-zone="0"]', { force: true });
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, '3b-powerbar.png') });
  await page.click('.powerbar', { force: true });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, '4-tiro-resultado.png') });
  await page.waitForTimeout(1600);

  // fase de atajar
  await page.screenshot({ path: path.join(OUT, '5-atajar.png') });
  await page.click('.zone[data-zone="8"]', { force: true });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, '6-atajada-resultado.png') });

  // menú en modo torneo
  await page.click('.btn-exit');
  await page.waitForTimeout(300);
  await page.click('.chips [data-id="torneo"]');
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, '8-menu-torneo.png') });
  await page.click('.btn-big');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '9-torneo-partido.png') });
  await assertNoPageScroll(page, 'torneo 390x844', failures);

  // partido en teléfono pequeño
  await page.setViewportSize({ width: 360, height: 640 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '6b-partido-small.png') });
  await assertNoPageScroll(page, 'partido 360x640', failures);

  // desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '7-desktop.png') });
  await assertNoPageScroll(page, 'desktop 1280x800', failures);

  await browser.close();

  if (errors.length) console.log(`ERRORES DE CONSOLA:\n${errors.join('\n')}`);
  if (failures.length) console.log(`SCROLL DETECTADO:\n${failures.join('\n')}`);
  if (!errors.length && !failures.length) console.log('OK: sin errores de consola y sin scroll de página');
  process.exit(errors.length || failures.length ? 1 : 0);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
