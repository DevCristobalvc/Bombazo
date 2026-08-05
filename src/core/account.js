/**
 * Cuenta local del jugador: empaqueta perfil + estadísticas (incluida la XP)
 * en un código portable para respaldar, migrar de dispositivo y —a futuro—
 * sincronizar con el backend (P3). Todo local por ahora, sin red.
 */
import { loadProfile, saveProfile } from './profile.js';
import { loadStats } from './stats.js';

const STATS_KEY = 'bombazo:stats';
const VERSION = 1;

/** JSON → texto base64 seguro con Unicode (nombres con acentos/emoji). */
function encode(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function decode(code) {
  return JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
}

/** Código de respaldo de la cuenta (perfil + stats). */
export function exportCode() {
  return encode({ v: VERSION, profile: loadProfile(), stats: loadStats() });
}

/**
 * Carga una cuenta desde un código. Valida forma mínima antes de pisar nada.
 * Devuelve { ok: true } o { ok: false, error }.
 */
export function importCode(code) {
  let data;
  try {
    data = decode(code);
  } catch {
    return { ok: false, error: 'Código ilegible' };
  }
  if (!data || typeof data !== 'object' || !data.profile || !data.stats) {
    return { ok: false, error: 'Código inválido' };
  }
  try {
    saveProfile({ ...loadProfile(), ...data.profile });
    // Guarda stats respetando el shape (loadStats rellena defaults al leer)
    localStorage.setItem(STATS_KEY, JSON.stringify(data.stats));
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo guardar' };
  }
}
