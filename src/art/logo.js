/**
 * Logotipo Bombazo: wordmark con el balón como última "O",
 * explosión cómica detrás y líneas de velocidad.
 */
import { ballArt } from './ball.js';

/** Puntos de una estrella/explosión de n picos. */
function star(spikes, outer, inner, rotDeg = 0) {
  const pts = [];
  const rot = (rotDeg * Math.PI) / 180;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot - Math.PI / 2 + (i * Math.PI) / spikes;
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}

export function logoSVG() {
  return `
  <svg viewBox="0 0 344 96" class="logo-svg" aria-hidden="true">
    <g transform="translate(288 46)">
      <polygon points="${star(10, 42, 26, 0)}" fill="#ff5c39"/>
      <polygon points="${star(10, 33, 21, 18)}" fill="#ffd100"/>
    </g>
    <g stroke="#ffd100" stroke-width="5" stroke-linecap="round" opacity=".85">
      <line x1="228" y1="30" x2="248" y2="33"/>
      <line x1="222" y1="46" x2="246" y2="46"/>
      <line x1="228" y1="62" x2="248" y2="59"/>
    </g>
    <text x="10" y="66" font-family="'Luckiest Guy','Arial Black',sans-serif" font-size="56"
      fill="#ffd100" stroke="#081024" stroke-width="9" paint-order="stroke"
      letter-spacing="1">BOMBAZ</text>
    <g transform="translate(288 46)">${ballArt(21)}</g>
  </svg>`;
}
