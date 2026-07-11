/**
 * Componente Pitch: la escena jugable.
 * Expone una API imperativa para que MatchScreen orqueste cada penal:
 * setKits, pickZone (promesa que resuelve con la zona tocada), animaciones
 * del balón/arquero/pateador y reset.
 */
import { sceneSVG, zoneCenter, BALL_HOME, KEEPER_HOME } from '../art/stadium.js';
import { fromHTML, sleep } from '../utils/dom.js';
import './Pitch.css';

export function createPitch() {
  const el = fromHTML(`<div class="pitch">${sceneSVG()}</div>`);
  const svg = el.querySelector('#scene');
  const keeper = el.querySelector('#keeper');
  const ball = el.querySelector('#ball');

  let resolveZone = null;

  svg.querySelector('#zones').addEventListener('click', (event) => {
    const rect = event.target.closest('.zone');
    if (!rect || !resolveZone) return;
    rect.classList.add('picked');
    svg.classList.remove('aiming');
    const resolve = resolveZone;
    resolveZone = null;
    resolve(Number(rect.dataset.zone));
  });

  /** Viste al pateador y al arquero según la fase (colores vía CSS vars). */
  function setKits({ shooterTeam, keeperTeam }) {
    const s = el.style;
    s.setProperty('--sh-shirt', shooterTeam.kit.shirt);
    s.setProperty('--sh-accent', shooterTeam.kit.accent);
    s.setProperty('--sh-shorts', shooterTeam.kit.shorts);
    s.setProperty('--sh-socks', shooterTeam.kit.socks);
    s.setProperty('--sh-skin', shooterTeam.skin);
    s.setProperty('--sh-hair', shooterTeam.hair);
    s.setProperty('--gk-shirt', keeperTeam.gk.shirt);
    s.setProperty('--gk-accent', keeperTeam.gk.accent);
    s.setProperty('--gk-skin', keeperTeam.skin);
    s.setProperty('--gk-hair', keeperTeam.hair);
  }

  /** Activa la grilla y espera el toque. Resuelve null si se cancela. */
  function pickZone() {
    return new Promise((resolve) => {
      svg.classList.add('aiming');
      resolveZone = resolve;
    });
  }

  function cancelAim() {
    svg.classList.remove('aiming');
    if (resolveZone) {
      const resolve = resolveZone;
      resolveZone = null;
      resolve(null);
    }
  }

  function keeperDive(zone) {
    const c = zoneCenter(zone);
    const col = zone % 3;
    const row = Math.floor(zone / 3);
    const dx = (c.x - KEEPER_HOME.x) * 0.92;
    const dy = row === 0 ? -66 : row === 1 ? -30 : -2;
    const angle = col === 0 ? -55 : col === 2 ? 55 : 0;
    keeper.style.transform = `translate(${dx}px, ${dy}px) rotate(${angle}deg)`;
  }

  function ballTo(zone) {
    const c = zoneCenter(zone);
    ball.style.transform = `translate(${c.x - BALL_HOME.x}px, ${c.y - BALL_HOME.y}px) scale(.6)`;
  }

  /** Rebote tras la atajada. */
  function ballBounce(zone) {
    const c = zoneCenter(zone);
    ball.style.transform = `translate(${(c.x - BALL_HOME.x) * 0.55}px, -46px) scale(.85)`;
  }

  /** Tiro desviado: por encima del travesaño. */
  function ballOver(zone) {
    const c = zoneCenter(zone);
    ball.style.transform = `translate(${c.x - BALL_HOME.x}px, ${96 - BALL_HOME.y}px) scale(.45)`;
  }

  async function kickAnim() {
    svg.classList.add('kick');
    await sleep(220);
  }

  /** La tribuna salta un instante (goles propios, atajadas heroicas). */
  function celebrate() {
    svg.classList.add('celebrate');
    setTimeout(() => svg.classList.remove('celebrate'), 1100);
  }

  function reset() {
    svg.classList.remove('kick');
    keeper.style.transform = '';
    ball.style.transform = '';
    svg.querySelectorAll('.zone.picked').forEach((r) => r.classList.remove('picked'));
  }

  return { el, setKits, pickZone, cancelAim, keeperDive, ballTo, ballBounce, ballOver, kickAnim, celebrate, reset };
}
