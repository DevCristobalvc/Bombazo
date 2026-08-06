/* Captura la guía de trayectoria a mitad de un gesto curvado y el arrastre del arquero. */
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
  await page.click('.mm-play');
  await page.waitForSelector('#scene.guide', { timeout: 20000 });

  // Gesto curvado a mitad de camino: la línea proyectada debe verse
  const [bx, by] = await toClient(180, 462);
  const [mx, my] = await toClient(135, 330); // punto medio desviado (curva)
  const [tx, ty] = await toClient(110, 210);
  await page.mouse.move(bx, by);
  await page.mouse.down();
  await page.mouse.move(mx, my, { steps: 4 });
  await page.mouse.move((mx + tx) / 2, (my + ty) / 2, { steps: 3 });
  const lineVisible = await page.$eval('#aim-line', (l) => Number(l.getAttribute('opacity')) > 0);
  await page.screenshot({ path: path.join(OUT, 'aimline-mid.png') });
  await page.mouse.move(tx, ty, { steps: 3 });
  await page.mouse.up();
  console.log('línea de trayectoria visible durante el gesto:', lineVisible);
  await page.waitForTimeout(2600);

  // Fase de atajar: arrastrar al arquero hasta la esquina
  await page.waitForSelector('#scene.aiming', { timeout: 20000 });
  const [dx0, dy0] = await toClient(180, 300);
  const [dx1, dy1] = await toClient(90, 200);
  await page.mouse.move(dx0, dy0);
  await page.mouse.down();
  await page.mouse.move(dx1, dy1, { steps: 5 });
  await page.waitForTimeout(250);
  const keeperMoved = await page.$eval('#keeper', (k) => k.style.transform.includes('translate') && !k.style.transform.startsWith('translate(0'));
  await page.screenshot({ path: path.join(OUT, 'keeper-drag.png') });
  await page.mouse.up();
  console.log('arquero deslizado con el arrastre:', keeperMoved);

  const ok = lineVisible && keeperMoved;
  console.log(ok ? 'OK: guia de trayectoria y arquero arrastrable' : 'FALLO');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
