/**
 * Pantalla de partido: orquesta la tanda completa.
 * Los remates usan física real (core/physics): el jugador desliza desde el
 * balón hacia el arco — dirección = puntería, velocidad = potencia y la
 * curvatura del gesto = efecto. Fallar el arco es posible por puntería
 * propia, sin dados. Atajar es arrastrar al arquero a un punto libre del arco:
 * la atajada la decide la distancia (alcance del arquero), no una casilla.
 * Rivales: IA local (core/ai) o humano por WebRTC (net/duel).
 */
import { createShootout, registerKick, registerHabit, winner, isSuddenDeath, score } from '../core/shootout.js';
import { keeperAim, shooterAim } from '../core/ai.js';
import { zoneAt, zoneNearest, inGoal, AI_REACH, PLAYER_REACH } from '../core/zones.js';
import { cpuAimShot, isSaved, cornerCrossPath, headerShot, wallBlocks, applyWind } from '../core/physics.js';
import { recordShot } from '../core/stats.js';
import { createPitch } from './Pitch.js';
import { createScoreboard } from './Scoreboard.js';
import { createAnnouncer } from './Announcer.js';
import { fromHTML, sleep } from '../utils/dom.js';
import { pick } from '../utils/random.js';
import { sfx, isMuted, setMuted, startAmbience, stopAmbience } from '../audio/sfx.js';
import { icon } from '../art/icons.js';
import { flagSVG } from '../art/flags.js';
import './MatchScreen.css';

/** Vibración háptica donde exista (móvil). */
const buzz = (pattern) => {
  try {
    navigator.vibrate?.(pattern);
  } catch { /* sin vibración */ }
};

const COPY = {
  goalPlayer: ['¡GOOOOL!', '¡BOMBAZO!', '¡GOLAZO!', '¡LA CLAVÓ!'],
  savedShot: ['¡ATAJADO!', '¡TE LA SACÓ!', '¡VOLÓ EL ARQUERO!'],
  playerMiss: ['¡AFUERA!', '¡A LAS NUBES!', '¡POR ENCIMA DEL ARCO!'],
  playerSave: ['¡ATAJADÓN!', '¡QUÉ MANOS!', '¡MONUMENTAL!'],
  cpuGoal: ['GOL DEL RIVAL…', 'LA MANDÓ ADENTRO', 'NADA QUE HACER'],
  cpuMiss: ['¡AFUERA!', '¡A LAS NUBES!', '¡LA TIRÓ A LA TRIBUNA!'],
  crossLost: ['¡PASÓ DE LARGO!', '¡SE FUE EL CENTRO!', '¡NADIE LA PEINÓ!'],
  wallBlockMine: ['¡A LA BARRERA!', '¡LA TAPÓ LA BARRERA!', '¡MURO INFRANQUEABLE!'],
  wallBlockTheirs: ['¡TU BARRERA LA SACÓ!', '¡CHOCÓ CON EL MURO!'],
};

