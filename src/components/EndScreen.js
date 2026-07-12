/**
 * Pantalla final: resultado, recap de la tanda y acciones.
 * show(result, opts) acepta variantes (partido rápido, ronda de torneo
 * superada, campeón, eliminado) definidas por quien orquesta (main.js).
 */
import { fromHTML } from '../utils/dom.js';
import { flagSVG } from '../art/flags.js';
import { icon } from '../art/icons.js';
import { pick } from '../utils/random.js';
import { sfx } from '../audio/sfx.js';
import './EndScreen.css';

const WIN_LINES = [
  '¡Qué tanda te mandaste!',
  'La hinchada se queda contigo.',
  'Sangre fría desde los once pasos.',
];
const LOSE_LINES = [
  'Los penales son una lotería… revancha ya.',
  'El fútbol da revanchas. Tócala de nuevo.',
  'Casi casi. La próxima es tuya.',
];

export function createEndScreen({ onAction }) {
  const el = fromHTML(`
    <section class="screen end-screen">
      <div class="panel end-card" data-ref="card"></div>
    </section>`);
  const card = el.querySelector('[data-ref="card"]');

  const recapRow = (kicks) =>
    `<div class="sb-dots">${kicks.map((k) => `<i class="dot ${k ? 'goal' : 'fail'}"></i>`).join('')}</div>`;

  /** Lluvia de confeti con los colores del equipo campeón. */
  function confetti(colors) {
    const layer = fromHTML('<div class="confetti" aria-hidden="true"></div>');
    for (let i = 0; i < 70; i++) {
      const piece = document.createElement('i');
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.9}s`;
      piece.style.animationDuration = `${2.2 + Math.random() * 1.6}s`;
      layer.appendChild(piece);
    }
    el.appendChild(layer);
    setTimeout(() => layer.remove(), 5000);
  }

  function show(result, opts = {}) {
    const { won, playerTeam, rivalTeam } = result;
    const iconName = opts.icon ?? (won ? 'trophy' : 'sadball');
    const iconTone = iconName === 'trophy' ? 'gold' : iconName === 'ticket' ? 'gold' : 'muted';
    const title = opts.title ?? (won ? '¡CAMPEÓN!' : 'ELIMINADO…');
    const sub = opts.sub ?? (won ? pick(WIN_LINES) : pick(LOSE_LINES));
    const primary = opts.primary ?? { act: 'rematch', label: 'REVANCHA' };
    const celebrate = opts.confetti ?? false;

    card.innerHTML = `
      <div class="end-icon ${iconTone}">${icon(iconName, 72)}</div>
      <h2 class="end-title">${title}</h2>
      <div class="end-score">
        ${flagSVG(playerTeam.id, 34, 22)}
        <span>${playerTeam.short}</span>
        <b>${result.scoreP} – ${result.scoreC}</b>
        <span>${rivalTeam.short}</span>
        ${flagSVG(rivalTeam.id, 34, 22)}
      </div>
      <p class="end-sub">${sub}</p>
      <div class="end-recap">
        ${recapRow(result.kicksP)}
        ${recapRow(result.kicksC)}
      </div>
      <div class="end-actions">
        <button class="btn-big" data-act="${primary.act}">${primary.label}</button>
        <button class="btn-ghost" data-act="menu">Menú</button>
      </div>`;

    if (celebrate) {
      sfx.fanfare();
      confetti(['#ffd100', '#ff5c39', '#37d67a', '#ffffff', playerTeam.kit.shirt, playerTeam.kit.accent]);
    } else if (won) {
      sfx.cheer();
    } else {
      sfx.fail();
    }
  }

  card.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    onAction(btn.dataset.act);
  });

  return { el, show };
}
