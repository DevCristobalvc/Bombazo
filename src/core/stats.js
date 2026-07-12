/** Estadísticas persistentes del jugador (localStorage). */
const KEY = 'bombazo:stats';

const freshZones = () => Array.from({ length: 9 }, () => ({ shots: 0, goals: 0 }));

const DEFAULTS = { wins: 0, losses: 0, streak: 0, best: 0 };

export function loadStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { ...DEFAULTS, ...parsed, zones: parsed.zones ?? freshZones() };
  } catch {
    return { ...DEFAULTS, zones: freshZones() };
  }
}

const save = (s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sin persistencia */
  }
};

/** Registra un remate propio al arco: alimenta el mapa de calor por zona. */
export function recordShot(zone, goal) {
  if (zone === null || zone === undefined) return;
  const s = loadStats();
  s.zones[zone].shots += 1;
  if (goal) s.zones[zone].goals += 1;
  save(s);
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
  save(s);
  return s;
}
