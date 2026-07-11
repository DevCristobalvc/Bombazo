/** Anuncios gigantes de resultado ("¡GOOOOL!", "¡ATAJADÓN!"…) sobre la cancha. */
import { fromHTML, sleep } from '../utils/dom.js';
import './Announcer.css';

export function createAnnouncer() {
  const el = fromHTML('<div class="announcer" aria-live="polite"></div>');

  async function say(text, type = 'info', ms = 950) {
    el.textContent = text;
    el.className = `announcer show ${type}`;
    await sleep(ms);
    el.className = 'announcer';
  }

  return { el, say };
}
