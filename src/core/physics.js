/**
 * Motor de físicas de tiro — lógica pura, sin DOM (Fase 4).
 * Convierte un gesto de swipe en una trayectoria: la dirección y el largo
 * definen la puntería, la velocidad la potencia y la curvatura del trazo
 * el efecto (comba). La trayectoria es una Bézier cuadrática con leve arco
 * de gravedad; el punto de control se desplaza según la curva.
 */
import { BALL_HOME, zoneCenter } from './zones.js';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Alcance del gesto: cuánto viaja el objetivo por px deslizado. */
const REACH = 1.12;
/** Desplazamiento lateral máximo que aporta la comba (px de escena). */
const CURVE_DRIFT = 36;

/** Proyecta el destino de un gesto (sin curva), siempre desde el balón. */
export function projectTarget(start, end) {
  return {
    tx: BALL_HOME.x + (end.x - start.x) * REACH,
    ty: BALL_HOME.y + (end.y - start.y) * REACH,
  };
}

/**
 * Analiza un swipe (puntos {x, y, t} en coordenadas de escena).
 * Devuelve { tx, ty, curve, dur } o null si el gesto no es un remate
 * (muy corto o no va hacia el arco).
 */
export function analyzeSwipe(points) {
  if (!points || points.length < 3) return null;
  const a = points[0];
  const b = points[points.length - 1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 45 || dy > -35) return null;

  // Comba: desviación perpendicular (con signo) del punto medio del trazo
  const mid = points[Math.floor(points.length / 2)];
  const dev = ((mid.x - a.x) * dy - (mid.y - a.y) * dx) / len;
  const curve = clamp(dev / 42, -1, 1);

  let { tx, ty } = projectTarget(a, b);
  tx += curve * CURVE_DRIFT; // la comba corrige el destino final

  const ms = Math.max(30, b.t - a.t);
  const speed = len / ms; // px de escena por ms
  const dur = clamp(560 - speed * 300, 250, 560);

  return { tx: clamp(tx, -30, 390), ty: clamp(ty, 90, 380), curve, dur };
}

/**
 * Trayectoria del tiro: función u∈[0,1] → punto {x, y}.
 * Bézier cuadrática con control desplazado por la comba y elevado
 * por un arco de gravedad proporcional a la distancia.
 */
export function shotPath(shot, from = BALL_HOME) {
  const dx = shot.tx - from.x;
  const dy = shot.ty - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const lift = Math.min(46, len * 0.12);
  const cx = (from.x + shot.tx) / 2 + px * shot.curve * 55;
  const cy = (from.y + shot.ty) / 2 + py * shot.curve * 55 - lift;
  return (u) => ({
    x: (1 - u) ** 2 * from.x + 2 * (1 - u) * u * cx + u ** 2 * shot.tx,
    y: (1 - u) ** 2 * from.y + 2 * (1 - u) * u * cy + u ** 2 * shot.ty,
  });
}

/**
 * Centro de córner: el balón barre con comba el área frente al arco.
 * Devuelve { path(u), dur }. El jugador remata de cabeza con un toque
 * en el momento justo (la posición del balón define el remate).
 */
export function cornerCrossPath(side = 'right') {
  const from = side === 'right' ? { x: 372, y: 310 } : { x: -12, y: 310 };
  const to = side === 'right' ? { x: -10, y: 425 } : { x: 370, y: 425 };
  const cx = 180;
  const cy = 480; // control bajo: la comba pasa por delante del arco
  const path = (u) => ({
    x: (1 - u) ** 2 * from.x + 2 * (1 - u) * u * cx + u ** 2 * to.x,
    y: (1 - u) ** 2 * from.y + 2 * (1 - u) * u * cy + u ** 2 * to.y,
  });
  return { path, dur: 1650 };
}

/**
 * Cabezazo: nace donde está el balón al momento del toque.
 * La columna la define la posición del balón (timing = puntería);
 * la profundidad del centro define la altura del remate.
 */
export function headerShot(point) {
  const tx = point.x + (Math.random() * 2 - 1) * 14;
  const ty = clamp(165 + (point.y - 385) * 1.35 + (Math.random() * 2 - 1) * 18, 150, 371);
  return {
    tx: clamp(tx, -25, 385),
    ty,
    curve: (Math.random() * 2 - 1) * 0.3,
    dur: 300 + Math.random() * 120,
  };
}

/** Tiro sintético de la CPU hacia una zona (o desviado por encima). */
export function makeCpuShot(zone, offTarget) {
  const curve = (Math.random() * 2 - 1) * 0.55;
  const dur = 340 + Math.random() * 160;
  if (offTarget) {
    const cx = zoneCenter(zone).x;
    return { tx: cx + (Math.random() * 44 - 22), ty: 112 + Math.random() * 22, curve, dur };
  }
  const c = zoneCenter(zone);
  return {
    tx: c.x + (Math.random() * 40 - 20),
    ty: c.y + (Math.random() * 36 - 18),
    curve,
    dur,
  };
}
