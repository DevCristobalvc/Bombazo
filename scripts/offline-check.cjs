/* Verifica que la PWA funcione sin red: carga la página (instala el SW),
   corta la red, recarga y comprueba que el juego siga renderizando. */
const { chromium } = require('C:/Users/Public/cristobal/barberia/BarberIA/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(800); // precache

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  const ok = await page.evaluate(() => !!document.querySelector('.menu-screen .logo svg'));
  await page.screenshot({ path: '.smoke/offline.png' });
  console.log(ok ? 'OK: el juego carga y renderiza sin conexion' : 'FALLO: no renderizo offline');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
