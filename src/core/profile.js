/**
 * Perfil del jugador: personalización del personaje (piel, pelo, dorsal).
 * skin/hair en null = usar los colores por defecto de la selección elegida.
 */
const KEY = 'bombazo:profile';

const DEFAULTS = { skin: null, hair: null, number: 10 };

export const SKINS = ['#F8D5B0', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#5C3A21'];
export const HAIRS = ['#160D05', '#3B2314', '#6B3A1F', '#C9A227', '#B55239', '#9E9E9E'];
export const NUMBERS = [7, 9, 10, 11, 23, 99];

export function loadProfile() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* sin persistencia */
  }
}
