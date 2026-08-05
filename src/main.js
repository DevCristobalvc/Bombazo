/**
 * Punto de entrada: monta las pantallas, navega entre ellas y orquesta
 * los modos de juego (partido rápido, torneo y duelo 1 vs 1 por WebRTC).
 */
import './styles/tokens.css';
import './styles/base.css';
import { teamById } from './data/teams.js';
import { createTournament, currentRival, currentStage, advance, isChampion, STAGES } from './core/tournament.js';
import { recordResult, loadStats, rankFor } from './core/stats.js';
import { submitScore } from './net/cloud.js';
import { loadProfile } from './core/profile.js';
import { applyReduceMotion } from './core/settings.js';
import { createMenuScreen } from './components/MenuScreen.js';
import { createMatchScreen } from './components/MatchScreen.js';
import { createEndScreen } from './components/EndScreen.js';
import { createDuelLobby } from './components/DuelLobby.js';
import { createJoinScreen } from './components/JoinScreen.js';

const app = document.getElementById('app');
applyReduceMotion(); // aplica la preferencia guardada de reducir movimiento
let session = null; // { mode, teamId, rivalId, diff, tournament? }
let matchStartXp = 0; // XP al empezar el partido, para calcular lo ganado y detectar subidas de rango
let duel = null; // sesión WebRTC activa (net/duel)
let duelCtx = null; // { isHost, myTeamId, rivalTeamId }

/* ---------- Partidos ---------- */

const QUICK_MODES = {
  corners: { mode: 'corners', stageLabel: 'CÓRNERS' },
  libres: { mode: 'libres', stageLabel: 'TIROS LIBRES' },
  rapido: { mode: 'penales', stageLabel: null },
};

function startQuickMatch() {
  const cfg = QUICK_MODES[session.mode] ?? QUICK_MODES.rapido;
  show(match.el);
  match.start({
    playerTeam: teamById(session.teamId),
    rivalTeam: teamById(session.rivalId),
    diff: session.diff,
    mode: cfg.mode,
    stageLabel: cfg.stageLabel,
    profile: loadProfile(),
  });
}

function startTournamentMatch() {
  const t = session.tournament;
  matchStartXp = loadStats().xp; // cada ronda cuenta su propia ganancia
  show(match.el);
  match.start({
    playerTeam: teamById(t.playerTeamId),
    rivalTeam: teamById(currentRival(t)),
    diff: session.diff,
    stageLabel: currentStage(t),
    profile: loadProfile(),
  });
}

const DUEL_LABELS = {
  penales: 'DUELO 1 VS 1',
  corners: 'DUELO · CÓRNERS',
  libres: 'DUELO · TIROS LIBRES',
};

function startDuelMatch() {
  const mode = duelCtx.mode ?? 'penales';
  show(match.el);
  match.start({
    playerTeam: teamById(duelCtx.myTeamId),
    rivalTeam: teamById(duelCtx.rivalTeamId),
    diff: 'duelo',
    mode,
    stageLabel: DUEL_LABELS[mode] ?? DUEL_LABELS.penales,
    duel,
    isHost: duelCtx.isHost,
    profile: loadProfile(),
    rivalProfile: duelCtx.rivalProfile ?? null,
  });
}

/* ---------- Duelo: conexión ---------- */

function closeDuel() {
  duel?.close();
  duel = null;
  duelCtx = null;
}

function handleDuelData(msg) {
  if (msg.t !== 'hello' || !duelCtx || duelCtx.rivalTeamId) return;
  // El anfitrión define la disciplina del duelo; el invitado la adopta del hello
  if (duelCtx.isHost) duel.send({ t: 'hello', team: duelCtx.myTeamId, profile: loadProfile(), mode: duelCtx.mode });
  else duelCtx.mode = msg.mode ?? 'penales';
  duelCtx.rivalTeamId = msg.team;
  duelCtx.rivalProfile = msg.profile ?? null;
  startDuelMatch();
}

function handleDuelClose() {
  if (match.isRunning() && duelCtx) {
    // El rival se fue a mitad del duelo
    match.walkover();
  } else if (duelCtx && !match.isRunning()) {
    if (lobby.el.classList.contains('active') || joinScr.el.classList.contains('active')) {
      // Se cayó la conexión en la sala: volver al menú
      backToMenu();
    } else if (end.el.classList.contains('active')) {
      // El rival se fue desde la pantalla final: ya no hay revancha posible
      end.setStatus('El rival abandonó la sala.');
    }
  }
  duel = null;
}

async function startHosting(config) {
  const { hostDuel } = await import('./net/duel.js');
  lobby.reset();
  show(lobby.el);
  duelCtx = { isHost: true, myTeamId: config.teamId, rivalTeamId: null, mode: config.duelMode ?? 'penales' };
  duel = hostDuel({
    onCode(code) {
      lobby.showCode(code, `${location.origin}/#d=${code}`);
    },
    onData: handleDuelData,
    onClose: handleDuelClose,
    onError() {
      lobby.setStatus('Error de conexión. Cancela y vuelve a intentar.');
    },
  });
}

async function startJoining({ teamId, code }) {
  const { joinDuel } = await import('./net/duel.js');
  duelCtx = { isHost: false, myTeamId: teamId, rivalTeamId: null };
  duel = joinDuel(code, {
    onOpen() {
      duel.send({ t: 'hello', team: teamId, profile: loadProfile() });
      joinScr.setStatus('Conectado. Esperando al anfitrión…');
    },
    onData: handleDuelData,
    onClose: handleDuelClose,
    onError() {
      joinScr.setStatus('No se encontró la sala. Revisa el código o pide otro QR.');
    },
  });
}

/* ---------- Pantallas ---------- */

