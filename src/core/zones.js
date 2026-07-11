/** Geometría lógica de la grilla 3×3 (independiente del dibujo). */
import { pick } from '../utils/random.js';

/** Zona vecina ortogonal al azar: adonde se desvía un tiro mal ejecutado. */
export function adjacentZone(zone) {
  const col = zone % 3;
  const row = Math.floor(zone / 3);
  const options = [];
  if (col > 0) options.push(zone - 1);
  if (col < 2) options.push(zone + 1);
  if (row > 0) options.push(zone - 3);
  if (row < 2) options.push(zone + 3);
  return pick(options);
}
