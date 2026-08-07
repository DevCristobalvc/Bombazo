/**
 * Personajes cartoon en SVG.
 * - heroSVG(team): jugador frontal para el menú, colores inline del equipo.
 * - shooterSVG(): pateador de espaldas (en cancha), colores vía CSS vars --sh-*.
 * - keeperSVG(): arquero frontal brazos abiertos, colores vía CSS vars --gk-*.
 * Los sprites de cancha usan origen en los pies (0,0) para posicionarlos con translate.
 */
import { ballArt } from './ball.js';

/** Peinados — vista frontal (héroe del menú), cabeza en (110, 70) r=30. */
const HAIR_FRONT = {
  clasico: (c) => `<path d="M78 62 Q82 28 110 28 Q138 28 142 62 Q126 42 110 46 Q94 42 78 62 Z" fill="${c}"/>`,
  rapado: (c) => `<path d="M82 54 A30 30 0 0 1 138 54 Q124 44 110 46 Q96 44 82 54 Z" fill="${c}"/>`,
  afro: (c) => `<circle cx="110" cy="46" r="26" fill="${c}"/><circle cx="89" cy="57" r="12" fill="${c}"/><circle cx="131" cy="57" r="12" fill="${c}"/>`,
  punk: (c) => `<path d="M82 56 A30 30 0 0 1 138 56 Q124 46 110 48 Q96 46 82 56 Z" fill="${c}"/><path d="M100 46 L104 24 L108 43 L112 22 L116 43 L120 26 L123 47 Q110 41 100 46 Z" fill="${c}"/>`,
};

/** Peinados — vista de espaldas (pateador en cancha), cabeza en (0, -164) r=17. */
const HAIR_BACK = {
  clasico: (c) => `<path d="M-17 -164 a17 17 0 1 1 34 0 q0 9 -17 9 q-17 0 -17 -9 z" fill="${c}"/>`,
  rapado: (c) => `<path d="M-17 -164 a17 17 0 1 1 34 0 q0 3 -17 3 q-17 0 -17 -3 z" fill="${c}"/>`,
  afro: (c) => `<circle cx="0" cy="-166" r="21" fill="${c}"/>`,
  punk: (c) => `<path d="M-17 -164 a17 17 0 1 1 34 0 q0 3 -17 3 q-17 0 -17 -3 z" fill="${c}"/><path d="M-6 -177 L-3 -193 L0 -178 L3 -194 L6 -177 Z" fill="${c}"/>`,
};

export function heroSVG(team, profile = {}) {
  const { shirt, accent, shorts, socks } = team.kit;
  const skin = profile.skin ?? team.skin;
  const hair = profile.hair ?? team.hair;
  const number = profile.number ?? 10;
  const hairFront = (HAIR_FRONT[profile.style] ?? HAIR_FRONT.clasico)(hair);
  return `
  <svg viewBox="0 0 220 300" role="img" aria-label="Tu jugador con la camiseta de ${team.name}">
    <defs>
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
    ${hairFront}
    <path d="M92 60 Q95 57 102 58" stroke="#1c1f26" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M118 58 Q125 57 128 60" stroke="#1c1f26" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <circle cx="99" cy="70" r="3.4" fill="#1c1f26"/>
    <circle cx="121" cy="70" r="3.4" fill="#1c1f26"/>
    <circle cx="90" cy="80" r="4" fill="#e58f6f" opacity=".55"/>
    <circle cx="130" cy="80" r="4" fill="#e58f6f" opacity=".55"/>
    <path d="M98 84 Q110 94 122 84" stroke="#8a4b2d" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- volumen: luz de estadio sobre torso y cabeza -->
    <path d="M74 102 L146 102 L140 184 L80 184 Z" fill="url(#g-shade)"/>
    <circle cx="110" cy="70" r="30" fill="url(#g-shade)"/>
    <!-- balón al pie -->
    <g transform="translate(158,268)">${ballArt(15)}</g>
  </svg>`;
}

/** Avatar de perfil (menú): busto enmarcado, estilo flat profesional. Usa los
 *  colores del equipo y del perfil (piel/pelo/dorsal). Limpio, con profundidad
 *  sutil por gradiente, sin caricatura. */
