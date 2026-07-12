/**
 * Punto de entrada: monta las tres pantallas, navega entre ellas y
 * orquesta los modos de juego (partido rápido y torneo).
 */
import './styles/tokens.css';
import './styles/base.css';
import { teamById } from './data/teams.js';
import { createTournament, currentRival, currentStage, advance, isChampion, STAGES } from './core/tournament.js';
import { recordResult } from './core/stats.js';
import { createMenuScreen } from './components/MenuScreen.js';
import { createMatchScreen } from './components/MatchScreen.js';
import { createEndScreen } from './components/EndScreen.js';

const app = document.getElementById('app');
let session = null; // { mode, teamId, rivalId, diff, tournament? }

function startQuickMatch() {
  show(match.el);
  match.start({
    playerTeam: teamById(session.teamId),
    rivalTeam: teamById(session.rivalId),
    diff: session.diff,
  });
}

function startTournamentMatch() {
  const t = session.tournament;
  show(match.el);
  match.start({
    playerTeam: teamById(t.playerTeamId),
    rivalTeam: teamById(currentRival(t)),
    diff: session.diff,
    stageLabel: currentStage(t),
  });
}

const menu = createMenuScreen({
  onPlay(config) {
    session = config;
    if (config.mode === 'torneo') {
      session.tournament = createTournament(config.teamId);
      startTournamentMatch();
    } else {
      startQuickMatch();
    }
  },
});

const match = createMatchScreen({
  onFinish(result) {
    recordResult(result.won);
    show(end.el);
    if (session.mode !== 'torneo') {
      end.show(result, {
        confetti: result.won,
        primary: { act: 'rematch', label: 'REVANCHA' },
      });
      return;
    }

    const t = session.tournament;
    if (!result.won) {
      end.show(result, {
        icon: 'sadball',
        title: 'ELIMINADO',
        sub: `El sueño terminó en ${currentStage(t)}. El torneo no perdona.`,
        primary: { act: 'new-tournament', label: 'NUEVO TORNEO' },
      });
      return;
    }

    advance(t);
    if (isChampion(t)) {
      end.show(result, {
        icon: 'trophy',
        title: '¡CAMPEÓN DEL TORNEO!',
        sub: 'Cuatro rondas, cero excusas. Bombazo mundial.',
        confetti: true,
        primary: { act: 'new-tournament', label: 'NUEVO TORNEO' },
      });
    } else {
      end.show(result, {
        icon: 'ticket',
        title: '¡CLASIFICADO!',
        sub: `Superaste ${STAGES[t.stage - 1]}. Ahora: ${currentStage(t)} contra ${teamById(currentRival(t)).name}.`,
        primary: { act: 'next', label: 'SIGUIENTE PARTIDO' },
      });
    }
  },
  onExit() {
    menu.refresh();
    show(menu.el);
  },
});

const end = createEndScreen({
  onAction(act) {
    if (act === 'menu') {
      menu.refresh();
      show(menu.el);
    } else if (act === 'rematch') {
      startQuickMatch();
    } else if (act === 'next') {
      startTournamentMatch();
    } else if (act === 'new-tournament') {
      session.tournament = createTournament(session.teamId);
      startTournamentMatch();
    }
  },
});

const screens = [menu.el, match.el, end.el];
app.append(...screens);

function show(target) {
  screens.forEach((s) => s.classList.toggle('active', s === target));
}

show(menu.el);
