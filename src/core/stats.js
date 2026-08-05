/** Estadísticas persistentes del jugador (localStorage). */
const KEY = 'bombazo:stats';

const freshZones = () => Array.from({ length: 9 }, () => ({ shots: 0, goals: 0 }));

const DEFAULTS = { wins: 0, losses: 0, streak: 0, best: 0, xp: 0, goalsFor: 0, saves: 0, matches: 0 };

/** Puntos por acción (base del ranking global futuro). */
export const POINTS = { goal: 15, save: 12, win: 120, loss: 30 };

/** Escalafón de rangos por XP acumulada (umbral de entrada, nombre, emoji). */
export const RANKS = [
  { min: 0, name: 'Amateur', icon: '🥉', color: '#cd7f32' },
  { min: 300, name: 'Semipro', icon: '🥈', color: '#c7cdd6' },
  { min: 900, name: 'Profesional', icon: '🥇', color: '#ffd100' },
  { min: 2000, name: 'Crack', icon: '⭐', color: '#37d6c0' },
  { min: 4000, name: 'Estrella', icon: '🌟', color: '#7b8cff' },
  { min: 8000, name: 'Leyenda', icon: '👑', color: '#ff5c39' },
];

/** Rango actual + progreso al siguiente, a partir de la XP. */
export function rankFor(xp = 0) {
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k].min) i = k;
  const cur = RANKS[i];
  const next = RANKS[i + 1] ?? null;
  const progress = next ? (xp - cur.min) / (next.min - cur.min) : 1;
  return { ...cur, index: i, xp, next, progress: Math.min(1, Math.max(0, progress)) };
}

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

/** Suma XP y persiste. Devuelve las stats actualizadas. */
export function awardPoints(n) {
  const s = loadStats();
  s.xp = (s.xp ?? 0) + n;
  save(s);
  return s;
}

/** Registra un remate propio al arco: mapa de calor + puntos por gol. */
export function recordShot(zone, goal) {
  if (zone === null || zone === undefined) return;
  const s = loadStats();
  s.zones[zone].shots += 1;
  if (goal) {
    s.zones[zone].goals += 1;
    s.goalsFor = (s.goalsFor ?? 0) + 1;
    s.xp = (s.xp ?? 0) + POINTS.goal;
  }
  save(s);
}

/** Atajada propia (el rival pateó y lo tapaste): puntos + total de vida. */
export function recordSave() {
  const s = loadStats();
  s.saves = (s.saves ?? 0) + 1;
  s.xp = (s.xp ?? 0) + POINTS.save;
  save(s);
}

export function recordResult(won) {
  const s = loadStats();
  s.matches = (s.matches ?? 0) + 1;
  if (won) {
    s.wins += 1;
    s.streak += 1;
    s.best = Math.max(s.best, s.streak);
    s.xp = (s.xp ?? 0) + POINTS.win;
  } else {
    s.losses += 1;
    s.streak = 0;
    s.xp = (s.xp ?? 0) + POINTS.loss;
  }
  save(s);
  return s;
}
