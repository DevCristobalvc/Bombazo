/**
 * Cliente de nube (Supabase) — P3. Se activa SOLO si hay credenciales en el
 * entorno (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Si no, todo degrada
 * con gracia: el juego sigue 100% jugable sin login ni backend.
 * El SDK se carga de forma diferida (dynamic import) para no engordar el
 * bundle base cuando no hay backend configurado.
 */
// Fallback publico (anon key es clave publica protegida por RLS). Se puede
// overridear con VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en Vercel.
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://egwxmsrdydjlpbhaplob.supabase.co';
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnd3htc3JkeWRqbHBiaGFwbG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNTk3NjUsImV4cCI6MjEwMTYzNTc2NX0.k8mYbzyGBvD5ppLqu4IxqtwZowCjSwKJrXF6zkSDMmc';

let clientPromise = null;

/** ¿Hay backend configurado? Todo lo demás lo respeta. */
export function isConfigured() {
  return Boolean(URL && ANON);
}

async function client() {
  if (!isConfigured()) return null;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL, ANON, { auth: { persistSession: true, autoRefreshToken: true } })
    );
  }
  return clientPromise;
}

/** Sesión actual (o null si no hay login / no hay backend). */
export async function getSession() {
  const c = await client();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  return data.session ?? null;
}

/** Login opcional con Google (OAuth redirect). */
export async function signInWithGoogle() {
  const c = await client();
  if (!c) return;
  await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin } });
}

export async function signOut() {
  const c = await client();
  if (!c) return;
  await c.auth.signOut();
}

/**
 * Sube tu mejor puntaje al ranking global. Requiere sesión (login).
 * Sin backend o sin login → { ok:false, reason }.
 */
export async function submitScore({ name, xp }) {
  const c = await client();
  if (!c) return { ok: false, reason: 'no-backend' };
  const { data } = await c.auth.getSession();
  let uid = data.session?.user?.id;
  // Login opcional: si no hay sesión, entra anónimo para poder competir en el
  // ranking sin fricción (luego puede vincular una cuenta Google si quiere).
  if (!uid) {
    const { data: anon, error: aerr } = await c.auth.signInAnonymously();
    if (aerr) return { ok: false, reason: aerr.message };
    uid = anon.user?.id;
  }
  if (!uid) return { ok: false, reason: 'no-auth' };
  const { error } = await c
    .from('scores')
    .upsert({ user_id: uid, name: (name || 'Jugador').slice(0, 24), xp }, { onConflict: 'user_id' });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

/** Top del ranking global (vista `leaderboard`). [] si no hay backend. */
export async function fetchLeaderboard(limit = 20) {
  const c = await client();
  if (!c) return [];
  const { data, error } = await c.from('leaderboard').select('*').limit(limit);
  return error ? [] : (data ?? []);
}
