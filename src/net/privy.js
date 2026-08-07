/**
 * Wrapper vanilla de Privy. El juego habla SOLO con este módulo; el island de
 * React (privyBridge) se carga diferido en el primer login. El App ID es público
 * (seguro en el cliente); el App SECRET jamás vive en el frontend.
 *
 * Login OPCIONAL: el juego se juega sin cuenta. Privy sirve para tener identidad
 * real (email/teléfono/Google/wallet) y conservar el puesto del ranking entre
 * dispositivos. El puente con Supabase (token → RLS) se hace en net/cloud.js.
 */
const APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cmsi9drpc030y0dl7ab6am5c1';

let controls = null;
let state = { ready: false, authenticated: false, user: null };
const subs = new Set();

export function isPrivyConfigured() {
  return Boolean(APP_ID);
}

/** Suscribe a cambios de sesión; devuelve unsubscribe. Emite el estado actual ya. */
export function onPrivyChange(fn) {
  subs.add(fn);
  fn(state);
  return () => subs.delete(fn);
}

export function privyState() {
  return state;
}

async function ensure() {
  if (controls) return controls;
  const { mountPrivy } = await import('./privyBridge.js');
  let el = document.getElementById('privy-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'privy-root';
    // El modal de Privy se renderiza por portal a <body>, así que ocultar este
    // contenedor no lo esconde.
    el.style.display = 'none';
    document.body.appendChild(el);
  }
  controls = mountPrivy(el, {
    appId: APP_ID,
    onChange: (s) => {
      state = s;
      subs.forEach((fn) => fn(state));
    },
  });
  return controls;
}

/** Abre el modal de login de Privy (carga el island la primera vez). */
export async function privyLogin() {
  const c = await ensure();
  c.login();
}

export async function privyLogout() {
  const c = await ensure();
  c.logout();
}

/** Token de acceso (JWT) del usuario logueado, o null. Lo usa Supabase (RLS). */
export async function getPrivyAccessToken() {
  if (!controls) return null;
  try {
    return await controls.getAccessToken();
  } catch {
    return null;
  }
}

/** Etiqueta legible del usuario para la UI (email, teléfono, etc.). */
export function privyUserLabel() {
  const u = state.user;
  if (!u) return null;
  return (
    u.email?.address ||
    u.phone?.number ||
    u.google?.email ||
    (u.wallet?.address ? u.wallet.address.slice(0, 6) + '…' : null) ||
    'Jugador'
  );
}

/** DID estable del usuario Privy (identidad cross-device). */
export function privyUserId() {
  return state.user?.id || null;
}