function startLocalMatch() {
  show(match.el);
  match.start({
    playerTeam: teamById(session.teamId),
    rivalTeam: teamById(session.rivalId),
    diff: 'local',
    mode: 'local',
    stageLabel: '2 JUGADORES',
    profile: loadProfile(),
  });
}

const menu = createMenuScreen({
  onPlay(config) {
    session = config;
    matchStartXp = loadStats().xp;
    if (config.mode === 'torneo') {
      session.tournament = createTournament(config.teamId);
      startTournamentMatch();
    } else if (config.mode === 'duelo') {
      startHosting(config);
    } else if (config.mode === 'local') {
      startLocalMatch();
    } else {
      startQuickMatch(); // penales, córners o tiros libres contra la IA
    }
  },
});

/** Llave visual del torneo: estado de cada ronda según el avance.
    Los rivales futuros aún no existen (emergen del bracket simulado). */
function buildBracket(t, lostCurrent) {
  return STAGES.map((label, i) => ({
    label,
    team: t.rivals[i] ? teamById(t.rivals[i]) : null,
    state: i < t.stage ? 'won' : i === t.stage ? (lostCurrent ? 'lost' : 'next') : 'pending',
  }));
}

const match = createMatchScreen({
  onFinish(result) {
    if (session?.mode !== 'local') {
      const after = recordResult(result.won); // hot-seat no cuenta en tus stats
      result.points = after.xp - matchStartXp;
      result.rank = rankFor(after.xp);
      result.rankUp = rankFor(matchStartXp).index < result.rank.index ? result.rank : null;
      // Sube tu XP al ranking global (no-op sin backend/login)
      submitScore({ name: loadProfile().name || 'Jugador', xp: after.xp }).catch(() => {});
    }
    show(end.el);

    if (session?.mode === 'local') {
      const winner = result.won ? result.playerTeam : result.rivalTeam;
      end.show(result, {
        icon: 'trophy',
        title: `¡GANÓ ${winner.short}!`,
        sub: 'Cara a cara en el mismo teléfono. ¿La revancha?',
        confetti: true,
        primary: { act: 'local-rematch', label: 'REVANCHA' },
      });
      return;
    }

    if (duelCtx) {
      const canRematch = !result.walkover && duel;
      end.show(result, {
        icon: result.won ? 'trophy' : 'sadball',
        title: result.walkover ? 'RIVAL DESCONECTADO' : result.won ? '¡GANASTE EL DUELO!' : 'PERDISTE EL DUELO',
        sub: result.walkover
          ? 'Tu rival abandonó la sala. Victoria por retiro.'
          : result.won
            ? 'Cara a cara y te quedaste con el bombazo.'
            : 'Tu rival estuvo más fino. Pide la revancha.',
        confetti: result.won && !result.walkover,
        primary: canRematch ? { act: 'duel-rematch', label: 'REVANCHA' } : { act: 'menu', label: 'MENÚ' },
      });
      if (!canRematch) closeDuel();
      return;
    }

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
        bracket: buildBracket(t, true),
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
        bracket: buildBracket(t, false),
        primary: { act: 'new-tournament', label: 'NUEVO TORNEO' },
      });
    } else {
      end.show(result, {
        icon: 'ticket',
        title: '¡CLASIFICADO!',
        sub: `Superaste ${STAGES[t.stage - 1]}. Ahora: ${currentStage(t)} contra ${teamById(currentRival(t)).name}.`,
        bracket: buildBracket(t, false),
        primary: { act: 'next', label: 'SIGUIENTE PARTIDO' },
      });
    }
  },
  onExit() {
    closeDuel();
    backToMenu();
  },
});

let awaitingRematch = false;

/** Revancha de duelo sobre la misma conexión: ambos deben pedirla. */
async function requestDuelRematch() {
  if (!duel) {
    backToMenu();
    return;
  }
  if (awaitingRematch) return;
  awaitingRematch = true;
  end.setStatus('Esperando la revancha del rival…');
  duel.send({ t: 'rematch' });
  const answer = await duel.next('rematch');
  awaitingRematch = false;
  if (!answer || !duel) {
    end.setStatus('El rival abandonó la sala.');
    return;
  }
  end.setStatus('');
  startDuelMatch();
}

const end = createEndScreen({
  onAction(act) {
    if (act === 'menu') {
      closeDuel();
      backToMenu();
    } else if (act === 'rematch') {
      startQuickMatch();
    } else if (act === 'local-rematch') {
      startLocalMatch();
    } else if (act === 'duel-rematch') {
      requestDuelRematch();
    } else if (act === 'next') {
      startTournamentMatch();
    } else if (act === 'new-tournament') {
      session.tournament = createTournament(session.teamId);
      startTournamentMatch();
    }
  },
});

const lobby = createDuelLobby({
  onCancel() {
    closeDuel();
    backToMenu();
  },
});

const joinScr = createJoinScreen({
  onJoin(payload) {
    startJoining(payload);
  },
  onCancel() {
    closeDuel();
    history.replaceState(null, '', location.pathname);
    backToMenu();
  },
});

const screens = [menu.el, match.el, end.el, lobby.el, joinScr.el];
app.append(...screens);

function show(target) {
  screens.forEach((s) => s.classList.toggle('active', s === target));
}

function backToMenu() {
  menu.refresh();
  show(menu.el);
}

/* ---------- Arranque: enlace de invitación (#d=CODIGO) o menú ---------- */

const inviteCode = location.hash.match(/^#d=([a-z0-9]+)$/i)?.[1];
if (inviteCode) {
  joinScr.open(inviteCode);
  history.replaceState(null, '', location.pathname);
  show(joinScr.el);
} else {
  show(menu.el);
}