export function createMatchScreen({ onFinish, onExit }) {
  const pitch = createPitch();
  const scoreboard = createScoreboard();
  const announcer = createAnnouncer();

  const el = fromHTML(`
    <section class="screen match-screen">
      <button class="btn-exit" aria-label="Salir al menú">✕</button>
      <button class="btn-sound" data-ref="sound" aria-label="Activar o silenciar sonido"></button>
      <div class="stage-chip" data-ref="stage" hidden></div>
      <div class="wind-chip" data-ref="wind" hidden></div>
      <div class="phase-msg"><b data-ref="msg"></b><span data-ref="sub"></span></div>
      <div class="pitch-wrap" data-ref="wrap">
        <div class="swipe-hint" data-ref="hint" hidden>
          <svg class="hint-arrow" viewBox="0 0 34 74" aria-hidden="true">
            <path d="M17 70 V14" stroke="#ffd100" stroke-width="6" stroke-linecap="round"/>
            <path d="M5 24 L17 6 L29 24" fill="none" stroke="#ffd100" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Desliza para rematar</span>
        </div>
      </div>
      <div class="handoff" data-ref="handoff" hidden>
        <b data-ref="hotitle"></b>
        <span data-ref="hosub"></span>
        <span class="ho-tap">Toca para continuar</span>
      </div>
      <div class="vs-splash" data-ref="vsplash" hidden>
        <div class="vsp-stage" data-ref="vstage"></div>
        <div class="vsp-row">
          <div class="vsp-side from-left" data-ref="vleft"></div>
          <div class="vsp-mid">VS</div>
          <div class="vsp-side from-right" data-ref="vright"></div>
        </div>
      </div>
    </section>`);

  el.prepend(scoreboard.el);
  const wrap = el.querySelector('[data-ref="wrap"]');
  const hintEl = el.querySelector('[data-ref="hint"]');
  wrap.prepend(pitch.el);
  wrap.append(announcer.el);
  const msgEl = el.querySelector('[data-ref="msg"]');
  const subEl = el.querySelector('[data-ref="sub"]');
  const stageEl = el.querySelector('[data-ref="stage"]');
  const windEl = el.querySelector('[data-ref="wind"]');
  const vsplashEl = el.querySelector('[data-ref="vsplash"]');
  const vstageEl = el.querySelector('[data-ref="vstage"]');
  const vleftEl = el.querySelector('[data-ref="vleft"]');
  const vrightEl = el.querySelector('[data-ref="vright"]');

  const handoffEl = el.querySelector('[data-ref="handoff"]');
  const hotitleEl = el.querySelector('[data-ref="hotitle"]');
  const hosubEl = el.querySelector('[data-ref="hosub"]');

  /** Pantalla de "pásale el teléfono" (modo 2 jugadores): espera un toque. */
  function showHandoff(title, sub) {
    return new Promise((resolve) => {
      hotitleEl.textContent = title;
      hosubEl.textContent = sub;
      handoffEl.hidden = false;
      const onTap = () => {
        handoffEl.removeEventListener('pointerdown', onTap);
        handoffEl.hidden = true;
        resolve();
      };
      setTimeout(() => handoffEl.addEventListener('pointerdown', onTap), 350);
    });
  }

  /** Presentación estilo arcade: los dos equipos entran antes del partido. */
  async function showVsSplash(playerTeam, rivalTeam, stageLabel) {
    vstageEl.textContent = stageLabel ?? 'TANDA DE PENALES';
    vleftEl.innerHTML = `${flagSVG(playerTeam.id, 84, 56)}<b>${playerTeam.short}</b>`;
    vrightEl.innerHTML = `${flagSVG(rivalTeam.id, 84, 56)}<b>${rivalTeam.short}</b>`;
    vsplashEl.hidden = false;
    void vsplashEl.offsetWidth; // reinicia las animaciones de entrada
    await sleep(1250);
    vsplashEl.hidden = true;
  }

  el.querySelector('.btn-exit').addEventListener('click', () => {
    stop();
    onExit();
  });

  const soundBtn = el.querySelector('[data-ref="sound"]');
  const renderSoundBtn = () => {
    soundBtn.innerHTML = icon(isMuted() ? 'soundOff' : 'soundOn', 16);
  };
  soundBtn.addEventListener('click', () => {
    setMuted(!isMuted());
    renderSoundBtn();
    if (isMuted()) stopAmbience();
    else if (isRunning()) startAmbience();
  });
  renderSoundBtn();

  let aborted = false;
  let ctx = null; // { s, playerTeam, rivalTeam, diff, phase, duel, isHost }

  function setMsg(main, sub) {
    msgEl.textContent = main;
    subEl.textContent = sub;
  }

  function updateBoard() {
    const { s, playerTeam, rivalTeam, phase } = ctx;
    scoreboard.update({
      rows: [
        { team: playerTeam, kicks: s.kicks.P, score: score(s, 'P'), active: phase === 'shoot' },
        { team: rivalTeam, kicks: s.kicks.C, score: score(s, 'C'), active: phase === 'save' },
      ],
    });
  }

  /**
   * Fase de remate propio: swipe con física.
   * Devuelve { tx, ty, curve, dur, finalZone, offTarget } o null si se cancela.
   */
  async function aimMyShot() {
    const { s, playerTeam, rivalTeam } = ctx;
    ctx.phase = 'shoot';
    pitch.setKits({ shooterTeam: playerTeam, keeperTeam: rivalTeam, shooterProfile: ctx.profile });
    setMsg(`Penal ${s.kicks.P.length + 1} — ¡Tú pateas!`, 'Desliza hacia el arco · curva el gesto para darle efecto');
    updateBoard();

    // Tutorial de primer remate: flecha animada hasta que ejecute su primer swipe
    let tutorialPending = false;
    try {
      tutorialPending = localStorage.getItem('bombazo:tut') !== '1';
    } catch { /* sin persistencia */ }
    hintEl.hidden = !tutorialPending;

    const shot = await pitch.captureSwipe();
    hintEl.hidden = true;
    if (!shot || aborted) return null;
    if (tutorialPending) {
      try {
        localStorage.setItem('bombazo:tut', '1');
      } catch { /* sin persistencia */ }
    }
    applyWind(shot, ctx.wind);
    const finalZone = zoneAt(shot.tx, shot.ty);
    return { ...shot, finalZone, offTarget: finalZone === null };
  }

  /** Resultado + festejo de un penal propio. */
  async function settleMyKick({ goal, offTarget, ballZone }) {
    if (!offTarget) recordShot(ballZone, goal); // mapa de calor de puntería
    if (goal) {
      sfx.goal();
      buzz(80);
      pitch.celebrate();
      pitch.flash();
      pitch.shake();
      pitch.netRipple();
    } else if (offTarget) {
      sfx.fail();
      buzz(25);
    } else {
      pitch.ballBounce(ballZone);
      sfx.save();
      sfx.fail();
      buzz(25);
    }
    registerKick(ctx.s, 'P', goal);
    updateBoard();
    const copy = goal ? COPY.goalPlayer : offTarget ? COPY.playerMiss : COPY.savedShot;
    await announcer.say(pick(copy), goal ? 'goal' : 'miss');
    pitch.reset();
    await sleep(240);
  }

  /** Resultado de un penal del rival (yo atajo). */
  async function settleTheirKick({ goal, offTarget, ballZone }) {
    if (goal) {
      sfx.fail();
      buzz([40, 50, 40]);
      pitch.shake();
      pitch.netRipple();
    } else if (offTarget) {
      sfx.cheer();
      buzz(40);
    } else {
      pitch.ballBounce(ballZone);
      sfx.save();
      sfx.cheer();
      buzz(60);
      pitch.celebrate();
      pitch.shake();
    }
    registerKick(ctx.s, 'C', goal);
    updateBoard();
    const copyKey = goal ? 'cpuGoal' : offTarget ? 'cpuMiss' : 'playerSave';
    await announcer.say(pick(COPY[copyKey]), goal ? 'miss' : 'save');
    pitch.reset();
    await sleep(240);
  }

  /* ---------- Rival IA ---------- */

  async function playerKickVsAI() {
    const shot = await aimMyShot();
    if (!shot) return;
    if (shot.finalZone !== null) registerHabit(ctx.s, shot.finalZone);
    // El arquero lee el punto del tiro con el error de su dificultad
    const keeper = keeperAim(ctx.diff, shot, ctx.s.habits);

    await pitch.kickAnim();
    sfx.kick();
    pitch.keeperDive(keeper);
    await pitch.ballFlight(shot);

    const goal = !shot.offTarget && !isSaved(shot, keeper, AI_REACH);
    await settleMyKick({ goal, offTarget: shot.offTarget, ballZone: shot.finalZone ?? zoneNearest(shot.tx, shot.ty) });
  }

  async function cpuKick() {
    const { s, playerTeam, rivalTeam, diff } = ctx;
    ctx.phase = 'save';
    pitch.setKits({ shooterTeam: rivalTeam, keeperTeam: playerTeam, shooterProfile: ctx.rivalProfile });
    setMsg(`Penal ${s.kicks.C.length + 1} — ¡Te toca atajar!`, 'Arrastra a tu arquero hacia donde volarás');
    updateBoard();

    const dive = await pitch.pickDive();
    if (dive === null || aborted) return;
    const aim = shooterAim(diff, dive);
    const cpuShot = applyWind(cpuAimShot(aim, aim.offTarget), ctx.wind);
    const off = aim.offTarget || !inGoal(cpuShot.tx, cpuShot.ty);

    await pitch.kickAnim();
    sfx.kick();
    pitch.keeperDive(dive);
    await pitch.ballFlight(cpuShot);

    const goal = !off && !isSaved(cpuShot, dive, PLAYER_REACH);
    await settleTheirKick({ goal, offTarget: off, ballZone: zoneNearest(cpuShot.tx, cpuShot.ty) });
  }

  /* ---------- Modo Córners: cabezazo con timing ---------- */

  const crossSide = () => (ctx.s.kicks.P.length % 2 === 0 ? 'right' : 'left');

  async function myCornerKick() {
    const { s, playerTeam, rivalTeam } = ctx;
    ctx.phase = 'shoot';
    pitch.setKits({ shooterTeam: playerTeam, keeperTeam: rivalTeam, shooterProfile: ctx.profile });
    setMsg(`Córner ${s.kicks.P.length + 1} — ¡Remata de cabeza!`, 'Toca justo cuando el centro pase por donde quieres');
    updateBoard();

    sfx.kick(); // saque de esquina
    const tap = await pitch.cornerCross(cornerCrossPath(crossSide()));
    if (aborted) return;

    if (tap === null) {
      // No remató: el centro se perdió
      registerKick(s, 'P', false);
      updateBoard();
      await announcer.say(pick(COPY.crossLost), 'miss');
      pitch.reset();
      await sleep(240);
      return;
    }

    const shot = applyWind(headerShot(tap), ctx.wind);
    const off = !inGoal(shot.tx, shot.ty);
    const keeper = keeperAim(ctx.diff, shot, s.habits);

    sfx.kick();
    pitch.keeperDive(keeper);
    await pitch.ballFlight(shot, { x: tap.x, y: tap.y });

    const goal = !off && !isSaved(shot, keeper, AI_REACH);
    await settleMyKick({ goal, offTarget: off, ballZone: zoneNearest(shot.tx, shot.ty) });
  }

  async function theirCornerKick() {
    const { s, playerTeam, rivalTeam, diff } = ctx;
    ctx.phase = 'save';
    pitch.setKits({ shooterTeam: rivalTeam, keeperTeam: playerTeam, shooterProfile: ctx.rivalProfile });
    setMsg(`Córner ${s.kicks.C.length + 1} — ¡Ataja el cabezazo!`, 'Arrastra a tu arquero hacia donde volarás');
    updateBoard();

    const dive = await pitch.pickDive();
    if (dive === null || aborted) return;
    const aim = shooterAim(diff, dive);
    const cpuShot = applyWind(cpuAimShot(aim, aim.offTarget), ctx.wind);
    const off = aim.offTarget || !inGoal(cpuShot.tx, cpuShot.ty);

    sfx.kick();
    // El centro rival viaja hasta el punto de remate y ahí llega el cabezazo
    const headAt = 0.35 + Math.random() * 0.3;
    const cross = cornerCrossPath(crossSide());
    const headPoint = await pitch.cornerCross(cross, { interactive: false, stopAt: headAt });
    if (aborted) return;

    sfx.kick();
    pitch.keeperDive(dive);
    await pitch.ballFlight(cpuShot, headPoint);

    const goal = !off && !isSaved(cpuShot, dive, PLAYER_REACH);
    await settleTheirKick({ goal, offTarget: off, ballZone: zoneNearest(cpuShot.tx, cpuShot.ty) });
  }

  /* ---------- Modo Tiros libres: la barrera tapa el centro ---------- */

  async function myFreeKick() {
    const { s, playerTeam, rivalTeam } = ctx;
    ctx.phase = 'shoot';
    pitch.setKits({ shooterTeam: playerTeam, keeperTeam: rivalTeam, shooterProfile: ctx.profile });
    setMsg(`Tiro libre ${s.kicks.P.length + 1} — ¡Supera la barrera!`, 'Por arriba o con mucha curva: la barrera tapa el centro');
    updateBoard();

    const shot = await pitch.captureSwipe();
    if (!shot || aborted) return;
    applyWind(shot, ctx.wind);
    const finalZone = zoneAt(shot.tx, shot.ty);
    const blocked = finalZone !== null && wallBlocks(finalZone, shot.curve);

    if (blocked) {
      await pitch.kickAnim();
      sfx.kick();
      await pitch.ballFlight({ tx: Math.min(220, Math.max(140, shot.tx)), ty: 412, curve: shot.curve, dur: 170 });
      pitch.ballDeflect();
      sfx.save();
      buzz(25);
      registerKick(s, 'P', false);
      updateBoard();
      await announcer.say(pick(COPY.wallBlockMine), 'miss');
      pitch.reset();
      await sleep(240);
      return;
    }

    const keeper = keeperAim(ctx.diff, shot, s.habits);
    await pitch.kickAnim();
    sfx.kick();
    pitch.keeperDive(keeper);
    await pitch.ballFlight(shot);
    const goal = finalZone !== null && !isSaved(shot, keeper, AI_REACH);
    await settleMyKick({ goal, offTarget: finalZone === null, ballZone: finalZone ?? zoneNearest(shot.tx, shot.ty) });
  }

  async function theirFreeKick() {
    const { s, playerTeam, rivalTeam, diff } = ctx;
    ctx.phase = 'save';
    pitch.setKits({ shooterTeam: rivalTeam, keeperTeam: playerTeam, shooterProfile: ctx.rivalProfile });
    setMsg(`Tiro libre ${s.kicks.C.length + 1} — ¡Defiende!`, 'Arrastra a tu arquero hacia donde volarás');
    updateBoard();

    const dive = await pitch.pickDive();
    if (dive === null || aborted) return;

    // La CPU evita la barrera (columna central) casi siempre... casi
    let aim = shooterAim(diff, dive);
    let cpuShot = applyWind(cpuAimShot(aim, aim.offTarget), ctx.wind);
    let tries = 0;
    while (!aim.offTarget && [4, 7].includes(zoneNearest(cpuShot.tx, cpuShot.ty)) && tries < 3) {
      aim = shooterAim(diff, dive);
      cpuShot = applyWind(cpuAimShot(aim, aim.offTarget), ctx.wind);
      tries += 1;
    }
    const finalZone = aim.offTarget || !inGoal(cpuShot.tx, cpuShot.ty) ? null : zoneNearest(cpuShot.tx, cpuShot.ty);
    const blocked = finalZone !== null && wallBlocks(finalZone, cpuShot.curve);

    await pitch.kickAnim();
    sfx.kick();

    if (blocked) {
      await pitch.ballFlight({ tx: cpuShot.tx, ty: 412, curve: cpuShot.curve, dur: 170 });
      pitch.ballDeflect();
      sfx.save();
      sfx.cheer();
      buzz(40);
      registerKick(s, 'C', false);
      updateBoard();
      await announcer.say(pick(COPY.wallBlockTheirs), 'save');
      pitch.reset();
      await sleep(240);
      return;
    }

    pitch.keeperDive(dive);
    await pitch.ballFlight(cpuShot);
    const goal = finalZone !== null && !isSaved(cpuShot, dive, PLAYER_REACH);
    await settleTheirKick({ goal, offTarget: finalZone === null, ballZone: zoneNearest(cpuShot.tx, cpuShot.ty) });
  }

  /* ---------- Rival humano (duelo WebRTC) ---------- */

  async function myDuelKick() {
    const shot = await aimMyShot();
    if (!shot) return;
    ctx.duel.send({ t: 'shot', tx: shot.tx, ty: shot.ty, curve: shot.curve, dur: shot.dur, finalZone: shot.finalZone, offTarget: shot.offTarget });

    setMsg('Esperando al arquero rival…', 'Está eligiendo su vuelo');
    const dive = await ctx.duel.next('dive');
    if (dive === null || aborted) return;

    await pitch.kickAnim();
    sfx.kick();
    pitch.keeperDive(dive);
    await pitch.ballFlight(shot);

    const goal = !shot.offTarget && !isSaved(shot, dive);
    await settleMyKick({ goal, offTarget: shot.offTarget, ballZone: shot.finalZone ?? zoneNearest(shot.tx, shot.ty) });
  }

  async function theirDuelKick() {
    const { s, playerTeam, rivalTeam } = ctx;
    ctx.phase = 'save';
    pitch.setKits({ shooterTeam: rivalTeam, keeperTeam: playerTeam, shooterProfile: ctx.rivalProfile });
    setMsg(`Penal ${s.kicks.C.length + 1} — ¡Te toca atajar!`, 'Arrastra a tu arquero hacia donde volarás');
    updateBoard();

    const dive = await pitch.pickDive();
    if (dive === null || aborted) return;
    ctx.duel.send({ t: 'dive', x: dive.x, y: dive.y });

    setMsg('Esperando el remate…', 'El rival está pateando');
    const shot = await ctx.duel.next('shot');
    if (shot === null || aborted) return;

    await pitch.kickAnim();
    sfx.kick();
    pitch.keeperDive(dive);
    await pitch.ballFlight(shot);

    const goal = !shot.offTarget && !isSaved(shot, dive);
    await settleTheirKick({ goal, offTarget: shot.offTarget, ballZone: shot.finalZone ?? zoneNearest(shot.tx, shot.ty) });
  }

  /* ---------- Modo 2 jugadores (mismo teléfono, hot-seat) ---------- */

  async function localLeg(shooterIsP1) {
    const { s, playerTeam, rivalTeam } = ctx;
    const shooterTeam = shooterIsP1 ? playerTeam : rivalTeam;
    const keeperTeam = shooterIsP1 ? rivalTeam : playerTeam;
    const n = (shooterIsP1 ? s.kicks.P.length : s.kicks.C.length) + 1;

    if (!shooterIsP1) {
      await showHandoff(`PATEA ${shooterTeam.short}`, 'Pásale el teléfono al pateador');
      if (aborted) return;
    }
    ctx.phase = shooterIsP1 ? 'shoot' : 'save';
    pitch.setKits({ shooterTeam, keeperTeam, shooterProfile: shooterIsP1 ? ctx.profile : null });
    setMsg(`Penal ${n} — Patea ${shooterTeam.short}`, `Arquero de ${keeperTeam.short}: ¡no mires!`);
    updateBoard();

    const shot = await pitch.captureSwipe();
    if (!shot || aborted) return;
    applyWind(shot, ctx.wind);
    const finalZone = zoneAt(shot.tx, shot.ty);

    // El remate queda en secreto hasta que el arquero elija su vuelo
    await showHandoff(`ATAJA ${keeperTeam.short}`, 'Pásale el teléfono al arquero');
    if (aborted) return;
    setMsg(`¡Ataja ${keeperTeam.short}!`, 'Arrastra a tu arquero a donde vuelas');
    const dive = await pitch.pickDive();
    if (dive === null || aborted) return;

    await pitch.kickAnim();
    sfx.kick();
    pitch.keeperDive(dive);
    await pitch.ballFlight(shot);
    const goal = finalZone !== null && !isSaved(shot, dive);
    const outcome = { goal, offTarget: finalZone === null, ballZone: finalZone ?? zoneNearest(shot.tx, shot.ty) };
    if (shooterIsP1) await settleMyKick(outcome);
    else await settleTheirKick(outcome);
  }

  const p1LocalKick = () => localLeg(true);
  const p2LocalKick = () => localLeg(false);

  /* ---------- Duelo: tiros libres ---------- */

  async function myDuelFreeKick() {
    const { s, playerTeam, rivalTeam } = ctx;
    ctx.phase = 'shoot';
    pitch.setKits({ shooterTeam: playerTeam, keeperTeam: rivalTeam, shooterProfile: ctx.profile });
    setMsg(`Tiro libre ${s.kicks.P.length + 1} — ¡Supera la barrera!`, 'Por arriba o con mucha curva');
    updateBoard();

    const shot = await pitch.captureSwipe();
    if (!shot || aborted) return;
    const finalZone = zoneAt(shot.tx, shot.ty);
    const blocked = finalZone !== null && wallBlocks(finalZone, shot.curve);
    ctx.duel.send({ t: 'shot', tx: shot.tx, ty: shot.ty, curve: shot.curve, dur: shot.dur, finalZone, offTarget: finalZone === null, blocked });

    setMsg('Esperando al arquero rival…', 'Está eligiendo su vuelo');
    const dive = await ctx.duel.next('dive');
    if (dive === null || aborted) return;

    await pitch.kickAnim();
    sfx.kick();
    if (blocked) {
      await pitch.ballFlight({ tx: Math.min(220, Math.max(140, shot.tx)), ty: 412, curve: shot.curve, dur: 170 });
      pitch.ballDeflect();
      sfx.save();
      buzz(25);
      registerKick(s, 'P', false);
      updateBoard();
      await announcer.say(pick(COPY.wallBlockMine), 'miss');
      pitch.reset();
      await sleep(240);
      return;
    }
    pitch.keeperDive(dive);
    await pitch.ballFlight(shot);
    const goal = finalZone !== null && !isSaved(shot, dive);
    await settleMyKick({ goal, offTarget: finalZone === null, ballZone: finalZone ?? zoneNearest(shot.tx, shot.ty) });
  }

  async function theirDuelFreeKick() {
    const { s, playerTeam, rivalTeam } = ctx;
    ctx.phase = 'save';
    pitch.setKits({ shooterTeam: rivalTeam, keeperTeam: playerTeam, shooterProfile: ctx.rivalProfile });
    setMsg(`Tiro libre ${s.kicks.C.length + 1} — ¡Defiende!`, 'Arrastra a tu arquero hacia donde volarás');
    updateBoard();

    const dive = await pitch.pickDive();
    if (dive === null || aborted) return;
    ctx.duel.send({ t: 'dive', x: dive.x, y: dive.y });

    setMsg('Esperando el remate…', 'El rival está pateando');
    const shot = await ctx.duel.next('shot');
    if (shot === null || aborted) return;

    await pitch.kickAnim();
    sfx.kick();
    if (shot.blocked) {
      await pitch.ballFlight({ tx: shot.tx, ty: 412, curve: shot.curve, dur: 170 });
      pitch.ballDeflect();
      sfx.save();
      sfx.cheer();
      buzz(40);
      registerKick(s, 'C', false);
      updateBoard();
      await announcer.say(pick(COPY.wallBlockTheirs), 'save');
      pitch.reset();
      await sleep(240);
      return;
    }
    pitch.keeperDive(dive);
    await pitch.ballFlight(shot);
    const goal = !shot.offTarget && !isSaved(shot, dive);
    await settleTheirKick({ goal, offTarget: shot.offTarget, ballZone: shot.finalZone ?? zoneNearest(shot.tx, shot.ty) });
  }

  /* ---------- Duelo: córners ---------- */

  async function myDuelCornerKick() {
    const { s, playerTeam, rivalTeam } = ctx;
    ctx.phase = 'shoot';
    pitch.setKits({ shooterTeam: playerTeam, keeperTeam: rivalTeam, shooterProfile: ctx.profile });
    setMsg(`Córner ${s.kicks.P.length + 1} — ¡Remata de cabeza!`, 'Toca justo cuando el centro pase por donde quieres');
    updateBoard();

    const side = s.kicks.P.length % 2 === 0 ? 'right' : 'left';
    sfx.kick();
    const tap = await pitch.cornerCross(cornerCrossPath(side));
    if (aborted) return;

    if (tap === null) {
      ctx.duel.send({ t: 'shot', lost: true, side });
      registerKick(s, 'P', false);
      updateBoard();
      await announcer.say(pick(COPY.crossLost), 'miss');
      pitch.reset();
      await sleep(240);
      return;
    }

    const shot = headerShot(tap);
    const finalZone = zoneAt(shot.tx, shot.ty);
    ctx.duel.send({
      t: 'shot', tx: shot.tx, ty: shot.ty, curve: shot.curve, dur: shot.dur,
      finalZone, offTarget: finalZone === null, side, headX: tap.x, headY: tap.y, headU: tap.u,
    });

    setMsg('Esperando al arquero rival…', 'Está eligiendo su vuelo');
    const dive = await ctx.duel.next('dive');
    if (dive === null || aborted) return;

    sfx.kick();
    pitch.keeperDive(dive);
    await pitch.ballFlight(shot, { x: tap.x, y: tap.y });
    const goal = finalZone !== null && !isSaved(shot, dive);
    await settleMyKick({ goal, offTarget: finalZone === null, ballZone: finalZone ?? zoneNearest(shot.tx, shot.ty) });
  }

  async function theirDuelCornerKick() {
    const { s, playerTeam, rivalTeam } = ctx;
    ctx.phase = 'save';
    pitch.setKits({ shooterTeam: rivalTeam, keeperTeam: playerTeam, shooterProfile: ctx.rivalProfile });
    setMsg(`Córner ${s.kicks.C.length + 1} — ¡Ataja el cabezazo!`, 'Arrastra a tu arquero hacia donde volarás');
    updateBoard();

    const dive = await pitch.pickDive();
    if (dive === null || aborted) return;
    ctx.duel.send({ t: 'dive', x: dive.x, y: dive.y });

    setMsg('Esperando el remate…', 'El rival está rematando el córner');
    const shot = await ctx.duel.next('shot');
    if (shot === null || aborted) return;

    sfx.kick();
    if (shot.lost) {
      // El centro rival pasó de largo: buena noticia para ti
      await pitch.cornerCross(cornerCrossPath(shot.side ?? 'right'), { interactive: false });
      registerKick(s, 'C', false);
      updateBoard();
      await announcer.say(pick(COPY.crossLost), 'save');
      pitch.reset();
      await sleep(240);
      return;
    }

    const headPoint = await pitch.cornerCross(cornerCrossPath(shot.side ?? 'right'), { interactive: false, stopAt: shot.headU ?? 0.5 });
    if (aborted) return;
    sfx.kick();
    pitch.keeperDive(dive);
    await pitch.ballFlight(shot, { x: shot.headX ?? headPoint.x, y: shot.headY ?? headPoint.y });
    const goal = !shot.offTarget && !isSaved(shot, dive);
    await settleTheirKick({ goal, offTarget: shot.offTarget, ballZone: shot.finalZone ?? zoneNearest(shot.tx, shot.ty) });
  }

  /* ---------- Orquestación ---------- */

  async function start({ playerTeam, rivalTeam, diff, stageLabel = null, duel = null, isHost = true, mode = 'penales', profile = null, rivalProfile = null }) {
    aborted = false;
    // Viento del partido (los duelos online se juegan "bajo techo": sin viento)
    const wind = duel ? 0 : pick([-1, -0.5, 0, 0, 0, 0.5, 1]);
    ctx = { s: createShootout(), playerTeam, rivalTeam, diff, phase: 'shoot', duel, isHost, mode, wind, profile, rivalProfile };
    stageEl.hidden = !stageLabel;
    stageEl.textContent = stageLabel ?? '';
    windEl.hidden = wind === 0;
    if (wind !== 0) {
      const arrows = (wind > 0 ? '→' : '←').repeat(Math.abs(wind) > 0.5 ? 2 : 1);
      windEl.textContent = `Viento ${arrows}`;
    }
    pitch.setWall(mode === 'libres');
    pitch.reset();
    updateBoard();
    await showVsSplash(playerTeam, rivalTeam, stageLabel);
    if (aborted) return;
    sfx.whistle();
    startAmbience();
    let suddenAnnounced = false;

    const duelLegs = {
      penales: [myDuelKick, theirDuelKick],
      corners: [myDuelCornerKick, theirDuelCornerKick],
      libres: [myDuelFreeKick, theirDuelFreeKick],
    };

    while (!aborted) {
      // El anfitrión (o el jugador local contra la IA) ejecuta primero
      const legs = duel
        ? (() => {
            const pair = duelLegs[mode] ?? duelLegs.penales;
            return isHost ? pair : [pair[1], pair[0]];
          })()
        : mode === 'corners'
          ? [myCornerKick, theirCornerKick]
          : mode === 'libres'
            ? [myFreeKick, theirFreeKick]
            : mode === 'local'
              ? [p1LocalKick, p2LocalKick]
              : [playerKickVsAI, cpuKick];

      await legs[0]();
      if (aborted) return;
      if (winner(ctx.s)) break;

      await legs[1]();
      if (aborted) return;
      if (winner(ctx.s)) break;

      if (isSuddenDeath(ctx.s) && !suddenAnnounced) {
        suddenAnnounced = true;
        sfx.sudden();
        await announcer.say('¡MUERTE SÚBITA!', 'info', 1200);
      }
    }

    if (!aborted) finish(false);
  }

  function finish(walkover) {
    const s = ctx.s;
    aborted = true; // el partido terminó: bloquea walkovers o picks tardíos
    stopAmbience();
    onFinish({
      won: walkover ? true : winner(s) === 'P',
      walkover,
      scoreP: score(s, 'P'),
      scoreC: score(s, 'C'),
      kicksP: [...s.kicks.P],
      kicksC: [...s.kicks.C],
      playerTeam: ctx.playerTeam,
      rivalTeam: ctx.rivalTeam,
      diff: ctx.diff,
    });
  }

  /** El rival se desconectó a mitad del duelo: victoria por retiro. */
  function walkover() {
    if (!ctx || aborted) return;
    aborted = true;
    pitch.cancelAim();
    finish(true);
  }

  function stop() {
    aborted = true;
    pitch.cancelAim();
    stopAmbience();
  }

  const isRunning = () => ctx !== null && !aborted;

  return { el, start, stop, walkover, isRunning };
}
