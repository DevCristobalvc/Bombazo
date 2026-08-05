/**
 * Pantalla final: resultado, recap de la tanda y acciones.
 * show(result, opts) acepta variantes (partido rápido, ronda de torneo
 * superada, campeón, eliminado) definidas por quien orquesta (main.js).
 */
import { fromHTML } from '../utils/dom.js';
import { flagSVG } from '../art/flags.js';
import { icon } from '../art/icons.js';
// bracketHTML y setStatus dan soporte a torneo (llave) y duelos (revancha)
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

  /** Llave del torneo: tu camino al título ronda a ronda. */
  const bracketHTML = (bracket) =>
    `<div class="end-bracket">${bracket
      .map(
        (b) => `
        <div class="eb-row ${b.state}">
          <span class="eb-icon">${b.state === 'won' ? icon('check', 13) : b.state === 'lost' ? icon('x', 13) : ''}</span>
          <span class="eb-stage">${b.label}</span>
          <span class="eb-team">${b.team ? `${flagSVG(b.team.id, 24, 16)} ${b.team.short}` : 'Por definir'}</span>
        </div>`
      )
      .join('')}</div>`;

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

  /** Recap de puntaje: puntos ganados, rango actual y barra de progreso. */
  const rankHTML = (result) => {
    const r = result.rank;
    if (!r) return '';
    const up = result.rankUp ? `<div class="end-rankup">${result.rankUp.icon} ¡Subiste a ${result.rankUp.name}!</div>` : '';
    const pts = result.points != null ? `<span class="end-pts">+${result.points} pts</span>` : '';
    const bar = r.next
      ? `<div class="rank-bar"><i style="width:${Math.round(r.progress * 100)}%"></i></div>
         <span class="rank-cap">${r.xp} pts · faltan ${r.next.min - r.xp} para ${r.next.name}</span>`
      : `<span class="rank-cap">Rango máximo · ${r.xp} pts</span>`;
    return `<div class="end-rank">${up}<div class="end-rankline"><b>${r.icon} ${r.name}</b> ${pts}</div>${bar}</div>`;
  };

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
      ${opts.bracket ? bracketHTML(opts.bracket) : ''}
      ${rankHTML(result)}
      <div class="end-actions">
        <button class="btn-big" data-act="${primary.act}">${primary.label}</button>
        <button class="btn-ghost" data-act="menu">Menú</button>
      </div>
      <p class="end-status" data-ref="status"></p>`;

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

  /** Mensaje de estado bajo los botones (ej. "esperando revancha…"). */
  function setStatus(text) {
    const status = card.querySelector('[data-ref="status"]');
    if (status) status.textContent = text;
  }

  return { el, show, setStatus };
}
