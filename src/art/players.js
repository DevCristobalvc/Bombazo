/**
 * Personajes cartoon en SVG.
 * - heroSVG(team): jugador frontal para el menú, colores inline del equipo.
 * - shooterSVG(): pateador de espaldas (en cancha), colores vía CSS vars --sh-*.
 * - keeperSVG(): arquero frontal brazos abiertos, colores vía CSS vars --gk-*.
 * Los sprites de cancha usan origen en los pies (0,0) para posicionarlos con translate.
 */
import { ballArt } from './ball.js';

export function heroSVG(team, profile = {}) {
  const { shirt, accent, shorts, socks } = team.kit;
  const skin = profile.skin ?? team.skin;
  const hair = profile.hair ?? team.hair;
  const number = profile.number ?? 10;
  return `
  <svg viewBox="0 0 220 300" role="img" aria-label="Tu jugador con la camiseta de ${team.name}">
    <ellipse cx="110" cy="286" rx="58" ry="10" fill="rgba(0,0,0,.35)"/>
    <!-- piernas -->
    <rect x="84" y="212" width="17" height="58" rx="8" fill="${socks}"/>
    <rect x="119" y="212" width="17" height="58" rx="8" fill="${socks}"/>
    <rect x="84" y="224" width="17" height="7" fill="${accent}"/>
    <rect x="119" y="224" width="17" height="7" fill="${accent}"/>
    <rect x="76" y="266" width="30" height="14" rx="6" fill="#1c1f26"/>
    <rect x="114" y="266" width="30" height="14" rx="6" fill="#1c1f26"/>
    <!-- pantaloneta -->
    <rect x="76" y="176" width="68" height="42" rx="10" fill="${shorts}" stroke="rgba(8,10,20,.25)" stroke-width="1.5"/>
    <rect x="76" y="182" width="6" height="30" rx="3" fill="${accent}" opacity=".9"/>
    <rect x="138" y="182" width="6" height="30" rx="3" fill="${accent}" opacity=".9"/>
    <!-- torso -->
    <path d="M74 102 L146 102 L140 184 L80 184 Z" fill="${shirt}" stroke="rgba(8,10,20,.25)" stroke-width="1.5"/>
    <path d="M81 178 L139 178 L140 184 L80 184 Z" fill="${accent}" opacity=".85"/>
    <path d="M74 102 L52 138 L68 148 L80 126 Z" fill="${accent}"/>
    <path d="M146 102 L168 138 L152 148 L140 126 Z" fill="${accent}"/>
    <circle cx="58" cy="150" r="8.5" fill="${skin}"/>
    <circle cx="162" cy="150" r="8.5" fill="${skin}"/>
    <path d="M96 102 L110 114 L124 102 Z" fill="${accent}"/>
    <text x="110" y="160" text-anchor="middle" font-size="34" font-weight="900" fill="${accent}" font-family="Nunito, sans-serif">${number}</text>
    <!-- cabeza -->
    <circle cx="110" cy="70" r="30" fill="${skin}" stroke="rgba(8,10,20,.2)" stroke-width="1.5"/>
    <path d="M78 62 Q82 28 110 28 Q138 28 142 62 Q126 42 110 46 Q94 42 78 62 Z" fill="${hair}"/>
    <path d="M92 60 Q95 57 102 58" stroke="#1c1f26" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M118 58 Q125 57 128 60" stroke="#1c1f26" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <circle cx="99" cy="70" r="3.4" fill="#1c1f26"/>
    <circle cx="121" cy="70" r="3.4" fill="#1c1f26"/>
    <circle cx="90" cy="80" r="4" fill="#e58f6f" opacity=".55"/>
    <circle cx="130" cy="80" r="4" fill="#e58f6f" opacity=".55"/>
    <path d="M98 84 Q110 94 122 84" stroke="#8a4b2d" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- balón al pie -->
    <g transform="translate(158,268)">${ballArt(15)}</g>
  </svg>`;
}

