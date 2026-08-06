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
  await host.selectOption('[data-ref="modeSel"]', 'duelo');
  await host.click('.mm-play');
  await host.waitForFunction(() => document.querySelector('.lobby-code')?.textContent.length >= 6, null, { timeout: 20000 });
  const code = (await host.textContent('.lobby-code')).trim().toLowerCase();
  console.log('sala creada:', code);
  await host.screenshot({ path: path.join(OUT, 'duel-1-lobby.png') });

  // Invitado: entra por el enlace del QR y se une con España
  await guest.goto(`${URL}#d=${code}`, { waitUntil: 'networkidle' });
  await guest.screenshot({ path: path.join(OUT, 'duel-2-join.png') });
  await guest.evaluate(() => document.querySelector('.join-screen .chips [data-id="esp"]')?.click());
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

  const dragKeeper = async (page, targetX, targetY) => {
    const [sx, sy] = await toClient(page, 180, 300);
    const [tx, ty] = await toClient(page, targetX, targetY);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) {
      await page.mouse.move(sx + ((tx - sx) * i) / 6, sy + ((ty - sy) * i) / 6);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
  };

  // Penal 1: el anfitrión remata con swipe (esquina alta izquierda),
  // el invitado ataja arrastrando su arquero a la esquina baja derecha
  await host.waitForSelector('#scene.guide', { timeout: 15000 });
  await guest.waitForSelector('#scene.aiming', { timeout: 15000 });
  await dragKeeper(guest, 260, 335);
  await swipeShot(host, 100, 195);
  await host.waitForTimeout(2500);
  await host.screenshot({ path: path.join(OUT, 'duel-3-host-shot.png') });
  await guest.screenshot({ path: path.join(OUT, 'duel-4-guest-save.png') });

  // Penal 2: el invitado remata, el anfitrión ataja
  await guest.waitForSelector('#scene.guide', { timeout: 15000 });
  await host.waitForSelector('#scene.aiming', { timeout: 15000 });
  await dragKeeper(host, 180, 262);
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

  // Jugar hasta el final de la tanda (acciones aleatorias en ambos lados)
  const act = async (page) => {
    if (await page.$('#scene.guide')) {
      await swipeShot(page, 80 + Math.random() * 200, 180 + Math.random() * 170);
      return;
    }
    if (await page.$('#scene.aiming')) {
      await dragKeeper(page, 80 + Math.random() * 200, 180 + Math.random() * 170).catch(() => {});
    }
  };
  let ended = false;
  for (let i = 0; i < 120; i++) {
    if ((await host.$('.end-screen.active')) && (await guest.$('.end-screen.active'))) {
      ended = true;
      break;
    }
    await act(host);
    await act(guest);
    await host.waitForTimeout(350);
  }
  console.log(ended ? 'OK: la tanda completa terminó en ambos lados' : 'FALLO: la tanda no terminó');
  await host.screenshot({ path: path.join(OUT, 'duel-6-final.png') });

  // Revancha sobre la misma conexión: ambos la piden y arranca otro partido
  let rematchOk = false;
  if (ended) {
    await host.click('[data-act="duel-rematch"]');
    await guest.click('[data-act="duel-rematch"]');
    rematchOk = await Promise.all([
      host.waitForSelector('.match-screen.active', { timeout: 15000 }).then(() => true),
      guest.waitForSelector('.match-screen.active', { timeout: 15000 }).then(() => true),
    ]).then(() => true).catch(() => false);
  }
  console.log(rematchOk ? 'OK: revancha iniciada en ambos lados' : 'FALLO: revancha no inició');

  await browser.close();
  process.exit(consistent && ended && rematchOk ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
