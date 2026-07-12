/**
 * Pantalla de partido: orquesta la tanda completa.
 * Une el motor puro (core/shootout) con los componentes visuales.
 * Dos modos de rival:
 * - IA local (core/ai) en partido rápido y torneo.
 * - Duelo 1 vs 1: los picks viajan por WebRTC (net/duel). En cada penal
 *   ambos jugadores actúan a la vez (uno remata, el otro elige el vuelo)
 *   y las dos pantallas animan el mismo resultado.
 */
import { createShootout, registerKick, registerHabit, winner, isSuddenDeath, score } from '../core/shootout.js';
import { keeperPick, shooterPick } from '../core/ai.js';
import { adjacentZone } from '../core/zones.js';
import { createPitch } from './Pitch.js';
import { createScoreboard } from './Scoreboard.js';
import { createAnnouncer } from './Announcer.js';
import { createPowerBar } from './PowerBar.js';
import { fromHTML, sleep } from '../utils/dom.js';
import { pick } from '../utils/random.js';
import { sfx, isMuted, setMuted } from '../audio/sfx.js';
import { icon } from '../art/icons.js';
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
};

export function createMatchScreen({ onFinish, onExit }) {
  const pitch = createPitch();
  const scoreboard = createScoreboard();
  const announcer = createAnnouncer();
  const powerBar = createPowerBar();

  const el = fromHTML(`
    <section class="screen match-screen">
      <button class="btn-exit" aria-label="Salir al menú">✕</button>
      <button class="btn-sound" data-ref="sound" aria-label="Activar o silenciar sonido"></button>
      <div class="stage-chip" data-ref="stage" hidden></div>
      <div class="phase-msg"><b data-ref="msg"></b><span data-ref="sub"></span></div>
      <div class="pitch-wrap" data-ref="wrap"></div>
    </section>`);

  el.prepend(scoreboard.el);
  const wrap = el.querySelector('[data-ref="wrap"]');
  wrap.append(pitch.el, powerBar.el, announcer.el);
  const msgEl = el.querySelector('[data-ref="msg"]');
  const subEl = el.querySelector('[data-ref="sub"]');
  const stageEl = el.querySelector('[data-ref="stage"]');

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

  /** Fase de puntería + barra de potencia. Null si se cancela. */
  async function aimMyShot() {
    const { s, playerTeam, rivalTeam } = ctx;
    ctx.phase = 'shoot';
    pitch.setKits({ shooterTeam: playerTeam, keeperTeam: rivalTeam });
    const n = s.kicks.P.length + 1;
    setMsg(`Penal ${n} — ¡Tú pateas!`, 'Toca la casilla para colocar tu remate');
    updateBoard();

    const zone = await pitch.pickZone();
    if (zone === null || aborted) return null;

    setMsg(`Penal ${n} — ¡Tú pateas!`, '¡Frena la barra en el verde!');
    const power = await powerBar.run();
    if (power === null || aborted) return null;

    let finalZone = zone;
    let offTarget = false;
    let fast = false;
    if (power.quality === 'perfect') {
      fast = true; // remate imparable en velocidad
    } else if (power.quality === 'poor') {
      const roll = Math.random();
      if (roll < 0.3) offTarget = true;
      else if (roll < 0.8) finalZone = adjacentZone(zone);
    }
    return { zone, finalZone, offTarget, fast };
  }

  /** Resultado + festejo de un penal propio. */
  async function settleMyKick({ goal, offTarget, ballZone }) {
    if (goal) {
      sfx.goal();
      buzz(80);
      pitch.celebrate();
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
    } else if (offTarget) {
      sfx.cheer();
      buzz(40);
    } else {
      pitch.ballBounce(ballZone);
      sfx.save();
      sfx.cheer();
      buzz(60);
      pitch.celebrate();
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
    registerHabit(ctx.s, shot.zone);
    const gkZone = keeperPick(ctx.diff, shot.zone, ctx.s.habits); // el arquero lee la intención

    await pitch.kickAnim();
    sfx.kick();
    pitch.keeperDive(gkZone);

    let goal;
    if (shot.offTarget) {
      pitch.ballOver(shot.zone);
      goal = false;
    } else {
      pitch.ballTo(shot.finalZone, { fast: shot.fast });
      goal = shot.finalZone !== gkZone;
    }
    await sleep(shot.fast ? 340 : 480);
    await settleMyKick({ goal, offTarget: shot.offTarget, ballZone: shot.finalZone });
  }

  async function cpuKick() {
    const { s, playerTeam, rivalTeam, diff } = ctx;
    ctx.phase = 'save';
    pitch.setKits({ shooterTeam: rivalTeam, keeperTeam: playerTeam });
    setMsg(`Penal ${s.kicks.C.length + 1} — ¡Te toca atajar!`, 'Toca la casilla hacia donde volarás');
    updateBoard();

    const dive = await pitch.pickZone();
    if (dive === null || aborted) return;
    const shot = shooterPick(diff, dive);

    await pitch.kickAnim();
    sfx.kick();
    pitch.keeperDive(dive);

    let goal;
    if (shot.offTarget) {
      pitch.ballOver(shot.zone);
      goal = false;
    } else {
      pitch.ballTo(shot.zone);
      goal = shot.zone !== dive;
    }
    await sleep(480);
    await settleTheirKick({ goal, offTarget: shot.offTarget, ballZone: shot.zone });
  }

  /* ---------- Rival humano (duelo WebRTC) ---------- */

  async function myDuelKick() {
    const shot = await aimMyShot();
    if (!shot) return;
    ctx.duel.send({ t: 'shot', finalZone: shot.finalZone, offTarget: shot.offTarget, fast: shot.fast });

    setMsg('Esperando al arquero rival…', 'Está eligiendo su vuelo');
    const dive = await ctx.duel.next('dive');
    if (dive === null || aborted) return;

    await pitch.kickAnim();
    sfx.kick();
    pitch.keeperDive(dive.zone);

    let goal;
    if (shot.offTarget) {
      pitch.ballOver(shot.zone);
      goal = false;
    } else {
      pitch.ballTo(shot.finalZone, { fast: shot.fast });
      goal = shot.finalZone !== dive.zone;
    }
    await sleep(shot.fast ? 340 : 480);
    await settleMyKick({ goal, offTarget: shot.offTarget, ballZone: shot.finalZone });
  }

  async function theirDuelKick() {
    const { s, playerTeam, rivalTeam } = ctx;
    ctx.phase = 'save';
    pitch.setKits({ shooterTeam: rivalTeam, keeperTeam: playerTeam });
    setMsg(`Penal ${s.kicks.C.length + 1} — ¡Te toca atajar!`, 'Toca la casilla hacia donde volarás');
    updateBoard();

    const dive = await pitch.pickZone();
    if (dive === null || aborted) return;
    ctx.duel.send({ t: 'dive', zone: dive });

    setMsg('Esperando el remate…', 'El rival está pateando');
    const shot = await ctx.duel.next('shot');
    if (shot === null || aborted) return;

    await pitch.kickAnim();
    sfx.kick();
    pitch.keeperDive(dive);

    let goal;
    if (shot.offTarget) {
      pitch.ballOver(shot.finalZone);
      goal = false;
    } else {
      pitch.ballTo(shot.finalZone, { fast: shot.fast });
      goal = shot.finalZone !== dive;
    }
    await sleep(480);
    await settleTheirKick({ goal, offTarget: shot.offTarget, ballZone: shot.finalZone });
  }

  /* ---------- Orquestación ---------- */

  async function start({ playerTeam, rivalTeam, diff, stageLabel = null, duel = null, isHost = true }) {
    aborted = false;
    ctx = { s: createShootout(), playerTeam, rivalTeam, diff, phase: 'shoot', duel, isHost };
    stageEl.hidden = !stageLabel;
    stageEl.textContent = stageLabel ?? '';
    pitch.reset();
    sfx.whistle();
    let suddenAnnounced = false;

    while (!aborted) {
      // El anfitrión (o el jugador local contra la IA) patea primero
      const legs = duel && !isHost
        ? [theirDuelKick, myDuelKick]
        : duel
          ? [myDuelKick, theirDuelKick]
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
    powerBar.hide();
    finish(true);
  }

  function stop() {
    aborted = true;
    pitch.cancelAim();
    powerBar.hide();
  }

  const isRunning = () => ctx !== null && !aborted;

  return { el, start, stop, walkover, isRunning };
}
