/**
 * Analítica de producto, local y privada (localStorage). Contadores simples
 * para entender qué se juega, tasa de finalización y winrate por dificultad.
 * Pensada para sincronizar a backend después (mismo patrón que submitScore).
 */
const KEY = 'bombazo:analytics';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

function save(a) {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch { /* sin persistencia */ }
}

/** Partido iniciado (por modo). */
export function trackPlay(mode) {
  const a = load();
  a.started = (a.started || 0) + 1;
  a.plays = a.plays || {};
  a.plays[mode] = (a.plays[mode] || 0) + 1;
  save(a);
}

/** Partido terminado (resultado por dificultad). */
export function trackResult(diff, won) {
  const a = load();
  a.finished = (a.finished || 0) + 1;
  a.byDiff = a.byDiff || {};
  const d = a.byDiff[diff] || { w: 0, l: 0 };
  d[won ? 'w' : 'l'] += 1;
  a.byDiff[diff] = d;
  save(a);
}

/** Abandono a mitad de partido. */
export function trackQuit() {
  const a = load();
  a.quits = (a.quits || 0) + 1;
  save(a);
}

/** Resumen legible para UI o sincronización. */
export function analyticsSummary() {
  const a = load();
  const plays = a.plays || {};
  const entries = Object.entries(plays).sort((x, y) => y[1] - x[1]);
  const started = a.started || 0;
  return {
    plays,
    topMode: entries[0]?.[0] ?? null,
    started,
    finished: a.finished || 0,
    quits: a.quits || 0,
    completion: started ? Math.round(((a.finished || 0) / started) * 100) : 0,
    byDiff: a.byDiff || {},
  };
}
