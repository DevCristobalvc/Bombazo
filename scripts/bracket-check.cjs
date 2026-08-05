/* Juega una ronda de torneo completa contra la IA (fácil) y captura la
   pantalla final con la llave del torneo. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/Public/cristobal/barberia/BarberIA/node_modules/playwright-core');

const OUT = path.join(__dirname, '..', '.smoke');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
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

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.click('.chips [data-id="torneo"]');
  await page.click('[data-ref="diffs"] [data-id="facil"]');
  const facilOk = await page.$eval('[data-ref="diffs"] [data-id="facil"]', (el) => el.classList.contains('is-selected'));
  console.log('dificultad facil seleccionada:', facilOk);
  await page.click('.btn-big');

  for (let i = 0; i < 300; i++) {
    if (await page.$('.end-screen.active')) break;
    if (await page.$('#scene.guide')) {
      // remates variados a las esquinas (difícil de atajar en fácil)
      const corners = [[95, 190], [265, 190], [95, 335], [265, 335]];
      const [cx, cy] = corners[i % 4];
      await swipeShot(cx, cy);
    } else if (await page.$('#scene.aiming')) {
      const dz = [[100, 189], [180, 189], [260, 189], [100, 262], [180, 262], [260, 262], [100, 335], [180, 335], [260, 335]][Math.floor(Math.random() * 9)];
      await dragKeeper(dz[0], dz[1]).catch(() => {});
    }
    await page.waitForTimeout(350);
  }

  const ended = !!(await page.$('.end-screen.active'));
  await page.screenshot({ path: path.join(OUT, 'bracket-end.png') });
  console.log(ended ? 'OK: fin de ronda de torneo capturado' : 'FALLO: la ronda no terminó');
  await browser.close();
  process.exit(ended ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
