/**
 * Motor de la tanda de penales — lógica pura, sin DOM.
 * Formato FIFA (IFAB Ley 10.3): 5 tiros alternados, corte anticipado
 * cuando la diferencia es inalcanzable, muerte súbita desde el sexto.
 * Lados: 'P' (jugador humano, patea primero) y 'C' (la máquina).
 */
export const KICKS_REGULATION = 5;

export function createShootout() {
  return {
    kicks: { P: [], C: [] }, // booleans: true = gol
    habits: Array(9).fill(0), // histograma de zonas usadas por el jugador al patear
  };
}

export const score = (s, side) => s.kicks[side].filter(Boolean).length;

export function registerKick(s, side, scored) {
  s.kicks[side].push(scored);
}

export function registerHabit(s, zone) {
  s.habits[zone] += 1;
}

/**
 * Devuelve 'P' | 'C' si la tanda ya tiene ganador, o null si sigue.
 * Cubre corte anticipado en regulación y definición en muerte súbita.
 */
export function winner(s) {
  const kp = s.kicks.P.length;
  const kc = s.kicks.C.length;
  const sp = score(s, 'P');
  const sc = score(s, 'C');

  if (kp <= KICKS_REGULATION && kc <= KICKS_REGULATION) {
    const remP = KICKS_REGULATION - kp;
    const remC = KICKS_REGULATION - kc;
    if (sp > sc + remC) return 'P';
    if (sc > sp + remP) return 'C';
  }

  // Ronda pareja completada (regulación terminada o muerte súbita)
  if (kp === kc && kp >= KICKS_REGULATION && sp !== sc) {
    return sp > sc ? 'P' : 'C';
  }

  return null;
}

export function isSuddenDeath(s) {
  return (
    s.kicks.P.length >= KICKS_REGULATION &&
    s.kicks.C.length >= KICKS_REGULATION &&
    winner(s) === null
  );
}
