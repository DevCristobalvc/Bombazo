/** Estadísticas persistentes del jugador (localStorage). */
const KEY = 'bombazo:stats';

const DEFAULTS = { wins: 0, losses: 0, streak: 0, best: 0 };

export function loadStats() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function recordResult(won) {
  const s = loadStats();
  if (won) {
    s.wins += 1;
    s.streak += 1;
    s.best = Math.max(s.best, s.streak);
  } else {
    s.losses += 1;
    s.streak = 0;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sin persistencia */
  }
  return s;
}
