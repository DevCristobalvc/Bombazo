/**
 * Reto del día: un partido con parámetros deterministas por fecha (mismos para
 * todos ese día). Incentiva volver a diario. Lleva una racha de días jugados.
 * Usa el Date del navegador (disponible en runtime del juego).
 */
const KEY = 'bombazo:daily';

/** Hash FNV-1a de una cadena → entero sin signo. */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayKey = () => keyOf(new Date());
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return keyOf(d);
}

/** Config determinista del reto de hoy a partir de la lista de equipos. */
export function dailyConfig(teams) {
  const h = hashStr(todayKey());
  const teamId = teams[h % teams.length].id;
  let rivalId = teams[Math.floor(h / 7) % teams.length].id;
  if (rivalId === teamId) rivalId = teams[(h + 1) % teams.length].id;
  const diff = ['facil', 'medio', 'imposible'][Math.floor(h / 13) % 3];
  return { teamId, rivalId, diff };
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

export const isDoneToday = () => load().last === todayKey();
export const dailyStreak = () => load().streak || 0;

/** Marca el reto de hoy como jugado y actualiza la racha de días. */
export function markDoneToday() {
  const st = load();
  const t = todayKey();
  if (st.last === t) return { streak: st.streak || 0, already: true };
  const streak = st.last === yesterdayKey() ? (st.streak || 0) + 1 : 1;
  try {
    localStorage.setItem(KEY, JSON.stringify({ last: t, streak }));
  } catch { /* sin persistencia */ }
  return { streak, already: false };
}
