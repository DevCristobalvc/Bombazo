/**
 * Pantalla de menú: héroe con la camiseta viva, modo de juego, selección
 * de equipo, rival y dificultad. Emite onPlay({ mode, teamId, rivalId, diff }).
 */
import { TEAMS, DIFFICULTIES, teamById } from '../data/teams.js';
import { heroSVG } from '../art/players.js';
import { flagSVG } from '../art/flags.js';
import { logoSVG } from '../art/logo.js';
import { icon, flames } from '../art/icons.js';
import { loadStats, rankFor } from '../core/stats.js';
import { loadProfile, saveProfile, SKINS, HAIRS, NUMBERS, HAIRSTYLES } from '../core/profile.js';
import { exportCode, importCode } from '../core/account.js';
import { isConfigured, getSession, signInWithGoogle, signOut, fetchLeaderboard } from '../net/cloud.js';
import { isMuted, setMuted } from '../audio/sfx.js';
import { reduceMotionEnabled, setReduceMotion, resetProgress } from '../core/settings.js';
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
      <div class="menu-quick">
        <button class="rank-open" data-ref="statsBtn" type="button">📊 Mis estadísticas</button>
        <button class="rank-open" data-ref="rankBtn" type="button">🏆 Ranking global</button>
        <button class="rank-open" data-ref="settingsBtn" type="button">⚙ Ajustes</button>
      </div>
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
        <details class="customizer">
          <summary class="panel-title">Tu jugador <span class="cz-hint">personalizar ▾</span></summary>
          <div class="profile-row">
            <div class="dot-picker" data-ref="skins" title="Tono de piel"></div>
            <div class="dot-picker" data-ref="hairs" title="Color de pelo"></div>
          </div>
          <div class="chips" data-ref="styles"></div>
          <div class="chips" data-ref="numbers"></div>
          <input class="name-input" data-ref="name" maxlength="10" placeholder="TU NOMBRE EN LA CAMISETA" autocomplete="off" spellcheck="false">
        </details>
        <details class="account">
          <summary class="panel-title">Guardar / cargar perfil <span class="cz-hint">respaldo ▾</span></summary>
          <p class="account-hint">Copia tu código para respaldar o pasar de teléfono. Pega uno y cárgalo.</p>
          <div class="account-row">
            <input class="name-input account-code" data-ref="exportField" readonly>
            <button class="btn-ghost" data-ref="copyBtn" type="button">Copiar</button>
          </div>
          <div class="account-row">
            <input class="name-input account-code" data-ref="importField" placeholder="PEGA UN CÓDIGO" autocomplete="off" spellcheck="false">
            <button class="btn-ghost" data-ref="loadBtn" type="button">Cargar</button>
          </div>
          <div class="account-row">
            <button class="btn-ghost" data-ref="downloadBtn" type="button">⬇ Descargar respaldo</button>
            <button class="btn-ghost" data-ref="fileBtn" type="button">📂 Cargar archivo</button>
            <input type="file" data-ref="fileInput" accept=".txt,.json,text/plain" hidden>
          </div>
          <p class="account-msg" data-ref="accountMsg"></p>
        </details>
        <p class="howto"><b>Desliza</b> desde el balón hacia el arco para rematar — curva el gesto para darle efecto. Para <b>atajar</b>, arrastra a tu arquero a donde crees que va el balón. Empate = muerte súbita.</p>
        <button class="btn-big" data-ref="play">¡A LA CANCHA!</button>
      </div>
      <div class="rank-overlay" data-ref="rankOverlay" hidden>
        <div class="rank-card">
          <button class="rank-close" data-ref="rankClose" type="button" aria-label="Cerrar">✕</button>
          <h2 class="rank-title">🏆 Ranking global</h2>
          <div class="rank-body" data-ref="rankBody"></div>
        </div>
      </div>
      <div class="rank-overlay" data-ref="statsOverlay" hidden>
        <div class="rank-card">
          <button class="rank-close" data-ref="statsClose" type="button" aria-label="Cerrar">✕</button>
          <h2 class="rank-title">📊 Mis estadísticas</h2>
          <div class="rank-body" data-ref="statsBody"></div>
        </div>
      </div>
      <div class="rank-overlay" data-ref="settingsOverlay" hidden>
        <div class="rank-card">
          <button class="rank-close" data-ref="settingsClose" type="button" aria-label="Cerrar">✕</button>
          <h2 class="rank-title">⚙ Ajustes</h2>
          <div class="rank-body" data-ref="settingsBody"></div>
        </div>
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
    const r = rankFor(s.xp);
    const record =
      s.wins + s.losses > 0
        ? `V ${s.wins} · D ${s.losses} · Racha ${s.streak}`
        : 'Nuevo jugador';
    const toNext = r.next ? ` · ${r.next.min - s.xp} pts para ${r.next.name}` : ' · rango máximo';
    refs.stats.innerHTML = `<b>${r.icon} ${r.name}</b> · ${s.xp} pts · ${record}<span class="rank-next">${toNext}</span>`;

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
    if (refs.exportField) refs.exportField.value = exportCode();
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

  /** Ranking global: estados degradados (sin backend / sin login / con login). */
  const esc = (t) => String(t ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  async function renderRank() {
    const box = refs.rankBody;
    if (!box) return;
    if (!isConfigured()) {
      box.innerHTML = '<p class="rank-empty">🏆 El ranking global llega muy pronto.<br>Por ahora tu progreso se guarda en este dispositivo.</p>';
      return;
    }
    box.innerHTML = '<p class="rank-empty">Cargando…</p>';
    let session = null;
    try { session = await getSession(); } catch { /* sin sesión */ }
    if (!session) {
      box.innerHTML = `<p class="rank-empty">Juega sin cuenta cuando quieras. Inicia sesión para competir en el ranking global y no perder tu perfil.</p>
        <button class="btn-big" data-ref="loginBtn" type="button">Iniciar sesión con Google</button>`;
      box.querySelector('[data-ref="loginBtn"]').onclick = () => signInWithGoogle();
      return;
    }
    const rows = await fetchLeaderboard(20);
    const me = (loadProfile().name || '').trim().toUpperCase();
    const list = rows
      .map((r) => `<li class="${(r.name || '').trim().toUpperCase() === me ? 'me' : ''}"><span class="rp">${r.position}</span><span class="rn">${esc(r.name)}</span><span class="rx">${r.xp}</span></li>`)
      .join('');
    box.innerHTML = `<ol class="rank-list">${list || '<p class="rank-empty">Aún no hay puntajes. ¡Sé el primero!</p>'}</ol>
      <button class="btn-ghost" data-ref="logoutBtn" type="button">Cerrar sesión</button>`;
    const out = box.querySelector('[data-ref="logoutBtn"]');
    if (out) out.onclick = async () => { await signOut(); renderRank(); };
  }
  refs.rankBtn?.addEventListener('click', () => { refs.rankOverlay.hidden = false; renderRank(); });
  refs.rankClose?.addEventListener('click', () => { refs.rankOverlay.hidden = true; });
  refs.rankOverlay?.addEventListener('click', (e) => { if (e.target === refs.rankOverlay) refs.rankOverlay.hidden = true; });

  /** Panel de estadísticas de vida del jugador. */
  function renderStatsPanel() {
    const s = loadStats();
    const r = rankFor(s.xp);
    const played = s.matches ?? 0;
    const winPct = played ? Math.round((s.wins / played) * 100) : 0;
    const cell = (label, val) => `<div class="stat-cell"><span class="stat-val">${val}</span><span class="stat-lbl">${label}</span></div>`;
    refs.statsBody.innerHTML = `
      <div class="stat-rank"><b>${r.icon} ${r.name}</b> · ${s.xp} pts</div>
      <div class="stat-grid">
        ${cell('Partidos', played)}
        ${cell('Victorias', s.wins)}
        ${cell('Derrotas', s.losses)}
        ${cell('% Victorias', winPct + '%')}
        ${cell('Mejor racha', s.best)}
        ${cell('Racha actual', s.streak)}
        ${cell('Goles', s.goalsFor ?? 0)}
        ${cell('Atajadas', s.saves ?? 0)}
      </div>`;
  }
  refs.statsBtn?.addEventListener('click', () => { refs.statsOverlay.hidden = false; renderStatsPanel(); });
  refs.statsClose?.addEventListener('click', () => { refs.statsOverlay.hidden = true; });
  refs.statsOverlay?.addEventListener('click', (e) => { if (e.target === refs.statsOverlay) refs.statsOverlay.hidden = true; });

  /** Panel de Ajustes: sonido, reducir movimiento, reiniciar progreso. */
  function renderSettings() {
    const toggle = (on) => (on ? 'ON' : 'OFF');
    refs.settingsBody.innerHTML = `
      <div class="set-row">
        <span>🔊 Sonido</span>
        <button class="set-toggle ${!isMuted() ? 'on' : ''}" data-ref="soundToggle" type="button">${toggle(!isMuted())}</button>
      </div>
      <div class="set-row">
        <span>🌀 Reducir movimiento</span>
        <button class="set-toggle ${reduceMotionEnabled() ? 'on' : ''}" data-ref="motionToggle" type="button">${toggle(reduceMotionEnabled())}</button>
      </div>
      <button class="btn-ghost set-danger" data-ref="resetBtn" type="button">Reiniciar progreso</button>`;
    refs.settingsBody.querySelector('[data-ref="soundToggle"]').onclick = () => { setMuted(!isMuted()); renderSettings(); };
    refs.settingsBody.querySelector('[data-ref="motionToggle"]').onclick = () => { setReduceMotion(!reduceMotionEnabled()); renderSettings(); };
    refs.settingsBody.querySelector('[data-ref="resetBtn"]').onclick = () => {
      if (confirm('¿Borrar todo tu progreso (stats y perfil)? No se puede deshacer.')) {
        resetProgress();
        renderSettings();
        render();
      }
    };
  }
  refs.settingsBtn?.addEventListener('click', () => { refs.settingsOverlay.hidden = false; renderSettings(); });
  refs.settingsClose?.addEventListener('click', () => { refs.settingsOverlay.hidden = true; });
  refs.settingsOverlay?.addEventListener('click', (e) => { if (e.target === refs.settingsOverlay) refs.settingsOverlay.hidden = true; });

  /** Respaldo de perfil: copiar el código propio o cargar uno pegado. */
  const accountMsg = (t) => { if (refs.accountMsg) refs.accountMsg.textContent = t; };
  refs.copyBtn?.addEventListener('click', async () => {
    const code = exportCode();
    refs.exportField.value = code;
    try {
      await navigator.clipboard.writeText(code);
      accountMsg('¡Código copiado!');
    } catch {
      refs.exportField.select?.();
      accountMsg('Selecciona y copia el código');
    }
  });
  const applyImport = (code) => {
    const res = importCode(code);
    if (res.ok) {
      accountMsg('¡Perfil cargado!');
      refs.importField.value = '';
      render();
    } else {
      accountMsg(res.error ?? 'No se pudo cargar');
    }
  };
  refs.loadBtn?.addEventListener('click', () => applyImport(refs.importField.value));

  /** Respaldo como archivo: descargar el código y cargarlo desde un archivo. */
  refs.downloadBtn?.addEventListener('click', () => {
    const blob = new Blob([exportCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bombazo-perfil.txt';
    a.click();
    URL.revokeObjectURL(url);
    accountMsg('Respaldo descargado');
  });
  refs.fileBtn?.addEventListener('click', () => refs.fileInput?.click());
  refs.fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => applyImport(String(reader.result));
    reader.onerror = () => accountMsg('No se pudo leer el archivo');
    reader.readAsText(file);
    e.target.value = '';
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
