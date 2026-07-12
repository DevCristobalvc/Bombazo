/* Prueba de duelo 1 vs 1 real: dos navegadores headless se conectan por
   WebRTC (señalización PeerJS), juegan el primer penal completo de ida y
   vuelta y se verifica que ambos marcadores coincidan. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/Public/cristobal/barberia/BarberIA/node_modules/playwright-core');

const OUT = path.join(__dirname, '..', '.smoke');
const URL = 'http://localhost:4173/';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const host = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const guest = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // Anfitrión: crea la sala
  await host.goto(URL, { waitUntil: 'networkidle' });
  await host.click('.chips [data-id="duelo"]');
  await host.click('.btn-big');
  await host.waitForFunction(() => document.querySelector('.lobby-code')?.textContent.length >= 6, null, { timeout: 20000 });
  const code = (await host.textContent('.lobby-code')).trim().toLowerCase();
  console.log('sala creada:', code);
  await host.screenshot({ path: path.join(OUT, 'duel-1-lobby.png') });

  // Invitado: entra por el enlace del QR y se une con España
  await guest.goto(`${URL}#d=${code}`, { waitUntil: 'networkidle' });
  await guest.screenshot({ path: path.join(OUT, 'duel-2-join.png') });
  await guest.click('.join-screen .chips [data-id="esp"]');
  await guest.click('.join-screen .btn-big');

  // Ambos deben entrar al partido (tras la presentación VS)
  await host.waitForSelector('.match-screen.active', { timeout: 25000 });
  await guest.waitForSelector('.match-screen.active', { timeout: 25000 });
  console.log('ambos en partido');

  const toClient = (page, sx, sy) =>
    page.evaluate(([x, y]) => {
      const svg = document.querySelector('#scene');
      const r = svg.getBoundingClientRect();
      const scale = Math.min(r.width / 360, r.height / 560);
      const ox = r.left + (r.width - 360 * scale) / 2;
      const oy = r.top + (r.height - 560 * scale) / 2;
      return [ox + x * scale, oy + y * scale];
    }, [sx, sy]);

  const swipeShot = async (page, targetX, targetY) => {
    const [bx, by] = await toClient(page, 180, 462);
    const [tx, ty] = await toClient(page, targetX, targetY);
    await page.mouse.move(bx, by);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) {
      await page.mouse.move(bx + ((tx - bx) * i) / 6, by + ((ty - by) * i) / 6);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
  };

  // Penal 1: el anfitrión remata con swipe (esquina alta izquierda),
  // el invitado ataja tocando la zona 8
  await host.waitForSelector('#scene.guide', { timeout: 15000 });
  await guest.waitForSelector('#scene.aiming', { timeout: 15000 });
  await guest.click('.zone[data-zone="8"]', { force: true });
  await swipeShot(host, 100, 195);
  await host.waitForTimeout(2500);
  await host.screenshot({ path: path.join(OUT, 'duel-3-host-shot.png') });
  await guest.screenshot({ path: path.join(OUT, 'duel-4-guest-save.png') });

  // Penal 2: el invitado remata, el anfitrión ataja
  await guest.waitForSelector('#scene.guide', { timeout: 15000 });
  await host.waitForSelector('#scene.aiming', { timeout: 15000 });
  await host.click('.zone[data-zone="4"]', { force: true });
  await swipeShot(guest, 180, 262);
  await guest.waitForTimeout(2500);

  // Los marcadores deben coincidir (espejados)
  const boardOf = (page) =>
    page.$$eval('.sb-row', (rows) =>
      rows.map((r) => ({
        name: r.querySelector('.sb-name').textContent.trim(),
        score: r.querySelector('.sb-score').textContent.trim(),
        dots: [...r.querySelectorAll('.dot')].map((d) => (d.classList.contains('goal') ? 'g' : d.classList.contains('fail') ? 'f' : '-')).join(''),
      }))
    );
  const hb = await boardOf(host);
  const gb = await boardOf(guest);
  console.log('host  :', JSON.stringify(hb));
  console.log('guest :', JSON.stringify(gb));

  const consistent =
    hb[0].name === gb[1].name && hb[1].name === gb[0].name &&
    hb[0].score === gb[1].score && hb[1].score === gb[0].score &&
    hb[0].dots === gb[1].dots && hb[1].dots === gb[0].dots;

  await host.screenshot({ path: path.join(OUT, 'duel-5-host-round2.png') });
  console.log(consistent ? 'OK: duelo sincronizado en ambos lados' : 'FALLO: marcadores inconsistentes');
  await browser.close();
  process.exit(consistent ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
