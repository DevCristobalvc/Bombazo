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
  }

  /* ---------- Vestuario y animaciones ---------- */

  function setKits({ shooterTeam, keeperTeam }) {
    const s = el.style;
    s.setProperty('--sh-shirt', shooterTeam.kit.shirt);
    s.setProperty('--sh-accent', shooterTeam.kit.accent);
    s.setProperty('--sh-shorts', shooterTeam.kit.shorts);
    s.setProperty('--sh-socks', shooterTeam.kit.socks);
    s.setProperty('--sh-skin', shooterTeam.skin);
    s.setProperty('--sh-hair', shooterTeam.hair);
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

  /** Vuelo físico del balón (requestAnimationFrame sobre core/physics). */
  function ballFlight(shot) {
    const path = shotPath(shot);
    ball.style.transition = 'none';
    return new Promise((resolve) => {
      const t0 = performance.now();
      const step = (now) => {
        const u = Math.min(1, (now - t0) / shot.dur);
        const p = path(u);
        const s = 1 - 0.38 * u;
        ball.style.transform = `translate(${(p.x - BALL_HOME.x).toFixed(1)}px, ${(p.y - BALL_HOME.y).toFixed(1)}px) scale(${s.toFixed(3)})`;
        if (u < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
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

  return { el, setKits, pickZone, captureSwipe, cancelAim, keeperDive, ballFlight, ballBounce, kickAnim, celebrate, shake, flash, reset };
}
