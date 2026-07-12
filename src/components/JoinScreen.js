/**
 * Pantalla de invitación: quien escanea el QR cae aquí, elige su selección
 * y se une al duelo del anfitrión.
 */
import { TEAMS, teamById } from '../data/teams.js';
import { flagSVG } from '../art/flags.js';
import { heroSVG } from '../art/players.js';
import { icon } from '../art/icons.js';
import { fromHTML } from '../utils/dom.js';
import './JoinScreen.css';

export function createJoinScreen({ onJoin, onCancel }) {
  const state = { teamId: 'col', code: '' };

  const el = fromHTML(`
    <section class="screen join-screen">
      <div class="hero join-hero" data-ref="hero"></div>
      <div class="panel join-card">
        <h2 class="lobby-title">${icon('versus', 22)} TE RETARON A UN DUELO</h2>
        <p class="join-code">Sala <b data-ref="code"></b></p>
        <h3 class="panel-title">Tu selección</h3>
        <div class="chips two-rows" data-ref="teams"></div>
        <button class="btn-big" data-ref="join">UNIRSE AL DUELO</button>
        <p class="lobby-status" data-ref="status"></p>
        <button class="btn-ghost join-cancel" data-ref="cancel">Salir al menú</button>
      </div>
    </section>`);

  const refs = {};
  el.querySelectorAll('[data-ref]').forEach((node) => {
    refs[node.dataset.ref] = node;
  });

  function render() {
    refs.teams.innerHTML = TEAMS.map(
      (t) => `<button class="chip ${t.id === state.teamId ? 'is-selected' : ''}" data-id="${t.id}">
        ${flagSVG(t.id, 26, 17)} ${t.name}
      </button>`
    ).join('');
    refs.hero.innerHTML = heroSVG(teamById(state.teamId));
    refs.code.textContent = state.code.toUpperCase();
  }

  refs.teams.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.teamId = chip.dataset.id;
    render();
  });

  refs.join.addEventListener('click', () => {
    refs.join.disabled = true;
    setStatus('Conectando con el anfitrión…');
    onJoin({ teamId: state.teamId, code: state.code });
  });

  refs.cancel.addEventListener('click', () => onCancel());

  function setStatus(text) {
    refs.status.textContent = text;
  }

  function open(code) {
    state.code = code;
    refs.join.disabled = false;
    setStatus('');
    render();
  }

  return { el, open, setStatus };
}
