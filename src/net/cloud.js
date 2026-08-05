/**
 * Cliente de nube (Supabase) — P3. Se activa SOLO si hay credenciales en el
 * entorno (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Si no, todo degrada
 * con gracia: el juego sigue 100% jugable sin login ni backend.
 * El SDK se carga de forma diferida (dynamic import) para no engordar el
 * bundle base cuando no hay backend configurado.
 */
const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  const uid = data.session?.user?.id;
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
