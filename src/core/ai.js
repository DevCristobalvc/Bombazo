/**
 * IA rival — modelo continuo (v2). Ya no razona por zonas: apunta y se lanza
 * a puntos {x,y} de la boca del arco. El resultado lo decide la distancia
 * (core/physics · isSaved), no la coincidencia de casillas.
 * La tabla de comportamiento por dificultad está en idea.md §6.
 */
import { GOAL, zoneCenter } from './zones.js';
import { chance } from '../utils/random.js';

const rand = (a, b) => a + Math.random() * (b - a);
/** Ruido cuasi-gaussiano en [-1.5, 1.5] aprox (suma de uniformes). */
const noise = () => (Math.random() + Math.random() + Math.random() - 1.5);
const clampX = (x) => Math.min(GOAL.right - 8, Math.max(GOAL.left + 8, x));
const clampY = (y) => Math.min(GOAL.bottom - 8, Math.max(GOAL.top + 8, y));
/** Punto uniforme dentro del arco (con margen). */
const anyPoint = () => ({ x: rand(GOAL.left + 14, GOAL.right - 14), y: rand(GOAL.top + 14, GOAL.bottom - 12) });
const jitter = (p, r) => ({ x: clampX(p.x + rand(-r, r)), y: clampY(p.y + rand(-r, r)) });

/**
 * IA arquera (cuando el jugador patea). Devuelve el punto {x,y} al que se
 * lanza. Lee el tiro con un error que encoge con la dificultad:
 * - facil: casi al azar (rara vez llega).
 * - medio: lee con error medio; 35% se sesga a tu punto favorito (costumbres).
 * - imposible: lee casi exacto (ataja mucho).
 */
export function keeperAim(diff, shot, habits) {
  if (diff === 'medio' && chance(0.35)) {
    const fav = favoritePoint(habits);
    if (fav) return jitter(fav, 34);
  }
  const sigma = diff === 'imposible' ? 62 : diff === 'medio' ? 112 : 195;
  return {
    x: clampX(shot.tx + noise() * sigma),
    y: clampY(shot.ty + noise() * sigma * 0.85),
  };
}

/**
 * IA pateadora (cuando el jugador ataja). Ve el punto {x,y} al que ya se lanzó
 * el arquero y devuelve { x, y, offTarget }.
 * - facil: 15% desviado; 35% patea casi encima del arquero (regala atajadas).
 * - medio: uniforme; 8% desviado.
 * - imposible: apunta al rincón opuesto al vuelo del arquero; nunca falla el arco.
 */
export function shooterAim(diff, keeper) {
  const offRate = diff === 'facil' ? 0.15 : diff === 'medio' ? 0.08 : 0;
  if (chance(offRate)) return { ...anyPoint(), offTarget: true };

  if (diff === 'facil' && keeper && chance(0.28)) return { ...jitter(keeper, 26), offTarget: false };

  // Imposible casi siempre clava el rincón opuesto, pero deja una rendija:
  // ~15% de las veces no hace el tiro perfecto y se puede atajar.
  if (diff === 'imposible' && keeper && chance(0.8)) {
    const cx = (GOAL.left + GOAL.right) / 2;
    const cy = (GOAL.top + GOAL.bottom) / 2;
    const x = keeper.x < cx ? rand(GOAL.right - 74, GOAL.right - 14) : rand(GOAL.left + 14, GOAL.left + 74);
    const y = keeper.y < cy ? rand(GOAL.bottom - 72, GOAL.bottom - 16) : rand(GOAL.top + 16, GOAL.top + 72);
    return { x, y, offTarget: false };
  }
  return { ...anyPoint(), offTarget: false };
}

/** Punto central de la zona más repetida por el jugador (lectura de costumbres). */
function favoritePoint(habits) {
  if (!habits) return null;
  const max = Math.max(...habits);
  if (max <= 0) return null;
  const zones = habits.map((count, zone) => ({ count, zone })).filter((h) => h.count === max).map((h) => h.zone);
  return zoneCenter(zones[Math.floor(Math.random() * zones.length)]);
}
