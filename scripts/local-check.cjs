/* Modo 2 jugadores (hot-seat): P1 remata, pantalla de "pásale el teléfono",
   P2 ataja a ciegas, y luego el turno inverso. Verifica el marcador. */
const path = require('path');
const { chromium } = require('C:/Users/Public/cristobal/barberia/BarberIA/node_modules/playwright-core');

const OUT = path.join(__dirname, '..', '.smoke');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const toClient = (sx, sy) =>
    page.evaluate(([x, y]) => {
      const svg = document.querySelector('#scene');
      const r = svg.getBoundingClientRect();
      const scale = Math.min(r.width / 360, r.height / 560);
      return [r.left + (r.width - 360 * scale) / 2 + x * scale, r.top + (r.height - 560 * scale) / 2 + y * scale];
    }, [sx, sy]);

  const swipeShot = async (tx0, ty0) => {
    const [bx, by] = await toClient(180, 462);
    const [tx, ty] = await toClient(tx0, ty0);
    await page.mouse.move(bx, by);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) {
      await page.mouse.move(bx + ((tx - bx) * i) / 6, by + ((ty - by) * i) / 6);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
  };

  const dragKeeper = async (tx0, ty0) => {
    const [sx, sy] = await toClient(180, 300);
    const [tx, ty] = await toClient(tx0, ty0);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) {
      await page.mouse.move(sx + ((tx - sx) * i) / 6, sy + ((ty - sy) * i) / 6);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
  };

  const tapHandoff = async () => {
    await page.waitForSelector('.handoff:not([hidden])', { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.click('.handoff', { force: true });
  };

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.click('[data-ref="modes"] [data-id="local"]');
  await page.click('.btn-big');

  // P1 (COL) remata a la esquina alta izquierda
  await page.waitForSelector('#scene.guide', { timeout: 20000 });
  await swipeShot(100, 195);
  await page.screenshot({ path: path.join(OUT, 'local-1-handoff.png') });
  await tapHandoff(); // pásale el teléfono al arquero
  await page.waitForSelector('#scene.aiming', { timeout: 15000 });
  await dragKeeper(260, 335);
  await page.waitForTimeout(2600);

  // Turno de P2 (FRA): handoff → remate → handoff → P1 ataja
  await tapHandoff(); // pásale el teléfono al pateador
  await page.waitForSelector('#scene.guide', { timeout: 15000 });
  await swipeShot(260, 335);
  await tapHandoff();
  await page.waitForSelector('#scene.aiming', { timeout: 15000 });
  await dragKeeper(180, 262);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: path.join(OUT, 'local-2-round.png') });

  const dots = await page.$$eval('.sb-row', (rows) =>
    rows.map((r) => [...r.querySelectorAll('.dot')].filter((d) => d.classList.contains('goal') || d.classList.contains('fail')).length)
  );
  const ok = dots[0] >= 1 && dots[1] >= 1;
  console.log('intentos (P1, P2):', dots.join(', '));
  console.log(ok ? 'OK: modo 2 jugadores completo ida y vuelta' : 'FALLO: marcador no avanzo');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
