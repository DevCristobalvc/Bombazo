/**
 * Efectos de sonido sintetizados con WebAudio — cero assets externos.
 * El AudioContext se crea perezosamente en el primer sonido (tras un gesto
 * del usuario, como exige el navegador). Mute persistido en localStorage.
 */
let ctx = null;
let muted = false;
try {
  muted = localStorage.getItem('bombazo:muted') === '1';
} catch { /* localStorage bloqueado: sonido activado */ }

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem('bombazo:muted', value ? '1' : '0');
  } catch { /* sin persistencia */ }
}

function tone(freq, dur, { type = 'square', vol = 0.15, slideTo = null, at = 0 } = {}) {
  const a = audio();
  const t0 = a.currentTime + at;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Ruido filtrado: golpe de balón, ovación de la tribuna. */
function noise(dur, { vol = 0.12, at = 0, cutoff = 1200 } = {}) {
  const a = audio();
  const t0 = a.currentTime + at;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buffer = a.createBuffer(1, len, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const gain = a.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t0);
}

const guard = (fn) => (...args) => {
  if (muted) return;
  try {
    fn(...args);
  } catch { /* dispositivo sin audio: el juego sigue */ }
};

/* Murmullo continuo de la tribuna durante el partido (loop de ruido filtrado). */
let ambience = null;

export function startAmbience() {
  if (muted || ambience) return;
  try {
    const a = audio();
    const len = Math.floor(a.sampleRate * 2);
    const buffer = a.createBuffer(1, len, a.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = a.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 480;
    const gain = a.createGain();
    gain.gain.setValueAtTime(0.0001, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.022, a.currentTime + 1.2);
    src.connect(filter).connect(gain).connect(a.destination);
    src.start();
    ambience = { src, gain };
  } catch { /* sin audio */ }
}

export function stopAmbience() {
  if (!ambience) return;
  try {
    const a = audio();
    ambience.gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.6);
    const { src } = ambience;
    setTimeout(() => {
      try {
        src.stop();
      } catch { /* ya detenido */ }
    }, 700);
  } catch { /* sin audio */ }
  ambience = null;
}

export const sfx = {
  /** Silbatazo de inicio. */
  whistle: guard(() => {
    tone(2100, 0.14, { type: 'triangle', vol: 0.14 });
    tone(2100, 0.24, { type: 'triangle', vol: 0.14, at: 0.2 });
  }),
  /** Golpe al balón. */
  kick: guard(() => {
    tone(150, 0.12, { type: 'sine', vol: 0.3, slideTo: 55 });
    noise(0.06, { vol: 0.1, cutoff: 900 });
  }),
  /** Gol propio: arpegio + ovación. */
  goal: guard(() => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, { at: i * 0.09, vol: 0.16 }));
    noise(1.1, { vol: 0.09, at: 0.05, cutoff: 1500 });
  }),
  /** Balón al palo o travesaño: golpe metálico seco. */
  post: guard(() => {
    tone(1500, 0.07, { type: 'square', vol: 0.18, slideTo: 760 });
    tone(950, 0.13, { type: 'triangle', vol: 0.12, at: 0.02 });
  }),
  /** Manotazo del arquero. */
  save: guard(() => {
    tone(200, 0.09, { vol: 0.2, slideTo: 120 });
    noise(0.25, { vol: 0.12, cutoff: 700 });
  }),
  /** Ovación de la tribuna (atajada propia, tiro rival afuera). */
  cheer: guard(() => {
    noise(0.9, { vol: 0.09, cutoff: 1600 });
  }),
  /** Momento en contra: gol rival o tiro propio atajado. */
  fail: guard(() => {
    tone(330, 0.35, { type: 'sawtooth', vol: 0.12, slideTo: 130 });
  }),
  /** Tensión de muerte súbita. */
  sudden: guard(() => {
    [392, 370, 349].forEach((f, i) => tone(f, 0.16, { at: i * 0.14, vol: 0.13 }));
  }),
  /** Fanfarria del campeón. */
  fanfare: guard(() => {
    [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, { at: i * 0.11, vol: 0.15 }));
    noise(1.4, { vol: 0.08, at: 0.1, cutoff: 1800 });
  }),
};
