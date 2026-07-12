/**
 * Sala de duelo (anfitrión): muestra el QR y el código para que el rival
 * se una escaneando con la cámara del teléfono. qrcode se carga bajo demanda.
 */
import { fromHTML } from '../utils/dom.js';
import { icon } from '../art/icons.js';
import './DuelLobby.css';

export function createDuelLobby({ onCancel }) {
  const el = fromHTML(`
    <section class="screen lobby-screen">
      <div class="panel lobby-card">
        <h2 class="lobby-title">${icon('versus', 22)} DUELO 1 VS 1</h2>
        <p class="lobby-status" data-ref="status">Creando sala…</p>
        <div class="lobby-qr" data-ref="qr"></div>
        <div class="lobby-code" data-ref="code"></div>
        <p class="lobby-hint">Tu rival escanea el QR con la cámara del teléfono<br>o abre el enlace con el código.</p>
        <div class="lobby-actions">
          <button class="btn-ghost" data-ref="copy">Copiar enlace</button>
          <button class="btn-ghost" data-ref="cancel">Cancelar</button>
        </div>
      </div>
    </section>`);

  const refs = {};
  el.querySelectorAll('[data-ref]').forEach((node) => {
    refs[node.dataset.ref] = node;
  });

  let shareUrl = '';

  refs.cancel.addEventListener('click', () => onCancel());
  refs.copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      refs.copy.textContent = '¡Copiado!';
      setTimeout(() => (refs.copy.textContent = 'Copiar enlace'), 1500);
    } catch {
      refs.copy.textContent = shareUrl;
    }
  });

  function setStatus(text) {
    refs.status.textContent = text;
  }

  async function showCode(code, url) {
    shareUrl = url;
    refs.code.textContent = code.toUpperCase();
    setStatus('Esperando al rival…');
    const canvas = document.createElement('canvas');
    refs.qr.replaceChildren(canvas);
    const QRCode = (await import('qrcode')).default;
    await QRCode.toCanvas(canvas, url, {
      width: 216,
      margin: 1,
      color: { dark: '#081024', light: '#f4f7fb' },
    });
  }

  function reset() {
    shareUrl = '';
    refs.code.textContent = '';
    refs.qr.replaceChildren();
    setStatus('Creando sala…');
  }

  return { el, setStatus, showCode, reset };
}
