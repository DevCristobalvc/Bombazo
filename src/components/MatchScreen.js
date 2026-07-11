/**
 * Pantalla de partido: orquesta la tanda completa.
 * Une el motor puro (core/shootout), la IA (core/ai) y los componentes
 * visuales (Pitch, Scoreboard, Announcer) en la secuencia de cada penal.
 */
import { createShootout, registerKick, registerHabit, winner, isSuddenDeath, score } from '../core/shootout.js';
import { keeperPick, shooterPick } from '../core/ai.js';
import { createPitch } from './Pitch.js';
import { createScoreboard } from './Scoreboard.js';
import { createAnnouncer } from './Announcer.js';
import { fromHTML, sleep } from '../utils/dom.js';
import { pick } from '../utils/random.js';
import './MatchScreen.css';

const COPY = {
  goalPlayer: ['¡GOOOOL!', '¡BOMBAZO! 💥', '¡GOLAZO! 🔥', '¡LA CLAVÓ!'],
  savedShot: ['¡ATAJADO! 🧤', '¡TE LA SACÓ!', '¡VOLÓ EL ARQUERO!'],
  playerSave: ['¡ATAJADÓN! 🧤', '¡QUÉ MANOS!', '¡MONUMENTAL!'],
  cpuGoal: ['GOL DEL RIVAL…', 'LA MANDÓ ADENTRO 😖', 'NADA QUE HACER'],
  cpuMiss: ['¡AFUERA! 🎉', '¡A LAS NUBES!', '¡LA TIRÓ A LA TRIBUNA!'],
};

export function createMatchScreen({ onFinish, onExit }) {
  const pitch = createPitch();
  const scoreboard = createScoreboard();
  const announcer = createAnnouncer();

  const el = fromHTML(`
    <section class="screen match-screen">
      <button class="btn-exit" aria-label="Salir al menú">✕</button>
      <div class="phase-msg"><b data-ref="msg"></b><span data-ref="sub"></span></div>
      <div class="pitch-wrap" data-ref="wrap"></div>
    </section>`);

  el.prepend(scoreboard.el);
  const wrap = el.querySelector('[data-ref="wrap"]');
  wrap.append(pitch.el, announcer.el);
  const msgEl = el.querySelector('[data-ref="msg"]');
  const subEl = el.querySelector('[data-ref="sub"]');

  el.querySelector('.btn-exit').addEventListener('click', () => {
    stop();
    onExit();
  });

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
    const gkZone = keeperPick(diff, zone, s.habits);

    await pitch.kickAnim();
    pitch.ballTo(zone);
    pitch.keeperDive(gkZone);
    await sleep(480);

    const goal = zone !== gkZone;
    if (!goal) pitch.ballBounce(zone);
    registerKick(s, 'P', goal);
    updateBoard();
    await announcer.say(pick(goal ? COPY.goalPlayer : COPY.savedShot), goal ? 'goal' : 'miss');
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

    if (!goal && !shot.offTarget) pitch.ballBounce(shot.zone);
    registerKick(s, 'C', goal);
    updateBoard();
    await announcer.say(pick(COPY[copyKey]), goal ? 'miss' : 'save');
    pitch.reset();
    await sleep(350);
  }

  async function start({ playerTeam, rivalTeam, diff }) {
    aborted = false;
    ctx = { s: createShootout(), playerTeam, rivalTeam, diff, phase: 'shoot' };
    pitch.reset();
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
  }

  return { el, start, stop };
}
