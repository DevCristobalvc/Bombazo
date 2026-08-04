/* Duelo 1 vs 1 de CÓRNERS: el anfitrión elige la disciplina, ambos se
   conectan por WebRTC, el anfitrión remata de cabeza con timing y el
   invitado ataja. Verifica marcadores espejados. */
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

  const toClient = (page, sx, sy) =>
    page.evaluate(([x, y]) => {
      const svg = document.querySelector('#scene');
      const r = svg.getBoundingClientRect();
      const scale = Math.min(r.width / 360, r.height / 560);
      return [r.left + (r.width - 360 * scale) / 2 + x * scale, r.top + (r.height - 560 * scale) / 2 + y * scale];
    }, [sx, sy]);

  const dragKeeper = async (page, tx0, ty0) => {
    const [sx, sy] = await toClient(page, 180, 300);
    const [tx, ty] = await toClient(page, tx0, ty0);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) {
      await page.mouse.move(sx + ((tx - sx) * i) / 6, sy + ((ty - sy) * i) / 6);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
  };

  // Anfitrión: duelo con disciplina córners
  await host.goto(URL, { waitUntil: 'networkidle' });
  await host.click('[data-ref="modes"] [data-id="duelo"]');
  await host.click('[data-ref="duelModes"] [data-id="corners"]');
  await host.click('.btn-big');
  await host.waitForFunction(() => document.querySelector('.lobby-code')?.textContent.length >= 6, null, { timeout: 20000 });
  const code = (await host.textContent('.lobby-code')).trim().toLowerCase();
  console.log('sala corners:', code);

  await guest.goto(`${URL}#d=${code}`, { waitUntil: 'networkidle' });
  await guest.click('.join-screen .chips [data-id="esp"]', { force: true });
  await guest.click('.join-screen .btn-big');

  await host.waitForSelector('.match-screen.active', { timeout: 25000 });
  await guest.waitForSelector('.match-screen.active', { timeout: 25000 });
  const stage = (await host.textContent('.stage-chip')).trim();
  console.log('rotulo:', stage);

  // El invitado elige su vuelo mientras el centro del anfitrión viaja
  await guest.waitForSelector('#scene.aiming', { timeout: 20000 });
  await dragKeeper(guest, 260, 335);

  // Anfitrión: tocar a mitad del centro para el cabezazo
  await host.waitForSelector('#scene.crossing', { timeout: 20000 });
  await host.waitForTimeout(700);
  await host.mouse.click(195, 500);
  await host.waitForTimeout(3200);
  await host.screenshot({ path: path.join(OUT, 'duel-corners-host.png') });
  await guest.screenshot({ path: path.join(OUT, 'duel-corners-guest.png') });

  const boardOf = (page) =>
    page.$$eval('.sb-row', (rows) =>
      rows.map((r) => ({
        name: r.querySelector('.sb-name').textContent.trim(),
        dots: [...r.querySelectorAll('.dot')].map((d) => (d.classList.contains('goal') ? 'g' : d.classList.contains('fail') ? 'f' : '-')).join(''),
      }))
    );
  const hb = await boardOf(host);
  const gb = await boardOf(guest);
  console.log('host :', JSON.stringify(hb));
  console.log('guest:', JSON.stringify(gb));
  const attempted = hb[0].dots[0] !== '-';
  const mirrored = hb[0].dots === gb[1].dots && hb[1].dots === gb[0].dots;
  const ok = stage.includes('CÓRNERS') && attempted && mirrored;
  console.log(ok ? 'OK: duelo de corners sincronizado' : 'FALLO: revisar duelo de corners');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
