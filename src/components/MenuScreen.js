/**
 * Pantalla de menú: héroe con la camiseta viva, modo de juego, selección
 * de equipo, rival y dificultad. Emite onPlay({ mode, teamId, rivalId, diff }).
 */
import { TEAMS, DIFFICULTIES, teamById } from '../data/teams.js';
import { heroSVG } from '../art/players.js';
import { flagSVG } from '../art/flags.js';
import { logoSVG } from '../art/logo.js';
import { icon, flames } from '../art/icons.js';
import { loadStats } from '../core/stats.js';
import { loadProfile, saveProfile, SKINS, HAIRS, NUMBERS, HAIRSTYLES } from '../core/profile.js';
import { fromHTML } from '../utils/dom.js';
import './MenuScreen.css';

const MODES = [
  { id: 'rapido', label: 'Penales', icon: 'bolt' },
  { id: 'corners', label: 'Córners', icon: 'flag' },
  { id: 'libres', label: 'Tiros libres', icon: 'wall' },
  { id: 'torneo', label: 'Torneo', icon: 'trophy' },
  { id: 'duelo', label: '1 vs 1', icon: 'versus' },
  { id: 'local', label: '2 jugadores', icon: 'phone' },
];

const DUEL_MODES = [
  { id: 'penales', label: 'Penales', icon: 'bolt' },
  { id: 'corners', label: 'Córners', icon: 'flag' },
  { id: 'libres', label: 'Tiros libres', icon: 'wall' },
];

