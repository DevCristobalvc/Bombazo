/**
 * Barra de potencia del remate: un marcador barre la pista y el jugador
 * lo frena con un toque. Verde centro = remate perfecto (balón más rápido),
 * amarillo = normal, rojo en los extremos = el tiro puede desviarse o irse afuera.
 * run() resuelve { quality: 'perfect'|'good'|'poor', value } o null si se cancela.
 */
import { fromHTML } from '../utils/dom.js';
import './PowerBar.css';

const SWEEP_MS = 900;

export function createPowerBar() {
  const el = fromHTML(`
    <div class="powerbar" hidden>
      <div class="pb-track"><div class="pb-marker"></div></div>
      <p class="pb-hint">¡TOCA PARA REMATAR!</p>
    </div>`);
  const marker = el.querySelector('.pb-marker');

  let raf = null;
  let pendingResolve = null;

  function run() {
    return new Promise((resolve) => {
      pendingResolve = resolve;
      el.hidden = false;
      const t0 = performance.now();
      let value = 0.5;

      const tick = (now) => {
        const t = (now - t0) / SWEEP_MS;
        value = 1 - Math.abs(1 - (t % 2)); // onda triangular 0→1→0
        marker.style.left = `${value * 100}%`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      const finish = () => {
        cancelAnimationFrame(raf);
        raf = null;
        el.removeEventListener('pointerdown', finish);
        clearTimeout(autoStop);
        const dist = Math.abs(value - 0.5);
        const quality = dist <= 0.12 ? 'perfect' : dist <= 0.4 ? 'good' : 'poor';
        marker.classList.add(quality);
        setTimeout(() => {
          el.hidden = true;
          marker.classList.remove(quality);
          pendingResolve = null;
          resolve({ quality, value });
        }, 240);
      };

      const autoStop = setTimeout(finish, 5000); // si no toca, se remata solo
      el.addEventListener('pointerdown', finish);
    });
  }

  /** Cancela una barra en curso (salida del partido). */
  function hide() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    el.hidden = true;
    if (pendingResolve) {
      const resolve = pendingResolve;
      pendingResolve = null;
      resolve(null);
    }
  }

  return { el, run, hide };
}
