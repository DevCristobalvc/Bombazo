/**
 * Geometría lógica del arco y la grilla 3×3, en coordenadas de la escena
 * (viewBox 360×560). Es la fuente de verdad: el arte (art/stadium) y la
 * física (core/physics) dibujan y calculan sobre estos números.
 */
export const GOAL = { left: 60, right: 300, top: 152, bottom: 372 };

export const ZONE_X = [100, 180, 260];
export const ZONE_Y = [189, 262, 335];

export const BALL_HOME = { x: 180, y: 462 };
export const KEEPER_HOME = { x: 180, y: 371 };

export const ZONE_NAMES = [
  'arriba a la izquierda', 'arriba al centro', 'arriba a la derecha',
  'media altura a la izquierda', 'al centro', 'media altura a la derecha',
  'abajo a la izquierda', 'abajo al centro', 'abajo a la derecha',
];

export const zoneCenter = (zone) => ({
  x: ZONE_X[zone % 3],
  y: ZONE_Y[Math.floor(zone / 3)],
});

/** Zona de la grilla donde cae un punto, o null si va afuera del arco. */
export function zoneAt(x, y) {
  if (x < GOAL.left || x > GOAL.right || y < GOAL.top || y > GOAL.bottom) return null;
  const col = Math.min(2, Math.floor(((x - GOAL.left) / (GOAL.right - GOAL.left)) * 3));
  const row = Math.min(2, Math.floor(((y - GOAL.top) / (GOAL.bottom - GOAL.top)) * 3));
  return row * 3 + col;
}

/** Zona más cercana a un punto (para que el arquero "lea" tiros desviados). */
export function zoneNearest(x, y) {
  const cx = Math.min(GOAL.right - 1, Math.max(GOAL.left, x));
  const cy = Math.min(GOAL.bottom - 1, Math.max(GOAL.top, y));
  return zoneAt(cx, cy);
}
