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
- **P3a (cliente Supabase, dormido)**: `src/net/cloud.js` (lazy, degrada sin backend), overlay de ranking en el menú, `submitScore` al fin de partido, `supabase/migrations/0001_scores.sql`. Todo funciona **sin** backend (el juego no depende de él).

## ⛔ Bloqueado — necesita a Cristo
### P3b · Encender el ranking global (backend real)
Falta **acceso a Supabase**. Opciones:
1. Reconectar el **Supabase MCP** (estaba desconectado), o
2. Pasar `URL` + `anon key` de un proyecto Supabase.

Pasos una vez con acceso:
1. Crear/usar proyecto Supabase.
2. Aplicar `supabase/migrations/0001_scores.sql` (tabla `scores` + RLS + vista `leaderboard`).
3. Setear env en Vercel (production + preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Activar provider **Google** en Supabase Auth (para el login opcional).
5. Redeploy `v2` y verificar: `isConfigured()` true, login, leaderboard con tu fila.

### P4 · Multiplayer con salas/matchmaking
Más allá del duelo P2P por QR (WebRTC). Usará **Supabase Realtime** → depende de P3b.

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
