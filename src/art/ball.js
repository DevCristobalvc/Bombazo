/** Balón cartoon: esfera blanca, parches oscuros y brillo. Origen en el centro. */
export function ballArt(r = 11) {
  let patches = '';
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    const cx = (Math.cos(a) * r * 0.62).toFixed(1);
    const cy = (Math.sin(a) * r * 0.62).toFixed(1);
    patches += `<circle cx="${cx}" cy="${cy}" r="${(r * 0.17).toFixed(1)}" fill="#2a2e38"/>`;
  }
  return `
  <g class="ball-art">
    <circle r="${r}" fill="#f8fafd" stroke="#c9cedb" stroke-width="1"/>
    ${patches}
    <circle r="${(r * 0.3).toFixed(1)}" fill="#2a2e38"/>
    <circle r="${r}" fill="url(#g-ball3d)"/>
  </g>`;
}
