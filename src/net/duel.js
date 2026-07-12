/**
 * Duelo 1 vs 1 por WebRTC (peer-to-peer, sin backend propio).
 * PeerJS aporta solo la señalización inicial (nube pública gratuita, sin
 * API key); después del apretón de manos todo el juego viaja directo
 * entre los dos navegadores por un DataChannel.
 *
 * API: hostDuel(cb) / joinDuel(code, cb) → { code, send(obj), next(type), close() }
 * - send: envía un mensaje JSON al rival.
 * - next(type): promesa con el próximo mensaje de ese tipo (bufferea si ya llegó).
 *   Resuelve null si la conexión se cierra.
 * - cb: { onCode, onOpen, onData, onClose, onError }
 */
import Peer from 'peerjs';

const PREFIX = 'bombazo-duelo-';
const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'; // sin caracteres ambiguos

function shortCode(len = 6) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

/** Cola de mensajes por tipo + notificación de cierre. */
function createSession(cb) {
  const queues = {};
  const waiters = {};
  let conn = null;
  let peer = null;
  let closed = false;

  function push(raw) {
    let msg;
    try {
      msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return;
    }
    if (!msg || typeof msg.t !== 'string') return;
    cb.onData?.(msg);
    if (waiters[msg.t]?.length) waiters[msg.t].shift()(msg);
    else (queues[msg.t] ??= []).push(msg);
  }

  function handleClosed() {
    if (closed) return;
    closed = true;
    Object.values(waiters).forEach((list) => list.splice(0).forEach((resolve) => resolve(null)));
    cb.onClose?.();
  }

  function bindConn(c) {
    conn = c;
    c.on('data', push);
    c.on('close', handleClosed);
    c.on('error', handleClosed);
  }

  const api = {
    code: null,
    send(obj) {
      try {
        conn?.send(JSON.stringify(obj));
      } catch { /* conexión caída: lo detecta onClose */ }
    },
    next(type) {
      if (queues[type]?.length) return Promise.resolve(queues[type].shift());
      if (closed) return Promise.resolve(null);
      return new Promise((resolve) => (waiters[type] ??= []).push(resolve));
    },
    close() {
      closed = true;
      Object.values(waiters).forEach((list) => list.splice(0).forEach((resolve) => resolve(null)));
      try {
        peer?.destroy();
      } catch { /* ya destruido */ }
    },
  };

  return { api, bindConn, handleClosed, setPeer: (p) => (peer = p), hasConn: () => conn !== null };
}

/** Crea la sala. El código corto identifica al anfitrión en la señalización. */
export function hostDuel(cb) {
  const session = createSession(cb);
  let attempts = 0;

  function tryOpen() {
    const code = shortCode();
    const peer = new Peer(PREFIX + code);
    session.setPeer(peer);

    peer.on('open', () => {
      session.api.code = code;
      cb.onCode?.(code);
    });

    peer.on('connection', (c) => {
      if (session.hasConn()) {
        c.close();
        return;
      }
      c.on('open', () => cb.onOpen?.());
      session.bindConn(c);
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id' && attempts < 3) {
        attempts += 1;
        tryOpen(); // colisión de código: genera otro
        return;
      }
      cb.onError?.(err);
      session.handleClosed();
    });

    peer.on('disconnected', () => peer.reconnect?.());
  }

  tryOpen();
  return session.api;
}

/** Se une a la sala del anfitrión usando el código del QR. */
export function joinDuel(code, cb) {
  const session = createSession(cb);
  const peer = new Peer();
  session.setPeer(peer);
  session.api.code = code;

  peer.on('open', () => {
    const c = peer.connect(PREFIX + code.toLowerCase().trim(), { reliable: true });
    c.on('open', () => {
      cb.onOpen?.();
    });
    session.bindConn(c);
  });

  peer.on('error', (err) => {
    cb.onError?.(err);
    session.handleClosed();
  });

  return session.api;
}
