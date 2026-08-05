/** Preferencias del jugador que no son de perfil (accesibilidad/UX). */
const RM_KEY = 'bombazo:reduceMotion';

export function reduceMotionEnabled() {
  try {
    return localStorage.getItem(RM_KEY) === '1';
  } catch {
    return false;
  }
}

/** Aplica (o quita) la clase que desactiva animaciones decorativas. */
export function applyReduceMotion(on = reduceMotionEnabled()) {
  document.documentElement.classList.toggle('reduce-motion', on);
}

export function setReduceMotion(on) {
  try {
    localStorage.setItem(RM_KEY, on ? '1' : '0');
  } catch { /* sin persistencia */ }
  applyReduceMotion(on);
}

/** Borra todo el progreso local (stats + perfil). */
export function resetProgress() {
  try {
    localStorage.removeItem('bombazo:stats');
    localStorage.removeItem('bombazo:profile');
  } catch { /* sin persistencia */ }
}
