# ⚽ BOMBAZO

Juego web arcade de **tandas de penales** estilo Copa Mundial FIFA 2026. Mobile-first, vertical, con todo el arte hecho en SVG propio.

> 📋 **Toda la especificación del juego está en [`idea.md`](./idea.md)** — concepto, mecánica de 9 zonas, IA por dificultad, dirección de arte, arquitectura y roadmap.

## Jugar

🎮 **https://bombazo-chi.vercel.app** — funciona como página web y como **PWA instalable** (en el teléfono: "Agregar a pantalla de inicio"; juega incluso sin conexión).

## Estado

✅ **v1 lanzada como web + PWA.** Tanda completa con los 16 equipos reales de octavos del Mundial 2026, 3 dificultades, formato FIFA (corte anticipado + muerte súbita), modo torneo de 4 rondas, **duelo 1 vs 1 online por QR** (WebRTC peer-to-peer, sin backend), barra de potencia con timing, sonido sintetizado y estadísticas persistentes. Roadmap siguiente en `idea.md`: físicas de tiro (córners, tiros libres, swipe con efecto) y distribución en tiendas (TWA/Capacitor).

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