export function createMenuScreen({ onPlay }) {
  const state = { mode: 'rapido', duelMode: 'penales', teamId: 'col', rivalId: 'fra', diff: 'medio' };

  const el = fromHTML(`
    <section class="screen menu-screen">
      <h1 class="logo" aria-label="Bombazo">${logoSVG()}</h1>
      <p class="tagline">Tanda de penales · Mundial 2026</p>
      <div class="hero" data-ref="hero"></div>
      <p class="vs-line" data-ref="vs"></p>
      <p class="stats-line" data-ref="stats"></p>
      <div class="heatmap-row" data-ref="heatrow" hidden>
        <span class="heatmap-label">Tu puntería</span>
        <div class="heatmap" data-ref="heat" title="Efectividad por zona del arco"></div>
      </div>
      <div class="panel">
        <h2 class="panel-title">Modo de juego</h2>
        <div class="chips" data-ref="modes"></div>
        <div data-ref="duelBlock">
          <h2 class="panel-title">Disciplina del duelo</h2>
          <div class="chips" data-ref="duelModes"></div>
        </div>
        <h2 class="panel-title">Tu selección</h2>
        <div class="chips two-rows" data-ref="teams"></div>
        <div data-ref="rivalBlock">
          <h2 class="panel-title">Rival</h2>
          <div class="chips two-rows" data-ref="rivals"></div>
        </div>
        <div data-ref="diffBlock">
          <h2 class="panel-title">Dificultad</h2>
          <div class="chips" data-ref="diffs"></div>
        </div>
        <h2 class="panel-title">Tu jugador</h2>
        <div class="profile-row">
          <div class="dot-picker" data-ref="skins" title="Tono de piel"></div>
          <div class="dot-picker" data-ref="hairs" title="Color de pelo"></div>
        </div>
        <div class="chips" data-ref="styles"></div>
        <div class="chips" data-ref="numbers"></div>
        <input class="name-input" data-ref="name" maxlength="10" placeholder="TU NOMBRE EN LA CAMISETA" autocomplete="off" spellcheck="false">
        <button class="btn-big" data-ref="play">¡A LA CANCHA!</button>
        <p class="howto"><b>Desliza</b> desde el balón hacia el arco para rematar — curva el gesto para darle efecto. Para <b>atajar</b>, arrastra a tu arquero a donde crees que va el balón. Empate = muerte súbita.</p>
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

  function renderStats() {
    const s = loadStats();
    refs.stats.textContent =
      s.wins + s.losses > 0
        ? `Victorias ${s.wins} · Derrotas ${s.losses} · Racha ${s.streak} · Récord ${s.best}`
        : '';

    // Mapa de calor: efectividad de tus remates por zona del arco
    const hasShots = s.zones.some((z) => z.shots > 0);
    refs.heatrow.hidden = !hasShots;
    if (!hasShots) return;
    refs.heat.innerHTML = s.zones
      .map((z) => {
        if (!z.shots) return '<i class="heat-cell"></i>';
        const pct = z.goals / z.shots;
        const color = pct >= 0.66 ? '55, 214, 122' : pct >= 0.33 ? '255, 178, 0' : '255, 91, 91';
        const alpha = 0.25 + 0.75 * Math.min(1, z.shots / 6);
        return `<i class="heat-cell" style="background: rgba(${color}, ${alpha})" title="${z.goals}/${z.shots} goles"></i>`;
      })
      .join('');
  }

  function renderProfile() {
    const p = loadProfile();
    refs.skins.innerHTML = SKINS.map(
      (c) => `<button class="dot-swatch ${p.skin === c ? 'is-selected' : ''}" data-kind="skin" data-value="${c}" style="background:${c}" aria-label="Tono de piel"></button>`
    ).join('');
    refs.hairs.innerHTML = HAIRS.map(
      (c) => `<button class="dot-swatch hair ${p.hair === c ? 'is-selected' : ''}" data-kind="hair" data-value="${c}" style="background:${c}" aria-label="Color de pelo"></button>`
    ).join('');
    refs.numbers.innerHTML = NUMBERS.map(
      (n) => `<button class="chip chip-num ${p.number === n ? 'is-selected' : ''}" data-num="${n}">${n}</button>`
    ).join('');
    refs.styles.innerHTML = HAIRSTYLES.map(
      (h) => `<button class="chip ${p.style === h.id ? 'is-selected' : ''}" data-style="${h.id}">${h.label}</button>`
    ).join('');
    if (document.activeElement !== refs.name) refs.name.value = p.name ?? '';
  }

  function render() {
    refs.modes.innerHTML = MODES.map(
      (m) => `<button class="chip ${m.id === state.mode ? 'is-selected' : ''}" data-id="${m.id}">${icon(m.icon, 15)} ${m.label}</button>`
    ).join('');
    refs.teams.innerHTML = TEAMS.map((t) => teamChip(t, t.id === state.teamId, false)).join('');
    refs.rivals.innerHTML = TEAMS.map((t) => teamChip(t, t.id === state.rivalId, t.id === state.teamId)).join('');
    const showRival = ['rapido', 'corners', 'libres', 'local'].includes(state.mode);
    refs.rivalBlock.style.display = showRival ? '' : 'none';
    refs.diffBlock.style.display = state.mode === 'duelo' || state.mode === 'local' ? 'none' : '';
    refs.duelBlock.style.display = state.mode === 'duelo' ? '' : 'none';
    refs.duelModes.innerHTML = DUEL_MODES.map(
      (m) => `<button class="chip ${m.id === state.duelMode ? 'is-selected' : ''}" data-id="${m.id}">${icon(m.icon, 15)} ${m.label}</button>`
    ).join('');
    refs.diffs.innerHTML = DIFFICULTIES.map(
      (d) => `<button class="chip ${d.id === state.diff ? 'is-selected' : ''}" data-id="${d.id}">${flames(d.level)} ${d.label}</button>`
    ).join('');
    refs.hero.innerHTML = heroSVG(teamById(state.teamId), loadProfile());
    const player = teamById(state.teamId);
    const rival = teamById(state.rivalId);
    const diff = DIFFICULTIES.find((d) => d.id === state.diff);
    refs.play.textContent = state.mode === 'duelo' ? 'CREAR SALA' : '¡A LA CANCHA!';
    refs.vs.innerHTML =
      state.mode === 'torneo'
        ? `${player.short} · Torneo: 4 rondas al título · ${diff.label}`
        : state.mode === 'duelo'
          ? `${player.short} · Duelo de ${DUEL_MODES.find((m) => m.id === state.duelMode).label.toLowerCase()} · El rival escanea tu QR`
          : state.mode === 'local'
            ? `${player.short} <i class="vs">VS</i> ${rival.short} · 2 jugadores, un teléfono`
            : state.mode === 'corners'
              ? `${player.short} <i class="vs">VS</i> ${rival.short} · Córners · ${diff.label}`
              : state.mode === 'libres'
                ? `${player.short} <i class="vs">VS</i> ${rival.short} · Tiros libres · ${diff.label}`
                : `${player.short} <i class="vs">VS</i> ${rival.short} · ${diff.label}`;
    renderProfile();
    renderStats();
  }

  /** Personalización: piel, pelo, peinado y dorsal (repetir un color lo devuelve al de la selección). */
  el.addEventListener('click', (e) => {
    const swatch = e.target.closest('.dot-swatch');
    const num = e.target.closest('.chip-num');
    const style = e.target.closest('[data-style]');
    if (!swatch && !num && !style) return;
    const p = loadProfile();
    if (swatch) {
      const { kind, value } = swatch.dataset;
      p[kind] = p[kind] === value ? null : value;
    } else if (num) {
      p.number = Number(num.dataset.num);
    } else {
      p.style = style.dataset.style;
    }
    saveProfile(p);
    render();
  });

  /** Nombre en la camiseta: guarda sin re-renderizar (no pierde el foco). */
  refs.name.addEventListener('input', () => {
    const p = loadProfile();
    p.name = refs.name.value.trim();
    saveProfile(p);
    refs.hero.innerHTML = heroSVG(teamById(state.teamId), p);
  });

  refs.modes.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.mode = chip.dataset.id;
    render();
  });

  refs.duelModes.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.duelMode = chip.dataset.id;
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
  return { el, refresh: renderStats };
}
