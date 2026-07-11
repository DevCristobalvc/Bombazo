/**
 * Pantalla de menú: héroe con la camiseta viva, selección de equipo,
 * rival y dificultad. Emite onPlay({ teamId, rivalId, diff }).
 */
import { TEAMS, DIFFICULTIES, teamById } from '../data/teams.js';
import { heroSVG } from '../art/players.js';
import { flagSVG } from '../art/flags.js';
import { fromHTML } from '../utils/dom.js';
import './MenuScreen.css';

export function createMenuScreen({ onPlay }) {
  const state = { teamId: 'col', rivalId: 'fra', diff: 'medio' };

  const el = fromHTML(`
    <section class="screen menu-screen">
      <h1 class="logo">BOMBAZO</h1>
      <p class="tagline">Tanda de penales · Octavos del Mundial 2026</p>
      <div class="hero" data-ref="hero"></div>
      <p class="vs-line" data-ref="vs"></p>
      <div class="panel">
        <h2 class="panel-title">Tu selección</h2>
        <div class="chips" data-ref="teams"></div>
        <h2 class="panel-title">Rival</h2>
        <div class="chips" data-ref="rivals"></div>
        <h2 class="panel-title">Dificultad</h2>
        <div class="chips" data-ref="diffs"></div>
        <button class="btn-big" data-ref="play">¡A LA CANCHA!</button>
        <p class="howto">5 penales cada uno. Toca una de las 9 casillas del arco para <b>patear</b> o para <b>atajar</b>. Empate = muerte súbita.</p>
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
    refs.teams.innerHTML = TEAMS.map((t) => teamChip(t, t.id === state.teamId, false)).join('');
    refs.rivals.innerHTML = TEAMS.map((t) => teamChip(t, t.id === state.rivalId, t.id === state.teamId)).join('');
    refs.diffs.innerHTML = DIFFICULTIES.map(
      (d) => `<button class="chip ${d.id === state.diff ? 'is-selected' : ''}" data-id="${d.id}">${d.emoji} ${d.label}</button>`
    ).join('');
    refs.hero.innerHTML = heroSVG(teamById(state.teamId));
    const player = teamById(state.teamId);
    const rival = teamById(state.rivalId);
    const diff = DIFFICULTIES.find((d) => d.id === state.diff);
    refs.vs.innerHTML = `${player.short} 🆚 ${rival.short} · ${diff.label} ${diff.emoji}`;
  }

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
