/**
 * Modo torneo — lógica pura.
 * Camino al título: enfrentas a las otras 4 selecciones en orden aleatorio,
 * una ronda eliminatoria por partido. Perder = eliminado; ganar las 4 = campeón.
 */
import { TEAMS } from '../data/teams.js';
import { shuffle } from '../utils/random.js';

export const STAGES = ['Octavos de final', 'Cuartos de final', 'Semifinal', 'GRAN FINAL'];

export function createTournament(playerTeamId) {
  const rivals = shuffle(TEAMS.filter((t) => t.id !== playerTeamId).map((t) => t.id));
  return { playerTeamId, rivals, stage: 0 };
}

export const currentRival = (t) => t.rivals[t.stage];

export const currentStage = (t) => STAGES[t.stage];

export function advance(t) {
  t.stage += 1;
}

export const isChampion = (t) => t.stage >= t.rivals.length;