export function avatarSVG(team, profile = {}) {
  const { shirt, accent } = team.kit;
  const skin = profile.skin ?? team.skin;
  const hair = profile.hair ?? team.hair;
  const number = profile.number ?? 10;
  // ids únicos por combinación piel/pelo para que los gradientes no colisionen
  // si hay varios avatares en la página.
  const uid = `${(skin || '#000').slice(1)}${(hair || '#000').slice(1)}`;
  return `
  <svg viewBox="0 0 120 120" class="avatar-svg" role="img" aria-label="Tu jugador">
    <defs>
      <radialGradient id="av-bg-${uid}" cx=".5" cy=".32" r=".85">
        <stop offset="0" stop-color="#26407e"/>
        <stop offset=".6" stop-color="#152a44"/>
        <stop offset="1" stop-color="#080f22"/>
      </radialGradient>
      <radialGradient id="av-skin-${uid}" cx=".38" cy=".34" r=".75">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".28"/>
        <stop offset=".5" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity=".34"/>
      </radialGradient>
      <linearGradient id="av-shirt-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".18"/>
        <stop offset=".45" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity=".3"/>
      </linearGradient>
      <linearGradient id="av-hair-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".32"/>
        <stop offset=".6" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity=".28"/>
      </linearGradient>
      <radialGradient id="av-vig-${uid}" cx=".5" cy=".42" r=".72">
        <stop offset=".5" stop-color="#000000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity=".4"/>
      </radialGradient>
      <clipPath id="av-clip-${uid}"><circle cx="60" cy="60" r="56"/></clipPath>
    </defs>
    <circle cx="60" cy="60" r="56" fill="url(#av-bg-${uid})"/>
    <g clip-path="url(#av-clip-${uid})">
      <!-- foco de luz cenital del estadio -->
      <ellipse cx="60" cy="26" rx="46" ry="34" fill="#ffffff" opacity=".07"/>
      <!-- hombros / camiseta con cuello y volumen de tela -->
      <path d="M8 120 v-11 a52 52 0 0 1 104 0 v11 z" fill="${shirt}"/>
      <path d="M8 120 v-11 a52 52 0 0 1 104 0 v11 z" fill="url(#av-shirt-${uid})"/>
      <path d="M42 92 q18 14 36 0" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="3"/>
      <path d="M12 108 a48 48 0 0 1 96 0" fill="none" stroke="${accent}" stroke-width="5" opacity=".85"/>
      <!-- cuello con sombra bajo el mentón -->
      <path d="M50 82 h20 v-11 a10 10 0 0 1 -20 0 z" fill="${skin}"/>
      <path d="M50 82 h20 v-4 q-10 6 -20 0 z" fill="#000000" opacity=".22"/>
      <path d="M50 78 q10 8 20 0 v4 q-10 6 -20 0 z" fill="${accent}" opacity=".9"/>
      <!-- cabeza: óvalo con orejas, mandíbula marcada -->
      <path d="M39 47 q0 -22 21 -22 q21 0 21 22 q0 16 -9 24 q-6 5 -12 5 q-6 0 -12 -5 q-9 -8 -9 -24 z" fill="${skin}"/>
      <ellipse cx="39.5" cy="50" rx="4" ry="6" fill="${skin}"/>
      <ellipse cx="80.5" cy="50" rx="4" ry="6" fill="${skin}"/>
      <!-- cejas + ojos contenidos (realistas, no caricatura) -->
      <path d="M48 45 q5 -3 10 -1" stroke="#3a2a20" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M62 44 q5 -2 10 1" stroke="#3a2a20" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="52" cy="50" rx="2.6" ry="2.9" fill="#2a2018"/>
      <ellipse cx="68" cy="50" rx="2.6" ry="2.9" fill="#2a2018"/>
      <path d="M57 52 q3 5 6 0" fill="none" stroke="#000" stroke-width="1.3" opacity=".26" stroke-linecap="round"/>
      <path d="M54 63 q6 2 13 0" fill="none" stroke="#7a3a26" stroke-width="2.4" stroke-linecap="round"/>
      <!-- pelo con volumen: base + mechón de luz -->
      <path d="M38 48 q-2 -26 22 -26 q24 0 22 26 q-4 -12 -12 -15 q3 6 1 9 q-5 -9 -11 -9 q-6 0 -11 9 q-2 -3 1 -9 q-8 3 -12 15 z" fill="${hair}"/>
      <path d="M38 48 q-2 -26 22 -26 q24 0 22 26 q-4 -12 -12 -15 q3 6 1 9 q-5 -9 -11 -9 q-6 0 -11 9 q-2 -3 1 -9 q-8 3 -12 15 z" fill="url(#av-hair-${uid})"/>
      <!-- modelado de piel encima de todo el rostro -->
      <path d="M39 47 q0 -22 21 -22 q21 0 21 22 q0 16 -9 24 q-6 5 -12 5 q-6 0 -12 -5 q-9 -8 -9 -24 z" fill="url(#av-skin-${uid})"/>
      <rect x="4" y="4" width="112" height="112" fill="url(#av-vig-${uid})"/>
    </g>
    <!-- aro con luz de borde -->
    <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2"/>
    <circle cx="60" cy="60" r="55" fill="none" stroke="${accent}" stroke-width="1" opacity=".5"/>
    <!-- dorsal -->
    <circle cx="97" cy="97" r="16" fill="#0a1226" stroke="${accent}" stroke-width="2"/>
    <text x="97" y="102.5" text-anchor="middle" font-size="15" font-weight="900" fill="#ffffff" font-family="Nunito, sans-serif">${number}</text>
  </svg>`;
}

