/**
 * Escena del estadio (SVG vertical 360×560) y geometría de las 9 zonas.
 * Vista desde el punto penal: cielo nocturno, tribuna, valla, arco con red,
 * césped con franjas. Contiene los anclajes #keeper, #ball, #shooter y #zones.
 */
import { keeperSVG, shooterSVG } from './players.js';
import { ballArt } from './ball.js';

export const ZONE_X = [100, 180, 260];
export const ZONE_Y = [189, 262, 335];
export const BALL_HOME = { x: 180, y: 462 };
export const KEEPER_HOME = { x: 180, y: 371 };

export const zoneCenter = (zone) => ({
  x: ZONE_X[zone % 3],
  y: ZONE_Y[Math.floor(zone / 3)],
});

export const ZONE_NAMES = [
  'arriba a la izquierda', 'arriba al centro', 'arriba a la derecha',
  'media altura a la izquierda', 'al centro', 'media altura a la derecha',
  'abajo a la izquierda', 'abajo al centro', 'abajo a la derecha',
];

function zoneRects() {
  let out = '';
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const z = row * 3 + col;
      const x = 60 + col * 80;
      const y = (152 + row * 73.33).toFixed(1);
      out += `<rect class="zone" data-zone="${z}" x="${x}" y="${y}" width="80" height="73.4" rx="6" role="button" aria-label="Zona ${ZONE_NAMES[z]}"><title>${ZONE_NAMES[z]}</title></rect>`;
    }
  }
  return out;
}

export function sceneSVG() {
  return `
  <svg id="scene" class="scene" viewBox="0 0 360 560" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#050b1f"/>
        <stop offset="1" stop-color="#12275c"/>
      </linearGradient>
      <linearGradient id="g-grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2f9e44"/>
        <stop offset="1" stop-color="#17672a"/>
      </linearGradient>
      <pattern id="p-crowd" width="14" height="10" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.6" fill="#8ea2d8" opacity=".55"/>
        <circle cx="10" cy="7" r="1.6" fill="#ffd166" opacity=".4"/>
        <circle cx="7" cy="1" r="1.4" fill="#ef767a" opacity=".35"/>
        <circle cx="13" cy="2" r="1.4" fill="#7bdff2" opacity=".35"/>
      </pattern>
      <pattern id="p-net" width="13" height="13" patternUnits="userSpaceOnUse">
        <path d="M0 0 H13 M0 0 V13" stroke="rgba(255,255,255,.28)" stroke-width="1"/>
      </pattern>
      <radialGradient id="g-vignette" cx=".5" cy=".42" r=".8">
        <stop offset=".68" stop-color="#000000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity=".3"/>
      </radialGradient>
    </defs>

    <!-- cielo y reflectores -->
    <rect x="0" y="0" width="360" height="132" fill="url(#g-sky)"/>
    <circle cx="30" cy="0" r="70" fill="#ffffff" opacity=".05"/>
    <circle cx="330" cy="0" r="70" fill="#ffffff" opacity=".05"/>
    <circle cx="180" cy="-20" r="90" fill="#ffffff" opacity=".03"/>
    <g class="stars-a" fill="#fffbe0">
      <circle cx="60" cy="30" r="1.2"/><circle cx="230" cy="22" r="1.2"/>
      <circle cx="180" cy="44" r="1.1"/><circle cx="40" cy="80" r="1.1"/>
    </g>
    <g class="stars-b" fill="#fffbe0">
      <circle cx="120" cy="14" r="1.4"/><circle cx="290" cy="38" r="1.4"/>
      <circle cx="330" cy="70" r="1.2"/>
    </g>

    <!-- tribuna -->
    <rect x="0" y="128" width="360" height="204" fill="#141d3d"/>
    <rect class="crowd-dots" x="0" y="128" width="360" height="204" fill="url(#p-crowd)"/>
    <rect x="0" y="124" width="360" height="6" fill="#1f2c57"/>

    <!-- valla publicitaria -->
    <rect x="0" y="332" width="360" height="40" fill="#0d3b66"/>
    <text class="adtext" x="-30" y="360" font-family="'Luckiest Guy', 'Arial Black', sans-serif" font-size="22" fill="#ffd100" letter-spacing="4">★ BOMBAZO ★ BOMBAZO ★ BOMBAZO ★</text>

    <!-- césped -->
    <rect x="0" y="372" width="360" height="188" fill="url(#g-grass)"/>
    <g fill="#ffffff" opacity=".05">
      <rect x="0" y="398" width="360" height="26"/>
      <rect x="0" y="450" width="360" height="26"/>
      <rect x="0" y="502" width="360" height="26"/>
    </g>
    <rect x="0" y="370" width="360" height="4" fill="#e8ecf4" opacity=".85"/>
    <path d="M26 560 L64 374 M334 560 L296 374" stroke="#e8ecf4" stroke-width="3" opacity=".5" fill="none"/>
    <ellipse cx="180" cy="466" rx="8" ry="3" fill="#e8ecf4" opacity=".8"/>

    <!-- red y arco -->
    <rect x="60" y="152" width="240" height="220" fill="url(#p-net)"/>
    <path d="M60 152 L84 176 M300 152 L276 176" stroke="rgba(255,255,255,.25)" stroke-width="2"/>
    <rect x="52" y="146" width="9" height="228" rx="3" fill="#f4f6fb"/>
    <rect x="299" y="146" width="9" height="228" rx="3" fill="#f4f6fb"/>
    <rect x="52" y="146" width="256" height="9" rx="3" fill="#f4f6fb"/>

    <!-- actores -->
    <g transform="translate(180 371)"><g id="keeper">${keeperSVG()}</g></g>
    <g transform="translate(126 556) scale(.66)"><g id="shooter">${shooterSVG()}</g></g>
    <g transform="translate(180 462)"><g id="ball">${ballArt(11)}</g></g>

    <!-- viñeta de profundidad -->
    <rect x="0" y="0" width="360" height="560" fill="url(#g-vignette)" pointer-events="none"/>

    <!-- grilla de 9 zonas -->
    <g id="zones">
      <g class="gridlines" stroke="#ffd100" stroke-width="1.5" stroke-dasharray="5 6" fill="none">
        <path d="M140 152 V372 M220 152 V372 M60 225.3 H300 M60 298.7 H300"/>
        <rect x="60" y="152" width="240" height="220" rx="4"/>
      </g>
      ${zoneRects()}
    </g>
  </svg>`;
}
