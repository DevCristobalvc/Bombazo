/* Prueba del modo Tiros libres: tiro central sin curva → bloqueado por la
   barrera; tiro a la esquina alta → supera la barrera. Verifica marcador. */
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

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.click('.chips [data-id="libres"]');
  await page.click('.btn-big');

  // La barrera debe estar visible en la escena
  await page.waitForSelector('#scene.guide', { timeout: 20000 });
  const wallVisible = await page.$eval('#scene', (svg) => svg.classList.contains('with-wall'));
  console.log('barrera visible:', wallVisible);
  await page.screenshot({ path: path.join(OUT, 'libres-1-escena.png') });

  // Tiro 1: centro abajo, recto → la barrera lo tapa (dot rojo)
  await swipeShot(180, 335);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'libres-2-bloqueado.png') });
  const dotAfterBlock = await page.$eval('.sb-row:first-child .dot', (d) => d.className);
  console.log('primer intento:', dotAfterBlock.includes('fail') ? 'bloqueado (correcto)' : dotAfterBlock);

  // Defensa
  await page.waitForSelector('#scene.aiming', { timeout: 20000 });
  await page.click('.zone[data-zone="4"]', { force: true });
  await page.waitForTimeout(2800);

  // Tiro 2: esquina alta izquierda → pasa por encima de la barrera
  await page.waitForSelector('#scene.guide', { timeout: 20000 });
  await swipeShot(100, 190);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'libres-3-esquina.png') });

  const dots = await page.$$eval('.sb-row:first-child .dot', (ds) =>
    ds.map((d) => (d.classList.contains('goal') ? 'g' : d.classList.contains('fail') ? 'f' : '-')).join('')
  );
  console.log('mis intentos:', dots);
  const ok = wallVisible && dots[0] === 'f' && dots[1] !== '-';
  console.log(ok ? 'OK: tiros libres con barrera funcionan' : 'FALLO: revisar barrera');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
