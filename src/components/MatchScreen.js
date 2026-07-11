/**
 * Pantalla de partido: orquesta la tanda completa.
 * Une el motor puro (core/shootout), la IA (core/ai) y los componentes
 * visuales (Pitch, Scoreboard, Announcer) en la secuencia de cada penal.
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
import './MatchScreen.css';

/** Vibración háptica donde exista (móvil). */
const buzz = (pattern) => {
  try {
    navigator.vibrate?.(pattern);
  } catch { /* sin vibración */ }
};

const COPY = {
  goalPlayer: ['¡GOOOOL!', '¡BOMBAZO! 💥', '¡GOLAZO! 🔥', '¡LA CLAVÓ!'],
  savedShot: ['¡ATAJADO! 🧤', '¡TE LA SACÓ!', '¡VOLÓ EL ARQUERO!'],
  playerMiss: ['¡AFUERA! 😱', '¡A LAS NUBES!', '¡POR ENCIMA DEL ARCO!'],
  playerSave: ['¡ATAJADÓN! 🧤', '¡QUÉ MANOS!', '¡MONUMENTAL!'],
  cpuGoal: ['GOL DEL RIVAL…', 'LA MANDÓ ADENTRO 😖', 'NADA QUE HACER'],
  cpuMiss: ['¡AFUERA! 🎉', '¡A LAS NUBES!', '¡LA TIRÓ A LA TRIBUNA!'],
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
    soundBtn.textContent = isMuted() ? '🔇' : '🔊';
  };
  soundBtn.addEventListener('click', () => {
    setMuted(!isMuted());
    renderSoundBtn();
  });
  renderSoundBtn();

  let aborted = false;
  let ctx = null; // { s, playerTeam, rivalTeam, diff, phase }

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

  async function playerKick() {
    const { s, playerTeam, rivalTeam, diff } = ctx;
    ctx.phase = 'shoot';
    pitch.setKits({ shooterTeam: playerTeam, keeperTeam: rivalTeam });
    setMsg(`Penal ${s.kicks.P.length + 1} — ¡Tú pateas!`, 'Toca la casilla para colocar tu remate');
    updateBoard();

    const zone = await pitch.pickZone();
    if (zone === null || aborted) return;
    registerHabit(s, zone);

    // Timing skill: frenar la barra define la calidad del remate
    setMsg(`Penal ${s.kicks.P.length + 1} — ¡Tú pateas!`, '¡Frena la barra en el verde!');
    const power = await powerBar.run();
    if (power === null || aborted) return;

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

    const gkZone = keeperPick(diff, zone, s.habits); // el arquero lee la intención

    await pitch.kickAnim();
    sfx.kick();
    pitch.keeperDive(gkZone);

    let goal;
    if (offTarget) {
      pitch.ballOver(zone);
      goal = false;
    } else {
      pitch.ballTo(finalZone, { fast });
      goal = finalZone !== gkZone;
    }
    await sleep(fast ? 340 : 480);

    if (goal) {
      sfx.goal();
      buzz(80);
      pitch.celebrate();
    } else if (offTarget) {
      sfx.fail();
      buzz(25);
    } else {
      pitch.ballBounce(finalZone);
      sfx.save();
      sfx.fail();
      buzz(25);
    }
    registerKick(s, 'P', goal);
    updateBoard();
    const copy = goal ? COPY.goalPlayer : offTarget ? COPY.playerMiss : COPY.savedShot;
    await announcer.say(pick(copy), goal ? 'goal' : 'miss');
    pitch.reset();
    await sleep(350);
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
    let copyKey;
    if (shot.offTarget) {
      pitch.ballOver(shot.zone);
      goal = false;
      copyKey = 'cpuMiss';
    } else {
      pitch.ballTo(shot.zone);
      goal = shot.zone !== dive;
      copyKey = goal ? 'cpuGoal' : 'playerSave';
    }
    await sleep(480);

    if (goal) {
      sfx.fail();
      buzz([40, 50, 40]);
    } else if (shot.offTarget) {
      sfx.cheer();
      buzz(40);
    } else {
      pitch.ballBounce(shot.zone);
      sfx.save();
      sfx.cheer();
      buzz(60);
      pitch.celebrate();
    }
    registerKick(s, 'C', goal);
    updateBoard();
    await announcer.say(pick(COPY[copyKey]), goal ? 'miss' : 'save');
    pitch.reset();
    await sleep(350);
  }

  async function start({ playerTeam, rivalTeam, diff, stageLabel = null }) {
    aborted = false;
    ctx = { s: createShootout(), playerTeam, rivalTeam, diff, phase: 'shoot' };
    stageEl.hidden = !stageLabel;
    stageEl.textContent = stageLabel ?? '';
    pitch.reset();
    sfx.whistle();
    let suddenAnnounced = false;

    while (!aborted) {
      await playerKick();
      if (aborted) return;
      if (winner(ctx.s)) break;

      await cpuKick();
      if (aborted) return;
      if (winner(ctx.s)) break;

      if (isSuddenDeath(ctx.s) && !suddenAnnounced) {
        suddenAnnounced = true;
        sfx.sudden();
        await announcer.say('¡MUERTE SÚBITA! ⚡', 'info', 1200);
      }
    }

    if (!aborted) {
      const s = ctx.s;
      onFinish({
        won: winner(s) === 'P',
        scoreP: score(s, 'P'),
        scoreC: score(s, 'C'),
        kicksP: [...s.kicks.P],
        kicksC: [...s.kicks.C],
        playerTeam,
        rivalTeam,
        diff,
      });
    }
  }

  function stop() {
    aborted = true;
    pitch.cancelAim();
    powerBar.hide();
  }

  return { el, start, stop };
}
