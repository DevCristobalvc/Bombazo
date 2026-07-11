/**
 * Punto de entrada: monta las tres pantallas y navega entre ellas.
 * El estado global es mínimo: la última configuración elegida (para la revancha).
 */
import './styles/tokens.css';
import './styles/base.css';
import { teamById } from './data/teams.js';
import { createMenuScreen } from './components/MenuScreen.js';
import { createMatchScreen } from './components/MatchScreen.js';
import { createEndScreen } from './components/EndScreen.js';

const app = document.getElementById('app');
let lastConfig = null;

const toMatchConfig = (c) => ({
  playerTeam: teamById(c.teamId),
  rivalTeam: teamById(c.rivalId),
  diff: c.diff,
});

const menu = createMenuScreen({
  onPlay(config) {
    lastConfig = config;
    show(match.el);
    match.start(toMatchConfig(config));
  },
});

const match = createMatchScreen({
  onFinish(result) {
    show(end.el);
    end.show(result);
  },
  onExit() {
    show(menu.el);
  },
});

const end = createEndScreen({
  onRematch() {
    show(match.el);
    match.start(toMatchConfig(lastConfig));
  },
  onMenu() {
    show(menu.el);
  },
});

const screens = [menu.el, match.el, end.el];
app.append(...screens);

function show(target) {
  screens.forEach((s) => s.classList.toggle('active', s === target));
}

show(menu.el);
