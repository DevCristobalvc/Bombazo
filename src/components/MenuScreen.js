/**
 * Pantalla de menú: héroe con la camiseta viva, selección de equipo,
 * rival y dificultad. Emite onPlay({ teamId, rivalId, diff }).
 */
import { TEAMS, DIFFICULTIES, teamById } from '../data/teams.js';
import { heroSVG } from '../art/players.js';
import { flagSVG } from '../art/flags.js';
import { logoSVG } from '../art/logo.js';
import { fromHTML } from '../utils/dom.js';
import './MenuScreen.css';

const MODES = [
  { id: 'rapido', label: 'Partido rápido', emoji: '⚡' },
  { id: 'torneo', label: 'Torneo', emoji: '🏆' },
];

export function createMenuScreen({ onPlay }) {
  const state = { mode: 'rapido', teamId: 'col', rivalId: 'fra', diff: 'medio' };

  const el = fromHTML(`
    <section class="screen menu-screen">
      <h1 class="logo" aria-label="Bombazo">${logoSVG()}</h1>
      <p class="tagline">Tanda de penales · Mundial 2026</p>
      <div class="hero" data-ref="hero"></div>
      <p class="vs-line" data-ref="vs"></p>
      <div class="panel">
        <h2 class="panel-title">Modo de juego</h2>
        <div class="chips" data-ref="modes"></div>
        <h2 class="panel-title">Tu selección</h2>
        <div class="chips" data-ref="teams"></div>
        <div data-ref="rivalBlock">
          <h2 class="panel-title">Rival</h2>
          <div class="chips" data-ref="rivals"></div>
        </div>
        <h2 class="panel-title">Dificultad</h2>
        <div class="chips" data-ref="diffs"></div>
        <button class="btn-big" data-ref="play">¡A LA CANCHA!</button>
        <p class="howto">Toca una casilla del arco para <b>patear</b> o <b>atajar</b>, y frena la barra en el verde. Empate = muerte súbita.</p>
      </div>
    </section>`);

  const refs = {};
  el.querySelectorAll('[data-ref]').forEach((node) => {
    refs[node.dataset.ref] = node;
  });

  function teamChip(team, selected, disabled) {
    return `<button class="chip ${selected ? 'is-selected' : ''}" data-id="${team.id}" ${disabled ? 'disabled' : ''}>
      ${flagSVG(team.id, 26, 17)} ${team.name}
    </button>`;
  }

  function render() {
    refs.modes.innerHTML = MODES.map(
      (m) => `<button class="chip ${m.id === state.mode ? 'is-selected' : ''}" data-id="${m.id}">${m.emoji} ${m.label}</button>`
    ).join('');
    refs.teams.innerHTML = TEAMS.map((t) => teamChip(t, t.id === state.teamId, false)).join('');
    refs.rivals.innerHTML = TEAMS.map((t) => teamChip(t, t.id === state.rivalId, t.id === state.teamId)).join('');
    refs.rivalBlock.style.display = state.mode === 'torneo' ? 'none' : '';
    refs.diffs.innerHTML = DIFFICULTIES.map(
      (d) => `<button class="chip ${d.id === state.diff ? 'is-selected' : ''}" data-id="${d.id}">${d.emoji} ${d.label}</button>`
    ).join('');
    refs.hero.innerHTML = heroSVG(teamById(state.teamId));
    const player = teamById(state.teamId);
    const rival = teamById(state.rivalId);
    const diff = DIFFICULTIES.find((d) => d.id === state.diff);
    refs.vs.innerHTML =
      state.mode === 'torneo'
        ? `${player.short} · 🏆 4 rondas al título · ${diff.label} ${diff.emoji}`
        : `${player.short} 🆚 ${rival.short} · ${diff.label} ${diff.emoji}`;
  }

  refs.modes.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.mode = chip.dataset.id;
    render();
  });

  refs.teams.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.teamId = chip.dataset.id;
    if (state.rivalId === state.teamId) {
      state.rivalId = TEAMS.find((t) => t.id !== state.teamId).id;
    }
    render();
  });

  refs.rivals.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.disabled) return;
    state.rivalId = chip.dataset.id;
    render();
  });

  refs.diffs.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.diff = chip.dataset.id;
    render();
  });

  refs.play.addEventListener('click', () => onPlay({ ...state }));

  render();
  return { el };
}
