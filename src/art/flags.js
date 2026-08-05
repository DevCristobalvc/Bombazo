/**
 * Banderas mini en SVG propio, una función por país (16 clasificados a
 * octavos del Mundial 2026). Simplificadas pero reconocibles a 26px.
 */

/** Puntos de una estrella de n picos (para Marruecos, hoja de Canadá, etc.). */
function starPts(cx, cy, spikes, outer, inner, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / spikes;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}

const DRAWERS = {
  col: (w, h) => `
    <rect width="${w}" height="${h / 2}" fill="#FCD116"/>
    <rect y="${h / 2}" width="${w}" height="${h / 4}" fill="#003893"/>
    <rect y="${(h * 3) / 4}" width="${w}" height="${h / 4}" fill="#CE1126"/>`,
  arg: (w, h) => `
    <rect width="${w}" height="${h}" fill="#74ACDF"/>
    <rect y="${h / 3}" width="${w}" height="${h / 3}" fill="#ffffff"/>
    <circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.15}" fill="#F6B40E"/>`,
  bra: (w, h) => `
    <rect width="${w}" height="${h}" fill="#009C3B"/>
    <polygon points="${w / 2},${h * 0.1} ${w * 0.9},${h / 2} ${w / 2},${h * 0.9} ${w * 0.1},${h / 2}" fill="#FFDF00"/>
    <circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.21}" fill="#002776"/>`,
  mex: (w, h) => `
    <rect width="${w / 3}" height="${h}" fill="#006847"/>
    <rect x="${w / 3}" width="${w / 3}" height="${h}" fill="#ffffff"/>
    <rect x="${(w * 2) / 3}" width="${w / 3}" height="${h}" fill="#CE1126"/>
    <circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.13}" fill="#8C6239"/>`,
  usa: (w, h) => {
    let stripes = '';
    for (let i = 0; i < 7; i++) {
      stripes += `<rect y="${(i * h) / 7}" width="${w}" height="${h / 7}" fill="${i % 2 === 0 ? '#B22234' : '#ffffff'}"/>`;
    }
    return `${stripes}
    <rect width="${w * 0.45}" height="${h * 0.5}" fill="#3C3B6E"/>
    <circle cx="${w * 0.11}" cy="${h * 0.16}" r="1.2" fill="#fff"/>
    <circle cx="${w * 0.23}" cy="${h * 0.32}" r="1.2" fill="#fff"/>
    <circle cx="${w * 0.34}" cy="${h * 0.16}" r="1.2" fill="#fff"/>`;
  },
  can: (w, h) => `
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    <rect width="${w * 0.26}" height="${h}" fill="#D80621"/>
    <rect x="${w * 0.74}" width="${w * 0.26}" height="${h}" fill="#D80621"/>
    <polygon points="${starPts(w / 2, h * 0.46, 6, h * 0.3, h * 0.15)}" fill="#D80621"/>
    <rect x="${w / 2 - 0.8}" y="${h * 0.62}" width="1.6" height="${h * 0.2}" fill="#D80621"/>`,
  par: (w, h) => `
    <rect width="${w}" height="${h / 3}" fill="#D52B1E"/>
    <rect y="${h / 3}" width="${w}" height="${h / 3}" fill="#ffffff"/>
    <rect y="${(h * 2) / 3}" width="${w}" height="${h / 3}" fill="#0038A8"/>
    <circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.13}" fill="none" stroke="#7d7d7d" stroke-width="1"/>
    <circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.05}" fill="#FEDF00"/>`,
  esp: (w, h) => `
    <rect width="${w}" height="${h}" fill="#AA151B"/>
    <rect y="${h / 4}" width="${w}" height="${h / 2}" fill="#F1BF00"/>`,
  por: (w, h) => `
    <rect width="${w}" height="${h}" fill="#DA291C"/>
    <rect width="${w * 0.4}" height="${h}" fill="#046A38"/>
    <circle cx="${w * 0.4}" cy="${h / 2}" r="${h * 0.27}" fill="#FFE900"/>
    <circle cx="${w * 0.4}" cy="${h / 2}" r="${h * 0.14}" fill="#DA291C"/>`,
  fra: (w, h) => `
    <rect width="${w / 3}" height="${h}" fill="#0055A4"/>
    <rect x="${w / 3}" width="${w / 3}" height="${h}" fill="#ffffff"/>
    <rect x="${(w * 2) / 3}" width="${w / 3}" height="${h}" fill="#EF4135"/>`,
  eng: (w, h) => {
    const t = h * 0.22;
    return `
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    <rect x="${w / 2 - t / 2}" width="${t}" height="${h}" fill="#CE1124"/>
    <rect y="${h / 2 - t / 2}" width="${w}" height="${t}" fill="#CE1124"/>`;
  },
  bel: (w, h) => `
    <rect width="${w / 3}" height="${h}" fill="#000000"/>
    <rect x="${w / 3}" width="${w / 3}" height="${h}" fill="#FDDA24"/>
    <rect x="${(w * 2) / 3}" width="${w / 3}" height="${h}" fill="#EF3340"/>`,
  sui: (w, h) => {
    const arm = h * 0.62;
    const thick = h * 0.2;
    return `
    <rect width="${w}" height="${h}" fill="#DA291C"/>
    <rect x="${w / 2 - thick / 2}" y="${h / 2 - arm / 2}" width="${thick}" height="${arm}" fill="#ffffff"/>
    <rect x="${w / 2 - arm / 2}" y="${h / 2 - thick / 2}" width="${arm}" height="${thick}" fill="#ffffff"/>`;
  },
  nor: (w, h) => {
    const cx = w * 0.38;
    const tw = h * 0.3;
    const tb = h * 0.15;
    return `
    <rect width="${w}" height="${h}" fill="#BA0C2F"/>
    <rect x="${cx - tw / 2}" width="${tw}" height="${h}" fill="#ffffff"/>
    <rect y="${h / 2 - tw / 2}" width="${w}" height="${tw}" fill="#ffffff"/>
    <rect x="${cx - tb / 2}" width="${tb}" height="${h}" fill="#00205B"/>
    <rect y="${h / 2 - tb / 2}" width="${w}" height="${tb}" fill="#00205B"/>`;
  },
  mar: (w, h) => `
    <rect width="${w}" height="${h}" fill="#C1272D"/>
    <polygon points="${starPts(w / 2, h / 2, 5, h * 0.3, h * 0.12)}" fill="#006233"/>`,
  egy: (w, h) => `
    <rect width="${w}" height="${h / 3}" fill="#CE1126"/>
    <rect y="${h / 3}" width="${w}" height="${h / 3}" fill="#ffffff"/>
    <rect y="${(h * 2) / 3}" width="${w}" height="${h / 3}" fill="#000000"/>
    <rect x="${w / 2 - 1.6}" y="${h / 2 - 3.2}" width="3.2" height="6.4" fill="#C09300"/>`,
  ned: (w, h) => `
    <rect width="${w}" height="${h / 3}" fill="#AE1C28"/>
    <rect y="${h / 3}" width="${w}" height="${h / 3}" fill="#ffffff"/>
    <rect y="${(h * 2) / 3}" width="${w}" height="${h / 3}" fill="#21468B"/>`,
  ger: (w, h) => `
    <rect width="${w}" height="${h / 3}" fill="#000000"/>
    <rect y="${h / 3}" width="${w}" height="${h / 3}" fill="#DD0000"/>
    <rect y="${(h * 2) / 3}" width="${w}" height="${h / 3}" fill="#FFCE00"/>`,
  ita: (w, h) => `
    <rect width="${w / 3}" height="${h}" fill="#009246"/>
    <rect x="${w / 3}" width="${w / 3}" height="${h}" fill="#ffffff"/>
    <rect x="${(w * 2) / 3}" width="${w / 3}" height="${h}" fill="#CE2B37"/>`,
  jpn: (w, h) => `
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    <circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.28}" fill="#BC002D"/>`,
  pol: (w, h) => `
    <rect width="${w}" height="${h / 2}" fill="#ffffff"/>
    <rect y="${h / 2}" width="${w}" height="${h / 2}" fill="#DC143C"/>`,
  per: (w, h) => `
    <rect width="${w / 3}" height="${h}" fill="#D91023"/>
    <rect x="${w / 3}" width="${w / 3}" height="${h}" fill="#ffffff"/>
    <rect x="${(w * 2) / 3}" width="${w / 3}" height="${h}" fill="#D91023"/>`,
  nga: (w, h) => `
    <rect width="${w / 3}" height="${h}" fill="#008751"/>
    <rect x="${w / 3}" width="${w / 3}" height="${h}" fill="#ffffff"/>
    <rect x="${(w * 2) / 3}" width="${w / 3}" height="${h}" fill="#008751"/>`,
  uru: (w, h) => {
    let stripes = '';
    for (let i = 1; i < 8; i += 2) stripes += `<rect y="${(i * h) / 8}" width="${w}" height="${h / 8}" fill="#5CBFEB"/>`;
    return `
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    ${stripes}
    <rect width="${w * 0.42}" height="${h * 0.5}" fill="#ffffff"/>
    <circle cx="${w * 0.21}" cy="${h * 0.25}" r="${h * 0.16}" fill="#F4C300"/>`;
  },
  chi: (w, h) => `
    <rect width="${w}" height="${h / 2}" fill="#ffffff"/>
    <rect y="${h / 2}" width="${w}" height="${h / 2}" fill="#D52B1E"/>
    <rect width="${w / 3}" height="${h / 2}" fill="#0039A6"/>
    <polygon points="${starPts(w / 6, h / 4, 5, h * 0.16, h * 0.07)}" fill="#ffffff"/>`,
  den: (w, h) => {
    const t = h * 0.16;
    return `
    <rect width="${w}" height="${h}" fill="#C60C30"/>
    <rect x="${w * 0.3}" width="${t}" height="${h}" fill="#ffffff"/>
    <rect y="${(h - t) / 2}" width="${w}" height="${t}" fill="#ffffff"/>`;
  },
  swe: (w, h) => {
    const t = h * 0.16;
    return `
    <rect width="${w}" height="${h}" fill="#006AA7"/>
    <rect x="${w * 0.3}" width="${t}" height="${h}" fill="#FECC02"/>
    <rect y="${(h - t) / 2}" width="${w}" height="${t}" fill="#FECC02"/>`;
  },
  gha: (w, h) => `
    <rect width="${w}" height="${h / 3}" fill="#CE1126"/>
    <rect y="${h / 3}" width="${w}" height="${h / 3}" fill="#FCD116"/>
    <rect y="${(h * 2) / 3}" width="${w}" height="${h / 3}" fill="#006B3F"/>
    <polygon points="${starPts(w / 2, h / 2, 5, h * 0.16, h * 0.07)}" fill="#000000"/>`,
  ecu: (w, h) => `
    <rect width="${w}" height="${h / 2}" fill="#FFD100"/>
    <rect y="${h / 2}" width="${w}" height="${h / 4}" fill="#0072CE"/>
    <rect y="${(h * 3) / 4}" width="${w}" height="${h / 4}" fill="#EF3340"/>`,
  sen: (w, h) => `
    <rect width="${w / 3}" height="${h}" fill="#00853F"/>
    <rect x="${w / 3}" width="${w / 3}" height="${h}" fill="#FDEF42"/>
    <rect x="${(w * 2) / 3}" width="${w / 3}" height="${h}" fill="#E31B23"/>
    <polygon points="${starPts(w / 2, h / 2, 5, h * 0.16, h * 0.07)}" fill="#00853F"/>`,
  crc: (w, h) => `
    <rect width="${w}" height="${h}" fill="#002B7F"/>
    <rect y="${h / 6}" width="${w}" height="${h / 6}" fill="#ffffff"/>
    <rect y="${h / 3}" width="${w}" height="${h / 3}" fill="#CE1126"/>
    <rect y="${(h * 2) / 3}" width="${w}" height="${h / 6}" fill="#ffffff"/>`,
};

export function flagSVG(teamId, w = 36, h = 24) {
  const draw = DRAWERS[teamId];
  const inner = draw ? draw(w, h) : `<rect width="${w}" height="${h}" fill="#556"/>`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${inner}</svg>`;
}
