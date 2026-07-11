/**
 * Equipos de la v1 (octavos del Mundial 2026).
 * Agregar una selección nueva = agregar una entrada aquí + su bandera en art/flags.js.
 * `kit` viste al jugador de campo; `gk` viste al arquero (siempre contrastante).
 */
export const TEAMS = [
  {
    id: 'col',
    name: 'Colombia',
    short: 'COL',
    kit: { shirt: '#FFD100', accent: '#003893', shorts: '#003893', socks: '#C8102E' },
    gk: { shirt: '#00B894', accent: '#0B3D33' },
    skin: '#C68642',
    hair: '#231208',
  },
  {
    id: 'esp',
    name: 'España',
    short: 'ESP',
    kit: { shirt: '#C8102E', accent: '#FFC72C', shorts: '#1A2A6C', socks: '#C8102E' },
    gk: { shirt: '#8E44AD', accent: '#2C0E37' },
    skin: '#E0AC69',
    hair: '#3B2314',
  },
  {
    id: 'por',
    name: 'Portugal',
    short: 'POR',
    kit: { shirt: '#B00A24', accent: '#046A38', shorts: '#046A38', socks: '#B00A24' },
    gk: { shirt: '#F1C40F', accent: '#3D3403' },
    skin: '#D2996C',
    hair: '#1E1105',
  },
  {
    id: 'fra',
    name: 'Francia',
    short: 'FRA',
    kit: { shirt: '#0055A4', accent: '#FFFFFF', shorts: '#FFFFFF', socks: '#EF4135' },
    gk: { shirt: '#F39C12', accent: '#4A2E03' },
    skin: '#8D5524',
    hair: '#120A02',
  },
  {
    id: 'sui',
    name: 'Suiza',
    short: 'SUI',
    kit: { shirt: '#DA291C', accent: '#FFFFFF', shorts: '#FFFFFF', socks: '#DA291C' },
    gk: { shirt: '#2D98DA', accent: '#0B3550' },
    skin: '#F1C27D',
    hair: '#6B3A1F',
  },
];

export const teamById = (id) => TEAMS.find((t) => t.id === id);

export const DIFFICULTIES = [
  { id: 'facil', label: 'Fácil', emoji: '😅' },
  { id: 'medio', label: 'Medio', emoji: '😼' },
  { id: 'imposible', label: 'Imposible', emoji: '💀' },
];
