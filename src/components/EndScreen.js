/** Pantalla final: resultado, recap de la tanda, revancha o menú. */
import { fromHTML } from '../utils/dom.js';
import { flagSVG } from '../art/flags.js';
import { pick } from '../utils/random.js';
import './EndScreen.css';

const WIN_LINES = [
  '¡Qué tanda te mandaste! 🎉',
  'La hinchada se queda contigo.',
  '¡A cuartos de final!',
];
const LOSE_LINES = [
  'Los penales son una lotería… revancha ya.',
  'El fútbol da revanchas. Tócala de nuevo.',
  'Casi casi. La próxima es tuya.',
];

export function createEndScreen({ onRematch, onMenu }) {
  const el = fromHTML(`
    <section class="screen end-screen">
      <div class="panel end-card" data-ref="card"></div>
    </section>`);
  const card = el.querySelector('[data-ref="card"]');

  const recapRow = (kicks) =>
    `<div class="sb-dots">${kicks.map((k) => `<i class="dot ${k ? 'goal' : 'fail'}"></i>`).join('')}</div>`;

  function show(result) {
    const { won, playerTeam, rivalTeam } = result;
    card.innerHTML = `
      <div class="end-emoji">${won ? '🏆' : '😭'}</div>
      <h2 class="end-title">${won ? '¡CAMPEÓN!' : 'ELIMINADO…'}</h2>
      <div class="end-score">
        ${flagSVG(playerTeam.id, 34, 22)}
        <span>${playerTeam.short}</span>
        <b>${result.scoreP} – ${result.scoreC}</b>
        <span>${rivalTeam.short}</span>
        ${flagSVG(rivalTeam.id, 34, 22)}
      </div>
      <p class="end-sub">${won ? pick(WIN_LINES) : pick(LOSE_LINES)}</p>
      <div class="end-recap">
        ${recapRow(result.kicksP)}
        ${recapRow(result.kicksC)}
      </div>
      <div class="end-actions">
        <button class="btn-big" data-act="rematch">REVANCHA</button>
        <button class="btn-ghost" data-act="menu">Menú</button>
      </div>`;
  }

  card.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    if (btn.dataset.act === 'rematch') onRematch();
    else onMenu();
  });

  return { el, show };
}
