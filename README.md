# ⚽ BOMBAZO

Juego web arcade de **tandas de penales** estilo Copa Mundial FIFA 2026. Mobile-first, vertical, con todo el arte hecho en SVG propio.

> 📋 **Toda la especificación del juego está en [`idea.md`](./idea.md)** — concepto, mecánica de 9 zonas, IA por dificultad, dirección de arte, arquitectura y roadmap.

## Estado

✅ **Fase 1 — MVP jugable.** Tanda completa contra la máquina con 5 selecciones, 3 dificultades, formato FIFA (corte anticipado + muerte súbita).

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
