/**
 * Componente Pitch: la escena jugable.
 * API imperativa para que MatchScreen orqueste cada penal:
 * - captureSwipe(): gesto de remate con física (promesa → shot o null).
 * - pickZone(): toque en la grilla para atajar (promesa → zona o null).
 * - ballFlight(shot): vuelo del balón siguiendo core/physics.
 * - keeperDive, kickAnim, celebrate, shake, flash, reset.
 */
import { sceneSVG } from '../art/stadium.js';
import { zoneCenter, BALL_HOME, KEEPER_HOME } from '../core/zones.js';
import { analyzeSwipe, projectTarget, shotPath } from '../core/physics.js';
import { fromHTML, sleep } from '../utils/dom.js';
import './Pitch.css';

export function createPitch() {
  const el = fromHTML(`<div class="pitch">${sceneSVG()}</div>`);
  const svg = el.querySelector('#scene');
  const keeper = el.querySelector('#keeper');
  const ball = el.querySelector('#ball');
  const aimDot = el.querySelector('#aim-dot');

  let resolveZone = null;
  let cancelSwipe = null;

  /* ---------- Atajar: grilla de 9 zonas ---------- */

  svg.querySelector('#zones').addEventListener('click', (event) => {
    const rect = event.target.closest('.zone');
    if (!rect || !resolveZone) return;
    rect.classList.add('picked');
    svg.classList.remove('aiming');
    const resolve = resolveZone;
    resolveZone = null;
    resolve(Number(rect.dataset.zone));
  });

  function pickZone() {
    return new Promise((resolve) => {
      svg.classList.add('aiming');
      resolveZone = resolve;
    });
  }

  /* ---------- Patear: gesto de swipe con física ---------- */

  /** Convierte coordenadas de pantalla a coordenadas de escena (viewBox 360×560,
      centrado con letterbox por preserveAspectRatio). */
  function scenePoint(e) {
    const r = svg.getBoundingClientRect();
    const scale = Math.min(r.width / 360, r.height / 560);
    const ox = r.left + (r.width - 360 * scale) / 2;
    const oy = r.top + (r.height - 560 * scale) / 2;
    return { x: (e.clientX - ox) / scale, y: (e.clientY - oy) / scale, t: performance.now() };
  }

  function showAimDot(p) {
    aimDot.setAttribute('cx', p.tx);
    aimDot.setAttribute('cy', p.ty);
    aimDot.setAttribute('opacity', '0.9');
  }

  const hideAimDot = () => aimDot.setAttribute('opacity', '0');

  function captureSwipe() {
    return new Promise((resolve) => {
      svg.classList.add('guide');
      let pts = null;

      const down = (e) => {
        pts = [scenePoint(e)];
        try {
          svg.setPointerCapture(e.pointerId);
        } catch { /* sin captura: igual funciona */ }
      };
      const move = (e) => {
        if (!pts) return;
        const p = scenePoint(e);
        pts.push(p);
        showAimDot(projectTarget(pts[0], p));
      };
      const up = () => {
        if (!pts) return;
        const shot = analyzeSwipe(pts);
        pts = null;
        hideAimDot();
        if (!shot) return; // gesto inválido: sigue esperando el remate
        finish(shot);
      };

      const finish = (value) => {
        svg.removeEventListener('pointerdown', down);
        svg.removeEventListener('pointermove', move);
        svg.removeEventListener('pointerup', up);
        svg.removeEventListener('pointercancel', up);
        svg.classList.remove('guide');
        hideAimDot();
        cancelSwipe = null;
        resolve(value);
      };

      cancelSwipe = () => finish(null);
      svg.addEventListener('pointerdown', down);
      svg.addEventListener('pointermove', move);
      svg.addEventListener('pointerup', up);
      svg.addEventListener('pointercancel', up);
    });
  }

  /** Cancela cualquier interacción pendiente (salida del partido). */
  function cancelAim() {
    svg.classList.remove('aiming');
    if (resolveZone) {
      const resolve = resolveZone;
      resolveZone = null;
      resolve(null);
    }
    if (cancelSwipe) cancelSwipe();
    if (cancelCross) cancelCross();
  }

  /* ---------- Vestuario y animaciones ---------- */

  function setKits({ shooterTeam, keeperTeam, shooterProfile = null }) {
    const s = el.style;
    // Personalización del pateador (piel, pelo, dorsal) cuando aplica
    const shSkin = shooterProfile?.skin ?? shooterTeam.skin;
    const shHair = shooterProfile?.hair ?? shooterTeam.hair;
    const numberEl = svg.querySelector('#shooter .sh-number');
    if (numberEl) numberEl.textContent = shooterProfile?.number ?? 10;
    // La barrera defiende: viste el uniforme de campo del equipo del arquero
    s.setProperty('--wl-shirt', keeperTeam.kit.shirt);
    s.setProperty('--wl-shorts', keeperTeam.kit.shorts);
    s.setProperty('--wl-socks', keeperTeam.kit.socks);
    s.setProperty('--wl-skin', keeperTeam.skin);
    s.setProperty('--wl-hair', keeperTeam.hair);
    s.setProperty('--sh-shirt', shooterTeam.kit.shirt);
    s.setProperty('--sh-accent', shooterTeam.kit.accent);
    s.setProperty('--sh-shorts', shooterTeam.kit.shorts);
    s.setProperty('--sh-socks', shooterTeam.kit.socks);
    s.setProperty('--sh-skin', shSkin);
    s.setProperty('--sh-hair', shHair);
    s.setProperty('--gk-shirt', keeperTeam.gk.shirt);
    s.setProperty('--gk-accent', keeperTeam.gk.accent);
    s.setProperty('--gk-skin', keeperTeam.skin);
    s.setProperty('--gk-hair', keeperTeam.hair);
  }

  function keeperDive(zone) {
    svg.classList.add('diving'); // pausa el balanceo de espera
    const c = zoneCenter(zone);
    const col = zone % 3;
    const row = Math.floor(zone / 3);
    const dx = (c.x - KEEPER_HOME.x) * 0.92;
    const dy = row === 0 ? -66 : row === 1 ? -30 : -2;
    const angle = col === 0 ? -55 : col === 2 ? 55 : 0;
    keeper.style.transform = `translate(${dx}px, ${dy}px) rotate(${angle}deg)`;
  }

  /** Estela de cometa que deja el balón en vuelo. */
  const ballAnchor = ball.parentElement;
  function spawnTrail(x, y, scale) {
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', x.toFixed(1));
    dot.setAttribute('cy', y.toFixed(1));
    dot.setAttribute('r', (5 * scale).toFixed(1));
    dot.setAttribute('class', 'trail');
    svg.insertBefore(dot, ballAnchor);
    setTimeout(() => dot.remove(), 300);
  }

  /** Vuelo físico del balón (requestAnimationFrame sobre core/physics).
      `from` permite rematar desde donde esté el balón (cabezazos de córner). */
  function ballFlight(shot, from) {
    const path = shotPath(shot, from);
    ball.style.transition = 'none';
    return new Promise((resolve) => {
      const t0 = performance.now();
      let frame = 0;
      const step = (now) => {
        const u = Math.min(1, (now - t0) / shot.dur);
        const p = path(u);
        const s = 1 - 0.38 * u;
        ball.style.transform = `translate(${(p.x - BALL_HOME.x).toFixed(1)}px, ${(p.y - BALL_HOME.y).toFixed(1)}px) scale(${s.toFixed(3)})`;
        if (frame % 2 === 0 && u > 0.05 && u < 0.95) spawnTrail(p.x, p.y, s);
        frame += 1;
        if (u < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  /** Muestra u oculta la barrera (modo tiros libres). */
  function setWall(visible) {
    svg.classList.toggle('with-wall', visible);
  }

  /** Rebote del balón al estrellarse contra la barrera. */
  function ballDeflect() {
    ball.style.transition = '';
    requestAnimationFrame(() => {
      ball.style.transform = `translate(${(Math.random() * 70 - 35).toFixed(0)}px, -6px) scale(1)`;
    });
  }

  let cancelCross = null;

  /**
   * Centro de córner: anima el balón por su comba y espera el toque del
   * jugador. Resuelve { x, y, u } (posición del balón al tocar) o null si
   * el centro pasó de largo sin remate.
   */
  function cornerCross({ path, dur }, { interactive = true, stopAt = 1 } = {}) {
    ball.style.transition = 'none';
    svg.classList.add('crossing');
    return new Promise((resolve) => {
      let tappedU = null;
      const onTap = () => {
        tappedU = -1; // marca: resolver en el próximo frame con la posición actual
      };
      const cleanup = () => {
        svg.classList.remove('crossing');
        svg.removeEventListener('pointerdown', onTap);
        cancelCross = null;
      };
      cancelCross = () => {
        cleanup();
        resolve(null);
      };
      if (interactive) svg.addEventListener('pointerdown', onTap);

      const t0 = performance.now();
      let frame = 0;
      const step = (now) => {
        if (!cancelCross) return; // cancelado
        const u = Math.min(stopAt, (now - t0) / dur);
        const p = path(u);
        ball.style.transform = `translate(${(p.x - BALL_HOME.x).toFixed(1)}px, ${(p.y - BALL_HOME.y).toFixed(1)}px) scale(.92)`;
        if (frame % 3 === 0) spawnTrail(p.x, p.y, 0.7);
        frame += 1;
        if (tappedU !== null) {
          cleanup();
          resolve({ x: p.x, y: p.y, u });
          return;
        }
        if (u < stopAt) requestAnimationFrame(step);
        else {
          cleanup();
          resolve(interactive ? null : { x: p.x, y: p.y, u });
        }
      };
      requestAnimationFrame(step);
    });
  }

  /** La red ondea cuando el balón la sacude. */
  function netRipple() {
    svg.classList.remove('ripple');
    void svg.getBoundingClientRect();
    svg.classList.add('ripple');
    setTimeout(() => svg.classList.remove('ripple'), 450);
  }

  /** Rebote tras la atajada (vuelve a transición CSS). */
  function ballBounce(zone) {
    const c = zoneCenter(zone);
    ball.style.transition = '';
    requestAnimationFrame(() => {
      ball.style.transform = `translate(${(c.x - BALL_HOME.x) * 0.55}px, -46px) scale(.85)`;
    });
  }

  async function kickAnim() {
    svg.classList.add('kick');
    await sleep(220);
  }

  /** La tribuna salta un instante (goles propios, atajadas heroicas). */
  function celebrate() {
    svg.classList.add('celebrate');
    setTimeout(() => svg.classList.remove('celebrate'), 1100);
  }

  /** Sacudida de impacto en la escena. */
  function shake() {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 450);
  }

  /** Destello blanco de gol propio. */
  function flash() {
    el.classList.remove('flash-on');
    void el.offsetWidth;
    el.classList.add('flash-on');
    setTimeout(() => el.classList.remove('flash-on'), 380);
  }

  function reset() {
    svg.classList.remove('kick', 'diving');
    keeper.style.transform = '';
    ball.style.transition = '';
    ball.style.transform = '';
    svg.querySelectorAll('.zone.picked').forEach((r) => r.classList.remove('picked'));
  }

  return { el, setKits, setWall, pickZone, captureSwipe, cornerCross, cancelAim, keeperDive, ballFlight, ballBounce, ballDeflect, kickAnim, celebrate, shake, flash, netRipple, reset };
}
