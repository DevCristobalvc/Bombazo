/**
 * Menú minimalista: una sola pantalla con desplegables (modo, equipo, rival,
 * dificultad), avatar plano del jugador y un botón Jugar. Lo secundario
 * (personalización, estadísticas, ranking, ajustes, reto del día, respaldo)
 * vive en un menú "Más opciones". Emite onPlay({ mode, teamId, rivalId, diff }).
 */
import { TEAMS, DIFFICULTIES, teamById } from '../data/teams.js';
import { avatarSVG } from '../art/players.js';
import { flagSVG } from '../art/flags.js';
import { loadStats, rankFor } from '../core/stats.js';
import { loadProfile, saveProfile, SKINS, HAIRS, NUMBERS, HAIRSTYLES } from '../core/profile.js';
import { exportCode, importCode } from '../core/account.js';
import { isConfigured, getSession, signInWithGoogle, signOut, fetchLeaderboard } from '../net/cloud.js';
import { isMuted, setMuted } from '../audio/sfx.js';
import { reduceMotionEnabled, setReduceMotion, resetProgress } from '../core/settings.js';
import { initInstallPrompt, promptInstall } from '../core/pwa.js';
import { ACHIEVEMENTS, loadUnlocked } from '../core/achievements.js';
import { dailyConfig, isDoneToday, dailyStreak } from '../core/daily.js';
import { fromHTML } from '../utils/dom.js';
import './MenuScreen.css';

const MODES = [
  { id: 'rapido', label: 'Penales' },
  { id: 'corners', label: 'Córners' },
  { id: 'libres', label: 'Tiros libres' },
  { id: 'torneo', label: 'Torneo' },
  { id: 'duelo', label: '1 vs 1 (online)' },
  { id: 'local', label: '2 jugadores' },
];

const DUEL_MODES = [
  { id: 'penales', label: 'Penales' },
  { id: 'corners', label: 'Córners' },
  { id: 'libres', label: 'Tiros libres' },
];

