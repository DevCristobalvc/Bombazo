/**
 * Modo torneo — lógica pura (v2: llave real).
 * Arranca con los cruces reales de octavos del Mundial 2026; tu primer rival
 * es el de verdad. Al avanzar, los demás cruces se simulan y tu próximo
 * rival emerge del bracket, como en la copa real.
 */
import { pick } from '../utils/random.js';

export const STAGES = ['Octavos de final', 'Cuartos de final', 'Semifinal', 'GRAN FINAL'];

/** Cruces reales de octavos (4-7 de julio de 2026), en orden de llave. */
export const REAL_PAIRINGS = [
  ['can', 'mar'],
  ['par', 'fra'],
  ['bra', 'nor'],
  ['mex', 'eng'],
  ['por', 'esp'],
  ['usa', 'bel'],
  ['arg', 'egy'],
  ['sui', 'col'],
];

const rivalOf = (pairs, id) => {
  const pair = pairs.find((p) => p.includes(id));
  return pair[0] === id ? pair[1] : pair[0];
};

export function createTournament(playerTeamId) {
  const pairs = REAL_PAIRINGS.map((p) => [...p]);
  return { playerTeamId, pairs, stage: 0, rivals: [rivalOf(pairs, playerTeamId)] };
}

export const currentRival = (t) => t.rivals[t.stage];

export const currentStage = (t) => STAGES[t.stage];

/** El jugador ganó su cruce: se simulan los demás y se arma la siguiente ronda. */
export function advance(t) {
  const winners = t.pairs.map((p) => (p.includes(t.playerTeamId) ? t.playerTeamId : pick(p)));
  const next = [];
  for (let i = 0; i < winners.length; i += 2) {
    if (winners[i + 1] !== undefined) next.push([winners[i], winners[i + 1]]);
  }
  t.pairs = next;
  t.stage += 1;
  if (t.stage < STAGES.length && next.length > 0) {
    t.rivals.push(rivalOf(t.pairs, t.playerTeamId));
  }
}

export const isChampion = (t) => t.stage >= STAGES.length;
