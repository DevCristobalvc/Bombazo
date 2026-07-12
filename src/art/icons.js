/**
 * Íconos SVG propios (cero emojis en la app).
 * Usan currentColor: heredan el color del texto donde se insertan.
 */
const PATHS = {
  bolt: '<path d="M13 2 5.5 13.5h4.6L9 22l7.5-11.5h-4.6L13 2z" fill="currentColor"/>',
  trophy:
    '<path d="M6 3h12v2h3.5v3c0 2.6-2 4.7-4.6 4.9A6 6 0 0 1 13 16.7V19h3.5v2.5h-9V19H11v-2.3a6 6 0 0 1-3.9-3.8C4.5 12.7 2.5 10.6 2.5 8V5H6V3zm-1.5 4v1c0 1.2.7 2.3 1.8 2.7L6 7H4.5zm15 0H18l-.3 3.7c1.1-.4 1.8-1.5 1.8-2.7V7z" fill="currentColor"/>',
  flame:
    '<path d="M12 2C13.2 6 8 7.2 8 12.2a4 4 0 0 0 8 0c0-2.4-1.1-3.4-1.7-4.6C13.6 9.2 15.4 5.8 12 2z" fill="currentColor"/>',
  soundOn:
    '<path d="M4 9.2v5.6h3.8L13 19V5L7.8 9.2H4z" fill="currentColor"/><path d="M16 9.4a4 4 0 0 1 0 5.2M18.5 7a7.5 7.5 0 0 1 0 10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  soundOff:
    '<path d="M4 9.2v5.6h3.8L13 19V5L7.8 9.2H4z" fill="currentColor"/><path d="M16.5 9.8l4.8 4.8M21.3 9.8l-4.8 4.8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  ticket:
    '<rect x="2.5" y="7" width="19" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 7v10" stroke="currentColor" stroke-width="2" stroke-dasharray="2.6 2.6"/>',
  sadball:
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.8" cy="9.8" r="1.4" fill="currentColor"/><circle cx="15.2" cy="9.8" r="1.4" fill="currentColor"/><path d="M8.4 16.2c1.2-1.8 6-1.8 7.2 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  versus:
    '<circle cx="7.5" cy="7.5" r="3.2" fill="currentColor"/><path d="M2 18.5c.7-3.4 3-5.2 5.5-5.2s4.8 1.8 5.5 5.2z" fill="currentColor"/><circle cx="17" cy="9" r="2.7" fill="currentColor"/><path d="M13.4 18.5c.6-2.9 1.9-4.4 3.6-4.4 1.9 0 3.4 1.5 4 4.4z" fill="currentColor"/>',
  qr:
    '<path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm12-2h4v2h-2v2h-2v-4zm-3 0h2v3h-2v-3zm3 5h2v2h-2v-2zm3-1h1v3h-3v-2h2v-1z" fill="currentColor"/>',
  check:
    '<path d="M4.5 12.5l5 5 10-11" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  x:
    '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>',
};

export function icon(name, size = 18) {
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${PATHS[name] ?? ''}</svg>`;
}

/** Nivel de dificultad como llamas repetidas. */
export function flames(count, size = 13) {
  return `<span class="flames">${icon('flame', size).repeat(count)}</span>`;
}
