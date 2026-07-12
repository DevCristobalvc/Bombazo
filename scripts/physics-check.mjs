/* Test unitario del motor de físicas (lógica pura, corre en Node). */
import { analyzeSwipe, shotPath, makeCpuShot } from '../src/core/physics.js';
import { zoneAt, zoneNearest, GOAL, BALL_HOME } from '../src/core/zones.js';

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'OK ' : 'FALLO'} ${name}`);
  if (!cond) failures += 1;
};

// Swipe recto hacia la esquina superior izquierda → cae en la zona 0
const straight = (x0, y0, x1, y1, ms = 140, n = 8) =>
  Array.from({ length: n }, (_, i) => ({
    x: x0 + ((x1 - x0) * i) / (n - 1),
    y: y0 + ((y1 - y0) * i) / (n - 1),
    t: (ms * i) / (n - 1),
  }));

const s1 = analyzeSwipe(straight(180, 462, 108, 222));
check('swipe a esquina alta izquierda es válido', s1 !== null);
check('cae dentro del arco (zona 0)', s1 && zoneAt(s1.tx, s1.ty) === 0);

// Swipe cortísimo o hacia abajo → gesto inválido
check('swipe corto es inválido', analyzeSwipe(straight(180, 462, 185, 455)) === null);
check('swipe hacia abajo es inválido', analyzeSwipe(straight(180, 462, 180, 520)) === null);

// Swipe exageradamente largo hacia arriba → por encima del arco (afuera)
const s2 = analyzeSwipe(straight(180, 462, 180, 60));
check('tiro pasado de largo va afuera', s2 && zoneAt(s2.tx, s2.ty) === null);

// Swipe curvado: el punto medio desviado genera curva y corre el destino
const curved = straight(180, 462, 180, 240);
curved[Math.floor(curved.length / 2)].x += 55;
const s3 = analyzeSwipe(curved);
const s3straight = analyzeSwipe(straight(180, 462, 180, 240));
check('el gesto curvado produce curve distinto de 0', s3 && Math.abs(s3.curve) > 0.2);
check('la comba desplaza el destino', s3 && s3straight && Math.abs(s3.tx - s3straight.tx) > 10);

// Trayectoria: empieza en el balón y termina en el destino
const path = shotPath(s1);
const p0 = path(0);
const p1 = path(1);
check('la trayectoria parte del balón', Math.abs(p0.x - BALL_HOME.x) < 0.01 && Math.abs(p0.y - BALL_HOME.y) < 0.01);
check('la trayectoria termina en el destino', Math.abs(p1.x - s1.tx) < 0.01 && Math.abs(p1.y - s1.ty) < 0.01);
const pm = path(0.5);
check('el arco de gravedad eleva el punto medio', pm.y < (p0.y + p1.y) / 2);

// Velocidad del gesto → duración del vuelo (más rápido = más corto)
const slow = analyzeSwipe(straight(180, 462, 120, 240, 500));
const fastS = analyzeSwipe(straight(180, 462, 120, 240, 60));
check('swipe veloz vuela más rápido', fastS.dur < slow.dur);

// Tiros CPU: dentro de la zona pedida (a veces vecina por el jitter) o afuera
let inGoal = 0;
for (let i = 0; i < 200; i++) {
  const shot = makeCpuShot(4, false);
  if (zoneAt(shot.tx, shot.ty) !== null) inGoal += 1;
}
check('tiros CPU al centro siempre van al arco', inGoal === 200);
const off = makeCpuShot(1, true);
check('tiro CPU desviado va por encima', zoneAt(off.tx, off.ty) === null && off.ty < GOAL.top);

// zoneNearest lee tiros afuera
check('zoneNearest de un tiro alto al centro es la fila alta', [0, 1, 2].includes(zoneNearest(180, 100)));

process.exit(failures ? 1 : 0);
