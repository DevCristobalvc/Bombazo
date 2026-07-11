/**
 * IA rival — dos funciones puras, una por rol.
 * La tabla de comportamiento por dificultad está en idea.md §6.
 */
import { randInt, pick, chance } from '../utils/random.js';

const randZone = () => randInt(9);

/**
 * IA arquera (cuando el jugador patea).
 * - facil: zona uniforme al azar (~11% de atajar).
 * - medio: 35% se lanza a la zona más usada por el jugador (lee costumbres).
 * - imposible: 70% adivina la zona exacta del tiro.
 */
export function keeperPick(diff, playerZone, habits) {
  if (diff === 'imposible') {
    return chance(0.7) ? playerZone : randZone();
  }
  if (diff === 'medio' && chance(0.35)) {
    const max = Math.max(...habits);
    if (max > 0) {
      const favorites = habits
        .map((count, zone) => ({ count, zone }))
        .filter((h) => h.count === max)
        .map((h) => h.zone);
      return pick(favorites);
    }
  }
  return randZone();
}

/**
 * IA pateadora (cuando el jugador ataja). Devuelve { zone, offTarget }.
 * - facil: 15% tiro desviado; 35% patea justo a tu vuelo (regala atajadas).
 * - medio: uniforme; 8% desviado.
 * - imposible: 70% evita deliberadamente tu zona; nunca falla el arco.
 */
export function shooterPick(diff, diveZone) {
  if (diff === 'facil') {
    if (chance(0.15)) return { zone: randZone(), offTarget: true };
    if (chance(0.35)) return { zone: diveZone, offTarget: false };
    return { zone: randZone(), offTarget: false };
  }
  if (diff === 'medio') {
    if (chance(0.08)) return { zone: randZone(), offTarget: true };
    return { zone: randZone(), offTarget: false };
  }
  if (chance(0.7)) {
    let zone;
    do {
      zone = randZone();
    } while (zone === diveZone);
    return { zone, offTarget: false };
  }
  return { zone: randZone(), offTarget: false };
}
