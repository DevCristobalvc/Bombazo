/**
 * Escena del estadio (SVG vertical 360×560), dibujada sobre la geometría
 * de core/zones. Vista desde el punto penal: cielo nocturno, tribuna, valla,
 * arco con red, césped. Contiene los anclajes #keeper, #ball, #shooter,
 * #zones y #aim-dot.
 */
import { keeperSVG, shooterSVG } from './players.js';
import { ballArt } from './ball.js';
import { ZONE_NAMES } from '../core/zones.js';

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
      <!-- Luz de estadio desde arriba-izquierda: da volumen a los personajes -->
      <linearGradient id="g-shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".16"/>
        <stop offset=".5" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity=".22"/>
      </linearGradient>
      <radialGradient id="g-ball3d" cx=".35" cy=".3" r=".9">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".9"/>
        <stop offset=".45" stop-color="#ffffff" stop-opacity="0"/>
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
    <rect class="goal-net" x="60" y="152" width="240" height="220" fill="url(#p-net)"/>
    <path d="M60 152 L84 176 M300 152 L276 176" stroke="rgba(255,255,255,.25)" stroke-width="2"/>
    <rect x="52" y="146" width="9" height="228" rx="3" fill="#f4f6fb"/>
    <rect x="299" y="146" width="9" height="228" rx="3" fill="#f4f6fb"/>
    <rect x="52" y="146" width="256" height="9" rx="3" fill="#f4f6fb"/>

    <!-- barrera (solo en tiros libres): viste los colores del equipo que defiende -->
    <g id="wall" transform="translate(180 424)">
      ${[-34, 0, 34]
        .map(
          (dx) => `
      <g transform="translate(${dx} 0)"><g class="wall-man">
        <rect x="-9" y="-34" width="18" height="22" rx="5" fill="var(--wl-shirt)" stroke="rgba(8,10,20,.25)" stroke-width="1"/>
        <rect x="-8" y="-13" width="16" height="8" rx="3" fill="var(--wl-shorts)"/>
        <rect x="-7" y="-5" width="5" height="5" fill="var(--wl-socks)"/>
        <rect x="2" y="-5" width="5" height="5" fill="var(--wl-socks)"/>
        <circle cx="0" cy="-41" r="8" fill="var(--wl-skin)"/>
        <path d="M-8 -41 a8 8 0 1 1 16 0 q0 4.5 -8 4.5 q-8 0 -8 -4.5 z" fill="var(--wl-hair)"/>
      </g></g>`
        )
        .join('')}
    </g>

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

    <!-- guía del swipe: trayectoria proyectada + punto de mira -->
    <path id="aim-line" fill="none" stroke="#ffd100" stroke-width="2.5" stroke-dasharray="6 7" opacity="0" pointer-events="none" stroke-linecap="round"/>
    <circle id="aim-dot" r="7" fill="none" stroke="#ffd100" stroke-width="2.5" stroke-dasharray="4 5" opacity="0" pointer-events="none"/>
  </svg>`;
}
