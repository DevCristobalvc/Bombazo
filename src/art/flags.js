/**
 * Banderas mini en SVG propio, una función por país.
 * Agregar equipo nuevo = agregar su drawer aquí.
 */
const DRAWERS = {
  col: (w, h) => `
    <rect width="${w}" height="${h / 2}" fill="#FCD116"/>
    <rect y="${h / 2}" width="${w}" height="${h / 4}" fill="#003893"/>
    <rect y="${(h * 3) / 4}" width="${w}" height="${h / 4}" fill="#CE1126"/>`,
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
  sui: (w, h) => {
    const arm = h * 0.62;
    const thick = h * 0.2;
    return `
    <rect width="${w}" height="${h}" fill="#DA291C"/>
    <rect x="${w / 2 - thick / 2}" y="${h / 2 - arm / 2}" width="${thick}" height="${arm}" fill="#ffffff"/>
    <rect x="${w / 2 - arm / 2}" y="${h / 2 - thick / 2}" width="${arm}" height="${thick}" fill="#ffffff"/>`;
  },
};

export function flagSVG(teamId, w = 36, h = 24) {
  const draw = DRAWERS[teamId];
  const inner = draw ? draw(w, h) : `<rect width="${w}" height="${h}" fill="#556"/>`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${inner}</svg>`;
}