export function shooterSVG() {
  return `
  <g class="shooter-art">
    <ellipse cx="0" cy="2" rx="34" ry="7" fill="rgba(0,0,0,.3)"/>
    <rect x="-20" y="-54" width="14" height="48" rx="7" fill="var(--sh-socks)"/>
    <rect x="6" y="-54" width="14" height="48" rx="7" fill="var(--sh-socks)"/>
    <rect x="-20" y="-54" width="14" height="7" rx="3" fill="var(--sh-accent)"/>
    <rect x="6" y="-54" width="14" height="7" rx="3" fill="var(--sh-accent)"/>
    <rect x="-26" y="-10" width="22" height="11" rx="5" fill="#1c1f26"/>
    <rect x="4" y="-10" width="22" height="11" rx="5" fill="#1c1f26"/>
    <rect x="-25" y="-82" width="50" height="32" rx="8" fill="var(--sh-shorts)" stroke="rgba(8,10,20,.25)" stroke-width="1.5"/>
    <path d="M-28 -148 L28 -148 L24 -76 L-24 -76 Z" fill="var(--sh-shirt)" stroke="rgba(8,10,20,.25)" stroke-width="1.5"/>
    <path d="M-24 -81 L24 -81 L24 -76 L-24 -76 Z" fill="var(--sh-accent)" opacity=".85"/>
    <path d="M-28 -148 L-44 -118 L-31 -111 L-23 -132 Z" fill="var(--sh-accent)"/>
    <path d="M28 -148 L44 -118 L31 -111 L23 -132 Z" fill="var(--sh-accent)"/>
    <circle cx="-38" cy="-107" r="6" fill="var(--sh-skin)"/>
    <circle cx="38" cy="-107" r="6" fill="var(--sh-skin)"/>
    <text class="sh-number" x="0" y="-98" text-anchor="middle" font-size="36" font-weight="900" fill="var(--sh-accent)" font-family="Nunito, sans-serif">10</text>
    <circle cx="0" cy="-164" r="17" fill="var(--sh-skin)"/>
    <path d="M-17 -164 a17 17 0 1 1 34 0 q0 9 -17 9 q-17 0 -17 -9 z" fill="var(--sh-hair)"/>
  </g>`;
}

export function keeperSVG() {
  return `
  <g class="keeper-art">
    <rect x="-15" y="-46" width="11" height="40" rx="5" fill="var(--gk-accent)"/>
    <rect x="4" y="-46" width="11" height="40" rx="5" fill="var(--gk-accent)"/>
    <rect x="-19" y="-8" width="17" height="9" rx="4" fill="#1c1f26"/>
    <rect x="2" y="-8" width="17" height="9" rx="4" fill="#1c1f26"/>
    <rect x="-19" y="-66" width="38" height="24" rx="6" fill="#20242e"/>
    <path d="M-22 -112 L22 -112 L18 -62 L-18 -62 Z" fill="var(--gk-shirt)" stroke="rgba(8,10,20,.25)" stroke-width="1.5"/>
    <path d="M-21.7 -107 L21.7 -107 L21.2 -100 L-21.2 -100 Z" fill="var(--gk-accent)" opacity=".8"/>
    <g transform="translate(-20,-104) rotate(-36)">
      <rect x="-38" y="-6" width="40" height="12" rx="6" fill="var(--gk-shirt)"/>
      <circle cx="-42" cy="0" r="8" fill="#f4f6fb" stroke="#c9cedb" stroke-width="1.5"/>
    </g>
    <g transform="translate(20,-104) rotate(36)">
      <rect x="-2" y="-6" width="40" height="12" rx="6" fill="var(--gk-shirt)"/>
      <circle cx="42" cy="0" r="8" fill="#f4f6fb" stroke="#c9cedb" stroke-width="1.5"/>
    </g>
    <text x="0" y="-76" text-anchor="middle" font-size="24" font-weight="900" fill="var(--gk-accent)" font-family="Nunito, sans-serif">1</text>
    <circle cx="0" cy="-127" r="15" fill="var(--gk-skin)"/>
    <path d="M-15 -131 Q-11 -146 0 -146 Q11 -146 15 -131 Q7 -138 0 -136 Q-7 -138 -15 -131 Z" fill="var(--gk-hair)"/>
    <circle cx="-5" cy="-128" r="2.6" fill="#1c1f26"/>
    <circle cx="5" cy="-128" r="2.6" fill="#1c1f26"/>
    <path d="M-4 -118 L4 -118" stroke="#8a4b2d" stroke-width="2.4" stroke-linecap="round"/>
  </g>`;
}