export function shooterSVG() {
  return `
  <g class="shooter-art">
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
    <!-- brazos colgando desde el hombro -->
    <rect class="sh-arm sh-arm-l" x="-42.5" y="-108" width="9" height="32" rx="4.5" fill="var(--sh-skin)"/>
    <rect class="sh-arm sh-arm-r" x="33.5" y="-108" width="9" height="32" rx="4.5" fill="var(--sh-skin)"/>
    <text class="sh-name" x="0" y="-129" text-anchor="middle" font-size="10.5" font-weight="900" fill="var(--sh-accent)" letter-spacing="1" font-family="Nunito, sans-serif"></text>
    <text class="sh-number" x="0" y="-96" text-anchor="middle" font-size="34" font-weight="900" fill="var(--sh-accent)" font-family="Nunito, sans-serif">10</text>
    <circle cx="0" cy="-164" r="17" fill="var(--sh-skin)"/>
    ${Object.entries(HAIR_BACK)
      .map(([id, fn]) => `<g class="hairv hairv-${id}">${fn('var(--sh-hair)')}</g>`)
      .join('')}
    <path d="M-28 -148 L28 -148 L24 -76 L-24 -76 Z" fill="url(#g-shade)"/>
    <circle cx="0" cy="-164" r="17" fill="url(#g-shade)"/>
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
      <rect x="-40" y="-6.5" width="42" height="13" rx="6.5" fill="var(--gk-shirt)"/>
      <rect x="-42" y="-7.5" width="7" height="15" rx="2.5" fill="var(--gk-accent)"/>
      <rect x="-54" y="-9.5" width="17" height="19" rx="6" fill="#f4f6fb" stroke="#c9cedb" stroke-width="1.5"/>
      <path d="M-50 -9 v19 M-45.5 -9 v19" stroke="#c9cedb" stroke-width="1"/>
    </g>
    <g transform="translate(20,-104) rotate(36)">
      <rect x="-2" y="-6.5" width="42" height="13" rx="6.5" fill="var(--gk-shirt)"/>
      <rect x="35" y="-7.5" width="7" height="15" rx="2.5" fill="var(--gk-accent)"/>
      <rect x="37" y="-9.5" width="17" height="19" rx="6" fill="#f4f6fb" stroke="#c9cedb" stroke-width="1.5"/>
      <path d="M42 -9 v19 M46.5 -9 v19" stroke="#c9cedb" stroke-width="1"/>
    </g>
    <text x="0" y="-76" text-anchor="middle" font-size="24" font-weight="900" fill="var(--gk-accent)" font-family="Nunito, sans-serif">1</text>
    <circle cx="0" cy="-127" r="15" fill="var(--gk-skin)"/>
    <path d="M-15 -131 Q-11 -146 0 -146 Q11 -146 15 -131 Q7 -138 0 -136 Q-7 -138 -15 -131 Z" fill="var(--gk-hair)"/>
    <circle cx="-5" cy="-128" r="2.6" fill="#1c1f26"/>
    <circle cx="5" cy="-128" r="2.6" fill="#1c1f26"/>
    <path d="M-4 -118 L4 -118" stroke="#8a4b2d" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M-22 -112 L22 -112 L18 -62 L-18 -62 Z" fill="url(#g-shade)"/>
    <circle cx="0" cy="-127" r="15" fill="url(#g-shade)"/>
  </g>`;
}
