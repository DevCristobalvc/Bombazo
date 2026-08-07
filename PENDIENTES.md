# Bombazo — Pendientes y estado (rama `v2`)

> Documento vivo del estado del proyecto y lo que falta. v2 se prueba en
> **https://bombazo.devcristobalvc.com** (atada a la rama `v2` en Vercel).
> Producción v1 sigue en https://bombazo-chi.vercel.app (rama `main`). **No tocar `main`.**

## ✅ Hecho en v2
- **Mecánica continua** (sin casillas): atajada/gol por distancia (`core/zones.js` reach por-rol, `core/physics.js isSaved`), IA continua (`core/ai.js keeperAim/shooterAim`), arrastre libre del arquero.
- **Balance por dificultad** afinado con `scripts/balance-sim.mjs` (patear %gol ~84/68/36, atajar %atajada ~38/20/6).
- **Rediseño visual** (estadio, personajes), **animaciones** y **juice** (confeti, destello, splash VS, spin del balón, sombra dinámica), **a11y** `prefers-reduced-motion`.
- **Menú vendible**: CTA footer sticky, personalización colapsable, jerarquía.
- **Swipe con efecto** (comba, potencia en la guía, estela por potencia).
- **31 selecciones** (16 reales + 15 añadidas) con banderas SVG. Torneo robusto para cualquier equipo.
- **Retención**: puntaje/rango (Amateur→Leyenda), estadísticas de vida, 8 logros, **reto del día** con racha, compartir resultado (Web Share), instalar PWA.
- **Perfil**: código export/import + respaldo por archivo (`core/account.js`).
- **P3 · Ranking global (HECHO, en producción v2)**: proyecto Supabase `bombazo` (ref `egwxmsrdydjlpbhaplob`), `0001_scores.sql` aplicada (tabla `scores` + RLS + vista `leaderboard`), auth anónima activada. Se juega y compite **sin login** (sesión anónima al enviar el puntaje); Google opcional. Leaderboard público visible directo. `src/net/cloud.js` con fallback público de URL + anon key (clave pública protegida por RLS; overrideable con `VITE_SUPABASE_*`). Verificado end-to-end en vivo.
- **Login con Privy (HECHO, opcional)**: `src/net/privyBridge.js` (island React aislado, único punto con React, lazy) + `src/net/privy.js` (wrapper vanilla). Botón "Iniciar sesión" en el ranking (Google alternativo). App ID público. Todo el stack React+Privy+web3 va a un chunk `login-*` lazy **excluido del precache** (instalación PWA ~512KB). Dominio de prod ya whitelisteado en Privy.

## ⛔ Bloqueado — necesita a Cristo
### Puente Privy → Supabase (persistencia cross-device real)
El login de Privy ya funciona, pero **estar conectado aún no conserva el puesto entre dispositivos**: el puntaje se sigue enviando anónimo (el copy NO promete cross-device todavía). Falta el puente, que es un cambio **atómico** de auth en vivo y necesita **a Cristo presente** para verificar el login de Privy en el **dominio real** (localhost no puede: CSP de Privy no whitelistea localhost). Factibilidad ya confirmada por API (endpoint `third-party-auth` responde; JWKS de Privy accesible).

Runbook (una sola sesión, en orden):
1. Aplicar `supabase/migrations/0002_privy_identity.sql` (user_id→text, RLS unificado `coalesce(auth.jwt()->>'sub', auth.uid()::text)`).
2. **Verificar que el ranking ANÓNIMO sigue verde** (test node con anon key: signInAnonymously → upsert → leaderboard). Si rompe, revertir 0002.
3. Configurar Third-Party Auth (Privy) en Supabase: `POST /v1/projects/<ref>/config/auth/third-party-auth` con el issuer/JWKS de Privy (`https://auth.privy.io/api/v1/apps/<APP_ID>/jwks.json`, iss `privy.io`).
4. En `net/cloud.js`: pasar `accessToken: () => getPrivyAccessToken()` al `createClient` cuando haya sesión Privy, y en `submitScore` usar el DID de Privy como `user_id` si está logueado.
5. Actualizar copy del ranking (ya sí "tu puesto se conserva entre dispositivos").
6. Verificar en el dominio real: login Privy → jugar → aparece en leaderboard; y desde otro dispositivo, misma cuenta = mismo puesto.

### P4 · Multiplayer con salas/matchmaking
Más allá del duelo P2P por QR (WebRTC). Usará **Supabase Realtime** (backend ya disponible).

### P5 · Publicidad
Decidir red: **AdSense** (web) o **AdMob** (si empaquetamos TWA/Capacitor). Intersticial entre tandas / banner no intrusivo. Necesita decisión de Cristo.

## 🟡 Ideas sin backend (cola, valor decreciente)
- Bono de XP al desbloquear un logro.
- Onboarding de primera vez (tutorial más guiado).
- Pulir/ampliar SFX.
- Más selecciones (solo quedan banderas con escudos complejos: Croacia, Corea, Irán, Arabia → difíciles a 26px).

## 🧪 Verificación (antes de cada commit)
- `npm run build`
- `node scripts/smoke.cjs` (arrancar `npm run preview` en background antes; usa playwright-core de `barberia`)
- Si se toca `core/`: `node scripts/physics-check.mjs` y `node scripts/balance-sim.mjs` (sin regresión de balance)
- Otros smoke: `bracket-check`, `duel-check`, `corners-check`, `libres-check`, `local-check`, `profile-check` (todos migrados al arrastre).

## 📌 Reglas de trabajo
- Un cambio verificado por commit, push a `v2`. **Nunca** `main`.
- No provisionar servicios de pago sin OK de Cristo.
