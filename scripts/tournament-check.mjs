/* Test puro del torneo v2: llave real de octavos y progresión del bracket. */
import { createTournament, currentRival, advance, isChampion } from '../src/core/tournament.js';

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'OK ' : 'FALLO'} ${name}`);
  if (!cond) failures += 1;
};

// Cruce real: Colombia abre contra Suiza
const t = createTournament('col');
check('Colombia abre contra Suiza (cruce real)', currentRival(t) === 'sui');

// Cuartos: contra el ganador de Argentina-Egipto (su lado de la llave)
advance(t);
check('cuartos contra ganador de ARG-EGY', ['arg', 'egy'].includes(currentRival(t)));

// Semis: ganador del lado POR/ESP/USA/BEL
advance(t);
check('semis contra el lado POR-ESP-USA-BEL', ['por', 'esp', 'usa', 'bel'].includes(currentRival(t)));

// Final: alguien de la otra mitad de la llave
advance(t);
check('final contra la otra mitad', ['can', 'mar', 'par', 'fra', 'bra', 'nor', 'mex', 'eng'].includes(currentRival(t)));

advance(t);
check('tras 4 rondas ganadas eres campeón', isChampion(t));
check('el camino registró 4 rivales', t.rivals.length === 4);

// Otro equipo: Francia abre contra Paraguay
check('Francia abre contra Paraguay', currentRival(createTournament('fra')) === 'par');

process.exit(failures ? 1 : 0);
