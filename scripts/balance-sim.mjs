/**
 * Simulador de balance (v2, mecánica continua). Importa el core puro y mide,
 * por dificultad, las tasas reales en los dos roles:
 *  - PATEAR vs IA arquera  -> % de gol
 *  - ATAJAR vs IA rematadora -> % de atajada (y % que se va afuera)
 * No hay DOM: modela al jugador como puntería uniforme dentro del arco.
 * Uso: node scripts/balance-sim.mjs [N]
 */
import { keeperAim, shooterAim } from '../src/core/ai.js';
import { isSaved, cpuAimShot, hitsWoodwork } from '../src/core/physics.js';
import { GOAL, inGoal, AI_REACH, PLAYER_REACH } from '../src/core/zones.js';

const N = Number(process.argv[2]) || 2000;
const DIFFS = ['facil', 'medio', 'imposible'];
const NO_HABITS = new Array(9).fill(0);
const rand = (a, b) => a + Math.random() * (b - a);
const goalPoint = () => ({ x: rand(GOAL.left + 6, GOAL.right - 6), y: rand(GOAL.top + 6, GOAL.bottom - 6) });
const pct = (n) => `${(100 * n).toFixed(1)}%`;

// Rol A: el jugador patea a un punto del arco; la IA arquera intenta atajar.
function shootVsKeeper(diff) {
  let goals = 0;
  for (let i = 0; i < N; i++) {
    const target = goalPoint();
    const shot = { tx: target.x, ty: target.y, curve: 0, dur: 400 };
    const keeper = keeperAim(diff, shot, NO_HABITS);
    if (hitsWoodwork(shot)) continue; // al palo: no es gol
    if (!isSaved(shot, keeper, AI_REACH)) goals++;
  }
  return goals / N;
}

// Rol B: el jugador arrastra su arquero a un punto; la IA remata.
function saveVsShooter(diff) {
  let saves = 0;
  let off = 0;
  for (let i = 0; i < N; i++) {
    const dive = goalPoint();
    const aim = shooterAim(diff, dive);
    const shot = cpuAimShot(aim, aim.offTarget);
    const isOff = aim.offTarget || !inGoal(shot.tx, shot.ty);
    if (isOff) { off++; continue; }
    if (isSaved(shot, dive, PLAYER_REACH)) saves++;
  }
  return { save: saves / N, off: off / N };
}

console.log(`Balance sim — N=${N} por dificultad y rol\n`);
console.log('PATEAR (jugador) vs ARQUERO (IA)  -> % de gol');
for (const d of DIFFS) console.log(`  ${d.padEnd(10)} gol ${pct(shootVsKeeper(d))}`);
console.log('\nATAJAR (jugador) vs REMATADOR (IA) -> % de atajada / % afuera');
for (const d of DIFFS) {
  const r = saveVsShooter(d);
  console.log(`  ${d.padEnd(10)} atajada ${pct(r.save)}  ·  afuera ${pct(r.off)}`);
}
