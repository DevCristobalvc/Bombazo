/* Verifica la estela del balón en vuelo y el mapa de calor del menú. */
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

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.click('.btn-big');
  await page.waitForSelector('#scene.guide', { timeout: 15000 });

  // remate y captura a mitad de vuelo para ver la estela
  const [bx, by] = await toClient(180, 462);
  const [tx, ty] = await toClient(95, 190);
  await page.mouse.move(bx, by);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(bx + ((tx - bx) * i) / 6, by + ((ty - by) * i) / 6);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(420); // patada (220ms) + mitad del vuelo
  await page.screenshot({ path: path.join(OUT, 'trail-mid-flight.png') });

  await page.waitForTimeout(1800);
  await page.click('.btn-exit');
  await page.waitForTimeout(400);
  const heatVisible = await page.$eval('[data-ref="heatrow"]', (el) => !el.hidden);
  await page.screenshot({ path: path.join(OUT, 'menu-heatmap.png') });
  console.log(heatVisible ? 'OK: mapa de calor visible tras el primer remate' : 'FALLO: mapa de calor oculto');
  await browser.close();
  process.exit(heatVisible ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
