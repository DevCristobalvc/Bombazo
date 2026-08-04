# ⚽ BOMBAZO

Juego web arcade de **tandas de penales** estilo Copa Mundial FIFA 2026. Mobile-first, vertical, con todo el arte hecho en SVG propio.

> 📋 **Toda la especificación del juego está en [`idea.md`](./idea.md)** — concepto, mecánica de 9 zonas, IA por dificultad, dirección de arte, arquitectura y roadmap.

## Jugar

🎮 **https://bombazo-chi.vercel.app** — funciona como página web y como **PWA instalable** (en el teléfono: "Agregar a pantalla de inicio"; juega incluso sin conexión).

🧪 **v2 en pruebas: https://bombazo.devcristobalvc.com** — mecánica continua (sin casillas) y rediseño visual. Ver [Novedades v2](#novedades-v2).

## Estado

✅ **v1 lanzada como web + PWA.** Tanda completa con los 16 equipos reales de octavos del Mundial 2026, 3 dificultades, formato FIFA (corte anticipado + muerte súbita), modo torneo de 4 rondas, **duelo 1 vs 1 online por QR** (WebRTC peer-to-peer, sin backend), barra de potencia con timing, sonido sintetizado y estadísticas persistentes. Roadmap siguiente en `idea.md`: físicas de tiro (córners, tiros libres, swipe con efecto) y distribución en tiendas (TWA/Capacitor).

## Novedades v2

- **Atajar ya no es por casillas.** Arrastras al arquero a *cualquier* punto del arco y la atajada se decide por **distancia**: si el balón cae dentro del alcance de sus manos, la saca. El alcance es asimétrico a favor del humano (`AI_REACH` / `PLAYER_REACH` / `KEEPER_REACH` en `core/zones.js`): el arquero rival tiene menos alcance para que puedas marcar; tú, de arquero, tienes más para que atajar sea posible. En duelos humano-vs-humano el alcance es neutro.
- **IA continua** (`core/ai.js`): `keeperAim` y `shooterAim` apuntan a puntos `{x,y}` con un error que encoge con la dificultad, en lugar de razonar por zonas.
- **Balance por dificultad**, medido con `scripts/balance-sim.mjs` (simulación pura, sin navegador). Tasas actuales (fácil / medio / imposible):
  - Patear vs arquero → **% de gol ≈ 84 / 68 / 36**
  - Atajar vs rematador → **% de atajada ≈ 38 / 20 / 6**
- **Swipe con más efecto:** comba más notoria, la guía de trayectoria comunica la **potencia** (más gruesa y sólida cuanto más veloz el gesto) y la estela del balón crece con la potencia del tiro.

## Cómo correr

```bash
npm install
npm run dev       # desarrollo en http://localhost:5173
npm run build     # build de producción en dist/
npm run preview   # sirve el build en http://localhost:4173
```

## Arquitectura

Vite + vanilla JS por componentes, capas separadas con dependencias solo hacia abajo:

```
src/
├── data/        # equipos y dificultades (contenido)
├── core/        # reglas de la tanda e IA — lógica pura, sin DOM
├── art/         # identidad visual: SVG parametrizable por CSS vars
├── components/  # pantallas y piezas de UI, cada una con su CSS
└── styles/      # design tokens + base
```

El detalle completo está en `idea.md` §9.

## Stack

- HTML + CSS + JavaScript vanilla, build con Vite
- Arte 100% SVG propio (sin assets externos)
- Deploy: Vercel (sitio estático)
