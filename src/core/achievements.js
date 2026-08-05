/**
 * Logros: metas locales que dan objetivos a perseguir (retención). Se evalúan
 * contra las estadísticas de vida (core/stats) al terminar cada partido.
 * Todo en localStorage; futura sincronización con el backend (P3).
 */
const KEY = 'bombazo:achievements';

export const ACHIEVEMENTS = [
  { id: 'first-goal', icon: '⚽', name: 'Primer gol', desc: 'Marca tu primer penal', xp: 20, done: (s) => (s.goalsFor || 0) >= 1 },
  { id: 'first-win', icon: '🏆', name: 'Primera victoria', desc: 'Gana una tanda', xp: 40, done: (s) => (s.wins || 0) >= 1 },
  { id: 'streak5', icon: '🔥', name: 'En racha', desc: 'Gana 5 tandas seguidas', xp: 80, done: (s) => (s.best || 0) >= 5 },
  { id: 'wall', icon: '🧤', name: 'Muralla', desc: 'Ataja 25 penales', xp: 60, done: (s) => (s.saves || 0) >= 25 },
  { id: 'sniper', icon: '🎯', name: 'Francotirador', desc: 'Marca 50 goles', xp: 120, done: (s) => (s.goalsFor || 0) >= 50 },
  { id: 'veteran', icon: '🎖️', name: 'Veterano', desc: 'Juega 25 partidos', xp: 100, done: (s) => (s.matches || 0) >= 25 },
  { id: 'crack', icon: '⭐', name: 'Crack', desc: 'Llega a 2000 puntos', xp: 150, done: (s) => (s.xp || 0) >= 2000 },
  { id: 'legend', icon: '👑', name: 'Leyenda', desc: 'Llega a 8000 puntos', xp: 300, done: (s) => (s.xp || 0) >= 8000 },
];

export function loadUnlocked() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function saveUnlocked(set) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch { /* sin persistencia */ }
}

/** Evalúa los logros contra las stats; desbloquea y devuelve los NUEVOS. */
export function evaluateAchievements(stats) {
  const set = loadUnlocked();
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!set.has(a.id) && a.done(stats)) {
      set.add(a.id);
      fresh.push(a);
    }
  }
  if (fresh.length) saveUnlocked(set);
  return fresh;
}
