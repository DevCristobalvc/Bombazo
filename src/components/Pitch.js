/**
 * Componente Pitch: la escena jugable.
 * API imperativa para que MatchScreen orqueste cada penal:
 * - captureSwipe(): gesto de remate con física (promesa → shot o null).
 * - pickZone(): toque en la grilla para atajar (promesa → zona o null).
 * - ballFlight(shot): vuelo del balón siguiendo core/physics.
 * - keeperDive, kickAnim, celebrate, shake, flash, reset.
 */
import { sceneSVG } from '../art/stadium.js';
import { zoneCenter, BALL_HOME, KEEPER_HOME, clampToGoal } from '../core/zones.js';
import { analyzeSwipe, projectTarget, shotPath } from '../core/physics.js';
import { fromHTML, sleep } from '../utils/dom.js';
import './Pitch.css';

export function createPitch() {
  const el = fromHTML(`<div class="pitch">${sceneSVG()}</div>`);
  const svg = el.querySelector('#scene');
  const keeper = el.querySelector('#keeper');
  const ball = el.querySelector('#ball');
  const ballShadow = el.querySelector('#ball-shadow');
  if (ballShadow) {
    ballShadow.style.transformBox = 'fill-box';
    ballShadow.style.transformOrigin = 'center';
  }
  const aimDot = el.querySelector('#aim-dot');
  const aimLine = el.querySelector('#aim-line');

  let resolveDive = null;
  let cancelSwipe = null;

  /* ---------- Atajar: arrastre continuo del arquero ---------- */

  /** El arquero se desliza siguiendo el dedo hacia el punto {x,y}. */
  let keeperGlideX = 0;
  let keeperGlideY = 0;
  function keeperGlide(point) {
    keeperGlideX = (point.x - KEEPER_HOME.x) * 0.6;
    keeperGlideY = (point.y - KEEPER_HOME.y) * 0.2;
    keeper.style.transition = 'transform .1s ease-out';
    keeper.style.transform = `translate(${keeperGlideX.toFixed(1)}px, ${keeperGlideY.toFixed(1)}px)`;
    moveReticle(point);
  }

  /** Retícula que marca a dónde se lanzará el arquero. */
  const reticle = svg.querySelector('#dive-reticle');
  function moveReticle(point) {
    if (!reticle) return;
    reticle.setAttribute('transform', `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`);
    reticle.setAttribute('opacity', '0.95');
  }
  function hideReticle() {
    if (reticle) reticle.setAttribute('opacity', '0');
  }

  /**
   * Elección del vuelo al atajar (continua): arrastra al arquero a cualquier
   * punto del arco, o toca directo. Resuelve el punto {x,y} o null si se cancela.
   */
  function pickDive() {
    return new Promise((resolve) => {
      svg.classList.add('aiming');
      let dragging = false;
      let last = null;

      const finish = (point) => {
        svg.removeEventListener('pointerdown', down);
        svg.removeEventListener('pointermove', move);
        svg.removeEventListener('pointerup', up);
        svg.removeEventListener('pointercancel', up);
        svg.classList.remove('aiming');
        resolveDive = null;
        resolve(point);
      };
      resolveDive = () => { hideReticle(); finish(null); };

      const down = (e) => {
        dragging = true;
        last = clampToGoal(scenePoint(e).x, scenePoint(e).y);
        keeperGlide(last);
      };
      const move = (e) => {
        if (!dragging) return;
        const p = scenePoint(e);
        last = clampToGoal(p.x, p.y);
        keeperGlide(last);
      };
      const up = () => {
        if (!dragging || !last) return;
        dragging = false;
        finish(last);
      };
      svg.addEventListener('pointerdown', down);
      svg.addEventListener('pointermove', move);
      svg.addEventListener('pointerup', up);
      svg.addEventListener('pointercancel', up);
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

  const hideAimDot = () => {
    aimDot.setAttribute('opacity', '0');
    aimLine.setAttribute('opacity', '0');
  };

  /** Dibuja la trayectoria proyectada del gesto actual (con su curva). */
  function showAimLine(pts) {
    const shot = analyzeSwipe(pts);
    if (!shot) {
      aimLine.setAttribute('opacity', '0');
      return null;
    }
    const path = shotPath(shot);
    let d = `M ${BALL_HOME.x} ${BALL_HOME.y}`;
    for (let i = 1; i <= 12; i++) {
      const p = path(i / 12);
      d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }
    aimLine.setAttribute('d', d);
    // La guía comunica potencia: gesto más veloz (dur menor) = línea más gruesa y sólida
    const power = Math.min(1, Math.max(0, (560 - shot.dur) / 310));
    aimLine.setAttribute('stroke-width', (2 + power * 4).toFixed(1));
    aimLine.setAttribute('opacity', (0.5 + power * 0.4).toFixed(2));
    return shot;
  }

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
        // La línea proyecta la trayectoria real (con curva); el punto marca el destino
        const preview = showAimLine(pts);
        showAimDot(preview ? { tx: preview.tx, ty: preview.ty } : projectTarget(pts[0], p));
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
    if (resolveDive) resolveDive();
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
    const nameEl = svg.querySelector('#shooter .sh-name');
    if (nameEl) nameEl.textContent = (shooterProfile?.name ?? '').toUpperCase();
    svg.dataset.shStyle = shooterProfile?.style ?? 'clasico';
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

  /** Estirada continua con física: vuela desde donde esté el arquero hasta el
   *  punto {x,y} elegido, con impulso, arco de gravedad y rotación del cuerpo. */
  function keeperDive(point) {
    svg.classList.add('diving'); // pausa el balanceo de espera
    hideReticle();
    const dx = (point.x - KEEPER_HOME.x) * 0.92;
    const rel = point.y - KEEPER_HOME.y; // negativo = hacia arriba del arco
    const dy = Math.max(-72, Math.min(4, rel * 0.7 - 4));
    const angle = Math.max(-62, Math.min(62, (point.x - KEEPER_HOME.x) * 0.62));
    const startX = keeperGlideX; // si se deslizó siguiendo el dedo, vuela desde ahí
    const startY = keeperGlideY;
    const jump = point.y < KEEPER_HOME.y - 130 ? -34 : point.y < KEEPER_HOME.y - 60 ? -20 : -8;
    const dur = 430;

    keeper.style.transition = 'none';
    const t0 = performance.now();
    const step = (now) => {
      const u = Math.min(1, (now - t0) / dur);
      const e = 1 - (1 - u) ** 2; // impulso fuerte que se frena en el aire
      const x = startX + (dx - startX) * e;
      const y = startY + (dy - startY) * e + jump * Math.sin(Math.PI * u); // arco de gravedad
      const r = angle * Math.min(1, u * 1.5);
      keeper.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg)`;
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /** Estela de cometa que deja el balón en vuelo. */
  const ballAnchor = ball.parentElement;
  function spawnTrail(x, y, scale, power = 0.5) {
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', x.toFixed(1));
    dot.setAttribute('cy', y.toFixed(1));
    // Un tiro potente deja una estela más gruesa y luminosa
    dot.setAttribute('r', ((4.2 + power * 3.4) * scale).toFixed(1));
    dot.setAttribute('class', 'trail');
    dot.setAttribute('opacity', (0.4 + power * 0.45).toFixed(2));
    svg.insertBefore(dot, ballAnchor);
    setTimeout(() => dot.remove(), 300);
  }

  /** Vuelo físico del balón (requestAnimationFrame sobre core/physics).
      `from` permite rematar desde donde esté el balón (cabezazos de córner). */
  function ballFlight(shot, from) {
    const path = shotPath(shot, from);
    const power = Math.min(1, Math.max(0, (560 - (shot.dur || 400)) / 310));
    const every = power > 0.6 ? 1 : 2; // tiros potentes dejan estela más densa
    ball.style.transition = 'none';
    return new Promise((resolve) => {
      const t0 = performance.now();
      let frame = 0;
      const step = (now) => {
        const u = Math.min(1, (now - t0) / shot.dur);
        const p = path(u);
        const s = 1 - 0.38 * u;
        ball.style.transform = `translate(${(p.x - BALL_HOME.x).toFixed(1)}px, ${(p.y - BALL_HOME.y).toFixed(1)}px) scale(${s.toFixed(3)})`;
        // La sombra se queda en el suelo, se achica y se desvanece al elevarse el balón
        if (ballShadow) {
          ballShadow.style.transform = `scale(${(1 - 0.72 * u).toFixed(3)})`;
          ballShadow.style.opacity = (1 - 0.9 * u).toFixed(3);
        }
        if (frame % every === 0 && u > 0.05 && u < 0.95) spawnTrail(p.x, p.y, s, power);
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

  /** Lluvia de confeti de colores sobre el arco al celebrar. */
  const CONFETTI = ['#ffd100', '#ff5b5b', '#33e0a1', '#7bdff2', '#ffffff'];
  function spawnConfetti() {
    for (let i = 0; i < 18; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const size = 4 + Math.random() * 4;
      c.setAttribute('x', (44 + Math.random() * 272).toFixed(1));
      c.setAttribute('y', (128 + Math.random() * 24).toFixed(1));
      c.setAttribute('width', size.toFixed(1));
      c.setAttribute('height', (size * 1.6).toFixed(1));
      c.setAttribute('rx', '1');
      c.setAttribute('fill', CONFETTI[i % CONFETTI.length]);
      c.setAttribute('class', 'confetti');
      c.style.setProperty('--dx', `${((Math.random() * 2 - 1) * 46).toFixed(0)}px`);
      c.style.animationDelay = `${(Math.random() * 0.25).toFixed(2)}s`;
      svg.appendChild(c);
      setTimeout(() => c.remove(), 1600);
    }
  }

  /** La tribuna salta un instante + confeti (goles propios, atajadas heroicas). */
  function celebrate() {
    svg.classList.add('celebrate');
    spawnConfetti();
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
    keeperGlideX = 0;
    keeperGlideY = 0;
    hideReticle();
    keeper.style.transition = '';
    keeper.style.transform = '';
    ball.style.transition = '';
    ball.style.transform = '';
    if (ballShadow) {
      ballShadow.style.transform = '';
      ballShadow.style.opacity = '';
    }
  }

  return { el, setKits, setWall, pickDive, captureSwipe, cornerCross, cancelAim, keeperDive, ballFlight, ballBounce, ballDeflect, kickAnim, celebrate, shake, flash, netRipple, reset };
}
