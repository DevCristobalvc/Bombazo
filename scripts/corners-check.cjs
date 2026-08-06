/* Prueba del modo Córners: remate de cabeza con timing (tap a mitad del
   centro) y defensa del córner rival. Verifica que el marcador avance. */
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
  await page.selectOption('[data-ref="modeSel"]', 'corners');
  await page.screenshot({ path: path.join(OUT, 'corners-1-menu.png') });
  await page.click('.mm-play');

  // Ataque: esperar el centro y tocar cuando el balón va por la mitad
  await page.waitForSelector('#scene.crossing', { timeout: 20000 });
  await page.waitForTimeout(700); // el balón viaja hacia el centro del área
  await page.screenshot({ path: path.join(OUT, 'corners-2-cross.png') });
  await page.mouse.click(195, 500);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'corners-3-header.png') });

  // Defensa: atajar el cabezazo rival
  await page.waitForSelector('#scene.aiming', { timeout: 20000 });
  await dragKeeper(180, 262);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: path.join(OUT, 'corners-4-defensa.png') });

  // El marcador debe registrar un intento por lado
  const dots = await page.$$eval('.sb-row', (rows) =>
    rows.map((r) => [...r.querySelectorAll('.dot')].filter((d) => d.classList.contains('goal') || d.classList.contains('fail')).length)
  );
  const ok = dots[0] >= 1 && dots[1] >= 1;
  console.log('intentos registrados (yo, rival):', dots.join(', '));
  console.log(ok ? 'OK: modo corners jugable de ida y vuelta' : 'FALLO: el marcador no avanzo');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
