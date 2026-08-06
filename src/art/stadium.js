/**
 * Escena del estadio (SVG vertical 360×560), dibujada sobre la geometría
 * de core/zones. Vista desde el punto penal: cielo nocturno con reflectores,
 * tribuna en dos anillos, valla, arco con red y césped segado.
 * Anclajes: #keeper, #ball, #shooter, #wall, #dive-reticle, #aim-line, #aim-dot.
 */
import { keeperSVG, shooterSVG } from './players.js';
import { ballArt } from './ball.js';

/** Banco de reflectores + halo cálido. cx = centro del poste. */
function floodlight(cx) {
  const lamps = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    lamps.push(`<circle cx="${cx - 15 + c * 10}" cy="${15 + r * 9}" r="3" fill="#fff6cf"/>`);
  }
  return `
    <g class="floodlight">
      <ellipse cx="${cx}" cy="24" rx="66" ry="40" fill="url(#g-flood)"/>
      <rect x="${cx - 3}" y="30" width="6" height="104" fill="#0b1330"/>
      <rect x="${cx - 22}" y="6" width="44" height="26" rx="5" fill="#0c1533" stroke="#1d2a55" stroke-width="1.5"/>
      ${lamps.join('')}
    </g>`;
}

export function sceneSVG() {
  return `
  <svg id="scene" class="scene" viewBox="0 0 360 560" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#04081a"/>
        <stop offset="1" stop-color="#122a63"/>
      </linearGradient>
      <linearGradient id="g-grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3aab4d"/>
        <stop offset="1" stop-color="#136128"/>
      </linearGradient>
      <linearGradient id="g-stand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0e1636"/>
        <stop offset="1" stop-color="#1a244a"/>
      </linearGradient>
      <radialGradient id="g-flood" cx=".5" cy=".4" r=".6">
        <stop offset="0" stop-color="#fff4cf" stop-opacity=".5"/>
        <stop offset="1" stop-color="#fff4cf" stop-opacity="0"/>
      </radialGradient>
      <pattern id="p-crowd" width="13" height="9" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.7" fill="#9fb0e0" opacity=".55"/>
        <circle cx="9" cy="7" r="1.7" fill="#ffd166" opacity=".42"/>
        <circle cx="6" cy="1" r="1.5" fill="#ef767a" opacity=".38"/>
        <circle cx="12" cy="2" r="1.5" fill="#7bdff2" opacity=".38"/>
      </pattern>
      <pattern id="p-net" width="9" height="9" patternUnits="userSpaceOnUse">
        <path d="M0 0 H9 M0 0 V9" stroke="rgba(255,255,255,.22)" stroke-width=".8"/>
      </pattern>
      <radialGradient id="g-vignette" cx=".5" cy=".4" r=".85">
        <stop offset=".62" stop-color="#000000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity=".34"/>
      </radialGradient>
      <!-- Luz de estadio desde arriba-izquierda: da volumen a los personajes -->
      <linearGradient id="g-shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".18"/>
        <stop offset=".5" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity=".24"/>
      </linearGradient>
      <radialGradient id="g-ball3d" cx=".35" cy=".3" r=".9">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".9"/>
        <stop offset=".45" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity=".3"/>
      </radialGradient>
      <radialGradient id="g-netpunch" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".85"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- cielo -->
    <rect x="0" y="0" width="360" height="134" fill="url(#g-sky)"/>
    <g class="stars-a" fill="#fffbe0">
      <circle cx="60" cy="30" r="1.2"/><circle cx="230" cy="22" r="1.2"/>
      <circle cx="180" cy="44" r="1.1"/><circle cx="40" cy="80" r="1.1"/>
    </g>
    <g class="stars-b" fill="#fffbe0">
      <circle cx="120" cy="14" r="1.4"/><circle cx="290" cy="38" r="1.4"/>
      <circle cx="330" cy="70" r="1.2"/>
    </g>
    ${floodlight(50)}${floodlight(310)}

    <!-- tribuna en dos anillos -->
    <rect x="0" y="128" width="360" height="204" fill="url(#g-stand)"/>
    <rect class="crowd-dots" x="0" y="132" width="360" height="92" fill="url(#p-crowd)"/>
    <rect x="0" y="224" width="360" height="4" fill="#0a1230" opacity=".8"/>
    <rect class="crowd-dots" x="0" y="230" width="360" height="102" fill="url(#p-crowd)"/>
    <!-- tifos de color -->
    <g opacity=".5">
      <rect x="18" y="150" width="46" height="16" rx="3" fill="#ffd100"/>
      <rect x="150" y="146" width="60" height="16" rx="3" fill="#e63946"/>
      <rect x="286" y="152" width="52" height="16" rx="3" fill="#2a9d8f"/>
    </g>
    <rect x="0" y="124" width="360" height="6" fill="#26356a"/>

    <!-- valla publicitaria (marquesina) -->
    <rect x="0" y="332" width="360" height="40" fill="#0d3b66"/>
    <rect x="0" y="332" width="360" height="4" fill="#1e63a0"/>
    <text class="adtext" x="-30" y="360" font-family="'Luckiest Guy', 'Arial Black', sans-serif" font-size="22" fill="#ffd100" letter-spacing="4">★ BOMBAZO ★ BOMBAZO ★ BOMBAZO ★</text>

    <!-- césped con franjas segadas -->
    <rect x="0" y="372" width="360" height="188" fill="url(#g-grass)"/>
    <g fill="#ffffff" opacity=".05">
      <rect x="0" y="384" width="360" height="20"/>
      <rect x="0" y="424" width="360" height="24"/>
      <rect x="0" y="472" width="360" height="28"/>
      <rect x="0" y="524" width="360" height="34"/>
    </g>
    <!-- línea de gol + marcas del área grande -->
    <rect x="0" y="370" width="360" height="4" fill="#eef2f8" opacity=".9"/>
    <g stroke="#eef2f8" stroke-width="3" opacity=".5" fill="none" stroke-linecap="round">
      <path d="M18 560 L60 374"/>
      <path d="M342 560 L300 374"/>
      <path d="M96 442 Q180 492 264 442"/>
    </g>
    <ellipse cx="180" cy="466" rx="7" ry="3" fill="#eef2f8" opacity=".9"/>

    <!-- red y arco (red translúcida con profundidad superior) -->
    <rect class="goal-net" x="60" y="152" width="240" height="220" fill="#0a1024" opacity=".28"/>
    <rect class="goal-net" x="60" y="152" width="240" height="220" fill="url(#p-net)"/>
    <g stroke="rgba(255,255,255,.18)" stroke-width="1.5" fill="none">
      <path d="M60 152 L86 176 M300 152 L274 176 M180 152 L180 176"/>
      <path d="M86 176 H274"/>
    </g>
    <!-- postes y travesaño con brillo -->
    <rect x="52" y="146" width="9" height="228" rx="3" fill="#f4f6fb"/>
    <rect x="299" y="146" width="9" height="228" rx="3" fill="#f4f6fb"/>
    <rect x="52" y="146" width="256" height="9" rx="3" fill="#f4f6fb"/>
    <g fill="#ffffff" opacity=".6">
      <rect x="53.5" y="147" width="2.4" height="226" rx="1"/>
      <rect x="53.5" y="147" width="253" height="2.4" rx="1"/>
    </g>

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
    <ellipse id="keeper-shadow" cx="180" cy="374" rx="21" ry="5" fill="rgba(0,0,0,.3)" pointer-events="none"/>
    <g transform="translate(180 371)"><g id="keeper">${keeperSVG()}</g></g>
    <ellipse id="shooter-shadow" cx="126" cy="556" rx="24" ry="5.5" fill="rgba(0,0,0,.3)" pointer-events="none"/>
    <g transform="translate(126 556) scale(.66)"><g id="shooter">${shooterSVG()}</g></g>
    <ellipse id="ball-shadow" cx="180" cy="472" rx="11" ry="3.6" fill="rgba(0,0,0,.34)" pointer-events="none"/>
    <g transform="translate(180 462)"><g id="ball">${ballArt(11)}</g></g>

    <!-- viñeta de profundidad -->
    <rect x="0" y="0" width="360" height="560" fill="url(#g-vignette)" pointer-events="none"/>

    <!-- retícula de estirada: marca el punto al que se lanzará el arquero -->
    <g id="dive-reticle" opacity="0" pointer-events="none">
      <circle r="17" fill="none" stroke="#33e0a1" stroke-width="2.5" stroke-dasharray="4 5"/>
      <circle r="3.2" fill="#33e0a1"/>
      <path d="M-24 0 h10 M14 0 h10 M0 -24 v10 M0 14 v10" stroke="#33e0a1" stroke-width="2.5" stroke-linecap="round"/>
    </g>

    <!-- guía del swipe: trayectoria proyectada + punto de mira -->
    <path id="aim-line" fill="none" stroke="#ffd100" stroke-width="2.5" stroke-dasharray="6 7" opacity="0" pointer-events="none" stroke-linecap="round"/>
    <circle id="aim-dot" r="7" fill="none" stroke="#ffd100" stroke-width="2.5" stroke-dasharray="4 5" opacity="0" pointer-events="none"/>
  </svg>`;
}