const opt = (list, sel) => list.map((o) => `<option value="${o.id}" ${o.id === sel ? 'selected' : ''}>${o.label}</option>`).join('');
const teamOpts = (sel) => TEAMS.map((t) => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${t.name}</option>`).join('');

export function createMenuScreen({ onPlay }) {
  const state = { mode: 'rapido', duelMode: 'penales', teamId: 'col', rivalId: 'fra', diff: 'medio' };

  const el = fromHTML(`
    <section class="screen menu-min">
      <header class="mm-head">
        <div class="mm-brand">BOMBAZO</div>
        <button class="mm-more-btn" data-ref="moreBtn" type="button" aria-label="Más opciones">Más</button>
      </header>

      <div class="mm-id">
        <div class="mm-avatar" data-ref="avatar"></div>
        <div class="mm-id-txt">
          <span class="mm-name" data-ref="idName">Jugador</span>
          <span class="mm-rank" data-ref="idRank">Amateur · 0 pts</span>
          <div class="mm-xp"><i data-ref="idXp"></i></div>
        </div>
      </div>

      <div class="mm-form">
        <label class="mm-field"><span>Modo</span>
          <select data-ref="modeSel">${opt(MODES, state.mode)}</select></label>
        <label class="mm-field" data-ref="duelWrap" hidden><span>Disciplina</span>
          <select data-ref="duelSel">${opt(DUEL_MODES, state.duelMode)}</select></label>
        <label class="mm-field"><span>Tu equipo</span>
          <select data-ref="teamSel">${teamOpts(state.teamId)}</select></label>
        <label class="mm-field" data-ref="rivalWrap"><span>Rival</span>
          <select data-ref="rivalSel">${teamOpts(state.rivalId)}</select></label>
        <label class="mm-field" data-ref="diffWrap"><span>Dificultad</span>
          <select data-ref="diffSel">${opt(DIFFICULTIES.map((d) => ({ id: d.id, label: d.label })), state.diff)}</select></label>
      </div>

      <p class="mm-vs" data-ref="vs"></p>
      <button class="mm-play" data-ref="play" type="button">JUGAR</button>

      <div class="mm-overlay" data-ref="moreOverlay" hidden>
        <div class="mm-sheet">
          <button class="mm-close" data-ref="moreClose" type="button" aria-label="Cerrar">✕</button>
          <h2 class="mm-sheet-title">Menú</h2>
          <button class="mm-daily" data-ref="dailyBtn" type="button"></button>
          <div class="mm-links">
            <button data-ref="statsBtn" type="button">Estadísticas</button>
            <button data-ref="rankBtn" type="button">Ranking</button>
            <button data-ref="settingsBtn" type="button">Ajustes</button>
            <button data-ref="installBtn" type="button" hidden>Instalar app</button>
          </div>
          <details class="mm-details">
            <summary>Personalizar jugador</summary>
            <div class="profile-row">
              <div class="dot-picker" data-ref="skins" title="Tono de piel"></div>
              <div class="dot-picker" data-ref="hairs" title="Color de pelo"></div>
            </div>
            <div class="chips" data-ref="styles"></div>
            <div class="chips" data-ref="numbers"></div>
            <input class="name-input" data-ref="name" maxlength="10" placeholder="TU NOMBRE" autocomplete="off" spellcheck="false">
          </details>
          <details class="mm-details">
            <summary>Guardar / cargar perfil</summary>
            <div class="account-row">
              <input class="name-input account-code" data-ref="exportField" readonly>
              <button class="btn-ghost" data-ref="copyBtn" type="button">Copiar</button>
            </div>
            <div class="account-row">
              <input class="name-input account-code" data-ref="importField" placeholder="PEGA UN CÓDIGO" autocomplete="off" spellcheck="false">
              <button class="btn-ghost" data-ref="loadBtn" type="button">Cargar</button>
            </div>
            <div class="account-row">
              <button class="btn-ghost" data-ref="downloadBtn" type="button">Descargar</button>
              <button class="btn-ghost" data-ref="fileBtn" type="button">Cargar archivo</button>
              <input type="file" data-ref="fileInput" accept=".txt,.json,text/plain" hidden>
            </div>
            <p class="account-msg" data-ref="accountMsg"></p>
          </details>
        </div>
      </div>

      <div class="mm-overlay" data-ref="rankOverlay" hidden>
        <div class="mm-sheet">
          <button class="mm-close" data-ref="rankClose" type="button" aria-label="Cerrar">✕</button>
          <h2 class="mm-sheet-title">Ranking global</h2>
          <div class="rank-body" data-ref="rankBody"></div>
        </div>
      </div>
      <div class="mm-overlay" data-ref="statsOverlay" hidden>
        <div class="mm-sheet">
          <button class="mm-close" data-ref="statsClose" type="button" aria-label="Cerrar">✕</button>
          <h2 class="mm-sheet-title">Estadísticas</h2>
          <div class="rank-body" data-ref="statsBody"></div>
        </div>
      </div>
      <div class="mm-overlay" data-ref="settingsOverlay" hidden>
        <div class="mm-sheet">
          <button class="mm-close" data-ref="settingsClose" type="button" aria-label="Cerrar">✕</button>
          <h2 class="mm-sheet-title">Ajustes</h2>
          <div class="rank-body" data-ref="settingsBody"></div>
        </div>
      </div>
    </section>`);

  const refs = {};
  el.querySelectorAll('[data-ref]').forEach((node) => { refs[node.dataset.ref] = node; });

  /* ---------- Render ---------- */

  function renderIdentity() {
    const s = loadStats();
    const r = rankFor(s.xp);
    refs.idName.textContent = loadProfile().name || 'Jugador';
    refs.idRank.textContent = `${r.name} · ${s.xp || 0} pts`;
    refs.idRank.style.color = r.color;
    refs.idXp.style.width = `${Math.round(r.progress * 100)}%`;
    refs.avatar.innerHTML = avatarSVG(teamById(state.teamId), loadProfile());
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
    refs.modeSel.value = state.mode;
    refs.teamSel.value = state.teamId;
    refs.rivalSel.value = state.rivalId;
    refs.diffSel.value = state.diff;
    refs.duelSel.value = state.duelMode;

    const showRival = ['rapido', 'corners', 'libres', 'local'].includes(state.mode);
    refs.rivalWrap.hidden = !showRival;
    refs.diffWrap.hidden = state.mode === 'duelo' || state.mode === 'local';
    refs.duelWrap.hidden = state.mode !== 'duelo';

    const player = teamById(state.teamId);
    const rival = teamById(state.rivalId);
    const diff = DIFFICULTIES.find((d) => d.id === state.diff);
    refs.play.textContent = state.mode === 'duelo' ? 'CREAR SALA' : 'JUGAR';
    const flag = (t) => `<span class="mm-vs-t">${flagSVG(t.id, 22, 15)}<b>${t.short}</b></span>`;
    const vsBadge = '<i class="mm-vs-b">VS</i>';
    refs.vs.innerHTML =
      state.mode === 'torneo'
        ? `${flag(player)}<span class="mm-vs-sub">Torneo a 4 rondas · ${diff.label}</span>`
        : state.mode === 'duelo'
          ? `${flag(player)}<span class="mm-vs-sub">Duelo de ${DUEL_MODES.find((m) => m.id === state.duelMode).label.toLowerCase()} · escanea QR</span>`
          : state.mode === 'local'
            ? `${flag(player)}${vsBadge}${flag(rival)}<span class="mm-vs-sub">2 jugadores, un teléfono</span>`
            : `${flag(player)}${vsBadge}${flag(rival)}<span class="mm-vs-sub">${diff.label}</span>`;

    renderIdentity();
    renderProfile();
    if (refs.exportField) refs.exportField.value = exportCode();
    if (refs.dailyBtn) {
      const dc = dailyConfig(TEAMS);
      const t = teamById(dc.teamId);
      const rv = teamById(dc.rivalId);
      const diffLabel = DIFFICULTIES.find((d) => d.id === dc.diff)?.label ?? dc.diff;
      refs.dailyBtn.classList.toggle('done', isDoneToday());
      refs.dailyBtn.textContent = isDoneToday()
        ? `Reto de hoy · hecho (racha ${dailyStreak()})`
        : `Reto del día · ${t.short} vs ${rv.short} · ${diffLabel}`;
    }
  }

  /* ---------- Desplegables ---------- */

  refs.modeSel.addEventListener('change', () => { state.mode = refs.modeSel.value; render(); });
  refs.duelSel.addEventListener('change', () => { state.duelMode = refs.duelSel.value; render(); });
  refs.diffSel.addEventListener('change', () => { state.diff = refs.diffSel.value; render(); });
  refs.teamSel.addEventListener('change', () => {
    state.teamId = refs.teamSel.value;
    if (state.rivalId === state.teamId) state.rivalId = TEAMS.find((t) => t.id !== state.teamId).id;
    render();
  });
  refs.rivalSel.addEventListener('change', () => {
    state.rivalId = refs.rivalSel.value === state.teamId
      ? (TEAMS.find((t) => t.id !== state.teamId).id)
      : refs.rivalSel.value;
    render();
  });

  refs.play.addEventListener('click', () => onPlay({ ...state }));

  /* ---------- Personalización (delegada) ---------- */

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
    renderProfile();
    renderIdentity();
  });

  refs.name.addEventListener('input', () => {
    const p = loadProfile();
    p.name = refs.name.value.trim();
    saveProfile(p);
    renderIdentity();
  });

  /* ---------- Overlays ---------- */

  const openOverlay = (ov) => { ov.hidden = false; };
  const bindClose = (ov, closeBtn) => {
    closeBtn?.addEventListener('click', () => { ov.hidden = true; });
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.hidden = true; });
  };

  refs.moreBtn.addEventListener('click', () => openOverlay(refs.moreOverlay));
  bindClose(refs.moreOverlay, refs.moreClose);
  bindClose(refs.rankOverlay, refs.rankClose);
  bindClose(refs.statsOverlay, refs.statsClose);
  bindClose(refs.settingsOverlay, refs.settingsClose);

  /* Ranking global (degrada sin backend). */
  const esc = (t) => String(t ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  async function renderRank() {
    const box = refs.rankBody;
    if (!isConfigured()) {
      box.innerHTML = '<p class="rank-empty">El ranking global llega muy pronto. Por ahora tu progreso se guarda en este dispositivo.</p>';
      return;
    }
    box.innerHTML = '<p class="rank-empty">Cargando…</p>';
    let session = null;
    try { session = await getSession(); } catch { /* sin sesión */ }
    if (!session) {
      box.innerHTML = `<p class="rank-empty">Juega sin cuenta cuando quieras. Inicia sesión para competir en el ranking global.</p>
        <button class="mm-play" data-ref="loginBtn" type="button">Iniciar sesión con Google</button>`;
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
    box.querySelector('[data-ref="logoutBtn"]').onclick = async () => { await signOut(); renderRank(); };
  }
  refs.rankBtn.addEventListener('click', () => { openOverlay(refs.rankOverlay); renderRank(); });

  /* Estadísticas de vida + logros. */
  function achievementsHTML() {
    const unlocked = loadUnlocked();
    return ACHIEVEMENTS.map((a) => {
      const done = unlocked.has(a.id);
      return `<div class="ach-item ${done ? 'done' : ''}"><span class="ach-txt"><b>${a.name}</b><span>${a.desc}</span></span><span class="ach-st">${done ? 'Logrado' : 'Bloqueado'}</span></div>`;
    }).join('');
  }
  function renderStatsPanel() {
    const s = loadStats();
    const played = s.matches ?? 0;
    const winPct = played ? Math.round((s.wins / played) * 100) : 0;
    const cell = (label, val) => `<div class="stat-cell"><span class="stat-val">${val}</span><span class="stat-lbl">${label}</span></div>`;
    refs.statsBody.innerHTML = `
      <div class="stat-grid">
        ${cell('Partidos', played)}
        ${cell('Victorias', s.wins)}
        ${cell('Derrotas', s.losses)}
        ${cell('% Victorias', winPct + '%')}
        ${cell('Mejor racha', s.best)}
        ${cell('Goles', s.goalsFor ?? 0)}
        ${cell('Atajadas', s.saves ?? 0)}
        ${cell('Puntos', s.xp ?? 0)}
      </div>
      ${heatmapHTML(s)}
      <h3 class="ach-title">Logros</h3>
      <div class="ach-list">${achievementsHTML()}</div>`;
  }

  /** Mapa de calor de puntería por zona del arco (verde/ámbar/rojo). */
  function heatmapHTML(s) {
    const hasShots = (s.zones || []).some((z) => z.shots > 0);
    if (!hasShots) return '';
    const cells = s.zones.map((z) => {
      if (!z.shots) return '<i class="heat-cell"></i>';
      const pct = z.goals / z.shots;
      const color = pct >= 0.66 ? '55,214,122' : pct >= 0.33 ? '255,178,0' : '255,91,91';
      const alpha = 0.25 + 0.75 * Math.min(1, z.shots / 6);
      return `<i class="heat-cell" style="background:rgba(${color},${alpha})" title="${z.goals}/${z.shots} goles"></i>`;
    }).join('');
    return `<h3 class="ach-title">Tu puntería</h3><div class="heatmap">${cells}</div>`;
  }
  refs.statsBtn.addEventListener('click', () => { openOverlay(refs.statsOverlay); renderStatsPanel(); });

  /* Ajustes. */
  function renderSettings() {
    const t = (on) => (on ? 'ON' : 'OFF');
    refs.settingsBody.innerHTML = `
      <div class="set-row"><span>Sonido</span><button class="set-toggle ${!isMuted() ? 'on' : ''}" data-ref="soundToggle" type="button">${t(!isMuted())}</button></div>
      <div class="set-row"><span>Reducir movimiento</span><button class="set-toggle ${reduceMotionEnabled() ? 'on' : ''}" data-ref="motionToggle" type="button">${t(reduceMotionEnabled())}</button></div>
      <button class="btn-ghost set-danger" data-ref="resetBtn" type="button">Reiniciar progreso</button>`;
    refs.settingsBody.querySelector('[data-ref="soundToggle"]').onclick = () => { setMuted(!isMuted()); renderSettings(); };
    refs.settingsBody.querySelector('[data-ref="motionToggle"]').onclick = () => { setReduceMotion(!reduceMotionEnabled()); renderSettings(); };
    refs.settingsBody.querySelector('[data-ref="resetBtn"]').onclick = () => {
      if (confirm('¿Borrar todo tu progreso (stats y perfil)? No se puede deshacer.')) { resetProgress(); renderSettings(); render(); }
    };
  }
  refs.settingsBtn.addEventListener('click', () => { openOverlay(refs.settingsOverlay); renderSettings(); });

  /* Instalar app. */
  initInstallPrompt((available) => { if (refs.installBtn) refs.installBtn.hidden = !available; });
  refs.installBtn.addEventListener('click', () => promptInstall());

  /* Respaldo de perfil. */
  const accountMsg = (t) => { if (refs.accountMsg) refs.accountMsg.textContent = t; };
  refs.copyBtn.addEventListener('click', async () => {
    const code = exportCode();
    refs.exportField.value = code;
    try { await navigator.clipboard.writeText(code); accountMsg('¡Código copiado!'); }
    catch { refs.exportField.select?.(); accountMsg('Selecciona y copia el código'); }
  });
  const applyImport = (code) => {
    const res = importCode(code);
    if (res.ok) { accountMsg('¡Perfil cargado!'); refs.importField.value = ''; render(); }
    else accountMsg(res.error ?? 'No se pudo cargar');
  };
  refs.loadBtn.addEventListener('click', () => applyImport(refs.importField.value));
  refs.downloadBtn.addEventListener('click', () => {
    const blob = new Blob([exportCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bombazo-perfil.txt'; a.click();
    URL.revokeObjectURL(url);
    accountMsg('Respaldo descargado');
  });
  refs.fileBtn.addEventListener('click', () => refs.fileInput.click());
  refs.fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => applyImport(String(reader.result));
    reader.onerror = () => accountMsg('No se pudo leer el archivo');
    reader.readAsText(file);
    e.target.value = '';
  });

  /* Reto del día. */
  refs.dailyBtn.addEventListener('click', () => {
    const dc = dailyConfig(TEAMS);
    onPlay({ mode: 'rapido', teamId: dc.teamId, rivalId: dc.rivalId, diff: dc.diff, daily: true });
  });

  render();
  return { el, refresh: render };
}
