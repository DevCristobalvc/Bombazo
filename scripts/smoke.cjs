/* Smoke test visual: abre el build con Edge headless, navega el flujo
   completo (menú → patear → atajar), verifica que NO exista scroll de
   página en varios viewports y guarda screenshots en .smoke/. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/Public/cristobal/barberia/BarberIA/node_modules/playwright-core');

const OUT = path.join(__dirname, '..', '.smoke');
const URL = 'http://localhost:4173/';

/** Convierte coordenadas de escena (viewBox 360×560) a coordenadas de cliente. */
async function toClient(page, sx, sy) {
  return page.evaluate(([x, y]) => {
    const svg = document.querySelector('#scene');
    const r = svg.getBoundingClientRect();
    const scale = Math.min(r.width / 360, r.height / 560);
    const ox = r.left + (r.width - 360 * scale) / 2;
    const oy = r.top + (r.height - 560 * scale) / 2;
    return [ox + x * scale, oy + y * scale];
  }, [sx, sy]);
}

/** Simula el swipe de remate: del balón hacia un punto del arco. */
async function swipeShot(page, targetX, targetY) {
  const [bx, by] = await toClient(page, 180, 462);
  const [tx, ty] = await toClient(page, targetX, targetY);
  await page.mouse.move(bx, by);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(bx + ((tx - bx) * i) / 6, by + ((ty - by) * i) / 6);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
}

/** Simula la atajada: arrastra al arquero desde su casa hasta un punto del arco. */
async function dragKeeper(page, targetX, targetY) {
  const [sx, sy] = await toClient(page, 180, 300);
  const [tx, ty] = await toClient(page, targetX, targetY);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(sx + ((tx - sx) * i) / 6, sy + ((ty - sy) * i) / 6);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
}

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

  // PWA: el service worker debe registrarse y quedar activo
  const swActive = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'sin soporte';
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    return reg?.active ? 'activo' : 'no activo';
  });
  if (swActive !== 'activo') failures.push(`service worker: ${swActive}`);

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

  // jugar: primero la presentación VS, luego la fase de remate por swipe
  await page.click('.btn-big');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '3-vs-splash.png') });
  await page.waitForSelector('#scene.guide', { timeout: 15000 });
  await page.screenshot({ path: path.join(OUT, '3a-partido-patear.png') });
  await assertNoPageScroll(page, 'partido 390x844', failures);

  // remate físico: swipe del balón a la esquina superior izquierda
  await swipeShot(page, 100, 195);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, '4-tiro-resultado.png') });

  // fase de atajar: arrastre continuo del arquero a un punto del arco
  await page.waitForSelector('#scene.aiming', { timeout: 15000 });
  await page.screenshot({ path: path.join(OUT, '5-atajar.png') });
  await dragKeeper(page, 250, 320);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, '6-atajada-resultado.png') });

  // menú en modo torneo
  await page.click('.btn-exit');
  await page.waitForTimeout(300);
  await page.click('.chips [data-id="torneo"]');
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, '8-menu-torneo.png') });
  await page.click('.btn-big');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '9-torneo-vs.png') });
  await page.waitForSelector('#scene.guide', { timeout: 15000 });
  await page.screenshot({ path: path.join(OUT, '9a-torneo-partido.png') });
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
