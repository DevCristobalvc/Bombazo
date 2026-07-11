/**
 * Marcador de la tanda: bandera, código, puntos (gol/fallo/en disputa) y total.
 * Crece solo en muerte súbita.
 */
import { fromHTML } from '../utils/dom.js';
import { flagSVG } from '../art/flags.js';
import { KICKS_REGULATION } from '../core/shootout.js';
import './Scoreboard.css';

export function createScoreboard() {
  const el = fromHTML('<div class="scoreboard"></div>');

  function dotsFor(row) {
    const total = Math.max(KICKS_REGULATION, row.kicks.length + (row.active ? 1 : 0));
    let out = '';
    for (let i = 0; i < total; i++) {
      let cls = '';
      if (i < row.kicks.length) cls = row.kicks[i] ? 'goal' : 'fail';
      else if (row.active && i === row.kicks.length) cls = 'now';
      out += `<i class="dot ${cls}"></i>`;
    }
    return out;
  }

  function update({ rows }) {
    el.innerHTML = rows
      .map(
        (row) => `
        <div class="sb-row ${row.active ? 'is-active' : ''}">
          <span class="sb-flag">${flagSVG(row.team.id, 30, 20)}</span>
          <span class="sb-name">${row.team.short}</span>
          <span class="sb-dots">${dotsFor(row)}</span>
          <span class="sb-score">${row.score}</span>
        </div>`
      )
      .join('');
  }

  return { el, update };
}
