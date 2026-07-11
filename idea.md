# ⚽ BOMBAZO — Tanda de Penales estilo Mundial

> Documento maestro de diseño y desarrollo. Todo lo que hay que construir está aquí.
> Autor de la idea: Cristóbal (@DevCristobalvc) · Redacción y diseño técnico: Claude (Fable 5)
> Fecha: 2026-07-11 · Versión: 1.0

---

## 1. Concepto

**Bombazo** es un juego web arcade de **tandas de penales** ambientado en los octavos de final de la **Copa Mundial FIFA 2026**. El jugador elige su selección, elige al rival, elige la dificultad, y disputa una tanda de penales completa contra la máquina: **patea un tiro, ataja un tiro**, alternando, hasta definir un ganador.

Principios de diseño:

- **Mobile-first y vertical**: el juego se piensa para jugarse con una mano, en orientación vertical (portrait). En desktop se centra el contenedor y el fondo se expande a los lados (responsive).
- **Arcade puro**: partidas de 1–3 minutos, feedback inmediato, cero fricción. Sin login, sin tutorial largo — se aprende tocando.
- **Todo el arte es propio**: sprites, estadio, banderas y balón se dibujan en **SVG** generado a mano (nada de assets con licencia dudosa). Estilo cartoon plano, colores vivos, vibra de mundial.
- **Cero dependencias en la v1**: HTML + CSS + JavaScript vanilla. Sin build step. Deployable como sitio estático en Vercel.

---

## 2. Equipos (v1)

Los 5 clasificados a octavos disponibles en la primera versión. **Colombia es el equipo por defecto** del jugador.

| Equipo | Código | Camiseta | Acento | Pantaloneta | Medias | Bandera |
|---|---|---|---|---|---|---|
| 🇨🇴 Colombia (default) | COL | Amarillo `#FFD100` | Azul `#003893` | Azul `#003893` | Rojo `#C8102E` | Tricolor horizontal (amarillo 50%, azul 25%, rojo 25%) |
| 🇪🇸 España | ESP | Rojo `#C8102E` | Amarillo `#FFC72C` | Azul oscuro `#1A2A6C` | Rojo | Rojo-amarillo-rojo horizontal |
| 🇵🇹 Portugal | POR | Vino `#B00A24` | Verde `#046A38` | Verde | Vino | Verde 2/5 + rojo 3/5 vertical, esfera amarilla |
| 🇫🇷 Francia | FRA | Azul `#0055A4` | Blanco `#FFFFFF` | Blanco | Rojo `#EF4135` | Azul-blanco-rojo vertical |
| 🇨🇭 Suiza | SUI | Rojo `#DA291C` | Blanco | Blanco | Rojo | Rojo con cruz blanca |

Reglas de selección:

- El jugador elige **su equipo** y **el rival**; no pueden ser el mismo (si cambia su equipo al que era el rival, el rival rota automáticamente al siguiente disponible).
- Cada equipo define además un color de **kit de arquero** propio y contrastante (los arqueros nunca visten igual que los jugadores de campo).
- La estructura de datos de equipos debe ser extensible: agregar una selección nueva = agregar una entrada al diccionario `TEAMS` (colores + bandera SVG), sin tocar lógica.

---

## 3. Flujo de pantallas

```
[MENÚ] ──¡A la cancha!──▶ [PARTIDO: tanda de penales] ──fin──▶ [RESULTADO]
   ▲                                                                │
   └────────────── Menú ◀── Revancha (mismos ajustes) ◀─────────────┘
```

### 3.1 Pantalla MENÚ

- Logo grande **BOMBAZO** (tipografía display tipo arcade, p.ej. *Luckiest Guy*), tagline: "Tanda de penales · Octavos del Mundial 2026".
- **En el centro aparece tu jugador**: personaje genérico cartoon (SVG, vista frontal, sonriente, con balón al pie) vestido con la camiseta del equipo seleccionado. Al cambiar de equipo, el uniforme del personaje cambia en vivo. (Más adelante este personaje será customizable — ver backlog).
- Tres selectores tipo chips/píldoras:
  1. **Tu selección** (default: Colombia) — chip con mini-bandera SVG + nombre.
  2. **Rival** (default: la primera distinta a la tuya) — el chip de tu propio equipo aparece deshabilitado.
  3. **Dificultad**: `Fácil 😅` / `Medio 😼` / `Imposible 💀` (default: Medio).
- Línea "COL 🆚 FRA" que refleja la elección actual.
- Botón grande **¡A LA CANCHA!**
- Texto corto de cómo jugar (2 líneas máximo).

### 3.2 Pantalla PARTIDO

Layout vertical, de arriba hacia abajo:

1. **Marcador** (sticky arriba): dos filas (tú / rival) con bandera, código del equipo, **5 puntos de tanda** (gris = pendiente, verde = gol, rojo = fallado; el punto en disputa lleva anillo destacado) y el marcador numérico. En muerte súbita se agregan puntos extra a la derecha.
2. **Mensaje de fase**: "Penal 3 — ¡Tú pateas!" / "Penal 3 — ¡Te toca atajar!", con subtítulo de instrucción ("Toca la casilla para colocar tu remate" / "Toca la casilla hacia donde volarás").
3. **La cancha (escena SVG)**: vista desde el punto penal hacia el arco. Contiene cielo nocturno con luces de estadio, tribuna con multitud (patrón de puntos), valla publicitaria con "BOMBAZO", arco con palos, travesaño y red (patrón), césped con franjas de corte, línea de gol, punto penal, **arquero** al centro del arco y **pateador** (vista de espaldas, con el 10) junto al balón.
4. **Botón ✕** discreto para abandonar y volver al menú.

### 3.3 Pantalla RESULTADO

- Si ganas: 🏆 "¡CAMPEÓN!" + mensaje celebratorio. Si pierdes: 😭 + mensaje de ánimo.
- Marcador final grande: "Colombia 4 – 2 Francia" con banderas.
- Recap de los puntos de la tanda de ambos equipos.
- Botones: **Revancha** (misma configuración) y **Menú**.

---

## 4. La grilla de 9 zonas (mecánica central)

El arco se divide en una grilla invisible de **3 columnas × 3 filas = 9 casillas**:

```
┌─────────────┬─────────────┬─────────────┐
│ 0 Arriba    │ 1 Arriba    │ 2 Arriba    │
│   izquierda │   centro    │   derecha   │
├─────────────┼─────────────┼─────────────┤
│ 3 Media     │ 4 Centro    │ 5 Media     │
│   izquierda │             │   derecha   │
├─────────────┼─────────────┼─────────────┤
│ 6 Abajo     │ 7 Abajo     │ 8 Abajo     │
│   izquierda │   centro    │   derecha   │
└─────────────┴─────────────┴─────────────┘
```

- Índice de zona: `zona = fila * 3 + columna` (0–8).
- **Al patear**: el jugador toca la casilla donde quiere colocar el balón. La IA arquera elige su casilla. Si coinciden → **atajada**; si no → **gol**.
- **Al atajar**: el jugador toca la casilla hacia donde se lanza su arquero. La IA pateadora elige su casilla (y en dificultades bajas puede fallar el arco por su cuenta). Coinciden → **atajadón**; no coinciden → gol rival; tiro desviado → falla sin intervención.
- Durante la fase de puntería la grilla se insinúa con líneas punteadas sutiles y las casillas se iluminan al tocar/hover. Fuera de esa fase la grilla es invisible y no interactiva.
- Las 9 casillas deben ser **objetivos táctiles grandes** (mínimo ~48px de alto en un móvil de 360px de ancho) y accesibles (roles/aria-labels con el nombre de la zona).

---

## 5. Reglas de la tanda (formato FIFA)

1. **5 penales por equipo**, alternados. El jugador humano patea primero en cada ronda (v1; el sorteo de quién inicia puede venir después).
2. **Corte anticipado**: si un equipo ya es inalcanzable (ej.: 3–0 con 2 tiros restantes del rival), la tanda termina inmediatamente, como en la regla real.
3. **Muerte súbita**: si tras 5 penales por lado hay empate, se patea ronda a ronda; en cuanto una ronda completa termina con marcadores distintos, hay ganador. Anunciar con un banner "¡MUERTE SÚBITA!".
4. El marcador refleja todo en vivo (puntos verdes/rojos + números).

---

## 6. La IA rival y las dificultades

La máquina juega dos roles: **arquera** (cuando tú pateas) y **pateadora** (cuando tú atajas). La dificultad ajusta ambos:

| Dificultad | IA arquera (cuando pateas) | IA pateadora (cuando atajas) |
|---|---|---|
| **Fácil 😅** | Elige zona uniformemente al azar (~11% de atajarte) | 15% manda el tiro afuera; 35% patea justo donde te lanzaste (te regala atajadas); resto al azar |
| **Medio 😼** | 35% de las veces "lee tu costumbre": se lanza a la zona que más has usado en el partido; resto al azar | Al azar uniforme; 8% de tiros desviados |
| **Imposible 💀** | 70% de las veces **adivina tu zona exacta** (lee el tiro); resto al azar | 70% de las veces **evita deliberadamente tu zona de vuelo**; nunca falla el arco |

Notas de implementación:

- Registrar un histograma `habits[9]` con las zonas usadas por el jugador al patear, para la lectura de costumbres del nivel Medio (incentiva variar los tiros — profundidad estratégica gratis).
- "Imposible" debe ser casi imposible pero **matemáticamente ganable** (el 30% de azar deja rendijas).
- Toda la IA vive aislada en `js/ai.js` con dos funciones puras: `keeperPick(diff, playerZone, habits)` y `shooterPick(diff, diveZone)` → fácil de testear y de evolucionar.

---

## 7. Dirección de arte (todo hecho por nosotros, en SVG)

**Estilo**: cartoon plano (flat), contornos suaves, paleta saturada, ambiente de partido nocturno de mundial (cielo azul profundo + luces blancas de estadio). Referencias de tono: *Head Soccer*, *Retro Bowl*, los pósters oficiales de la FIFA — arcade alegre, no simulación.

Piezas de arte a producir (todas como SVG parametrizable por colores de equipo vía CSS custom properties `--kit1..4`, `--gk1..2`):

1. **Héroe del menú**: jugador cartoon frontal (~220×300), cara sonriente, pelo, camiseta con el 10, balón al pie. Cambia de uniforme según el equipo elegido.
2. **Pateador en cancha**: mismo personaje en vista de espaldas (se ve el 10 en la espalda), a escala, junto al balón. Micro-animación de carrera/patada al disparar.
3. **Arquero**: vista frontal, brazos extendidos, guantes blancos. Animación de **vuelo/estirada** hacia cualquiera de las 9 zonas (translate + rotate con CSS transitions; se lanza de palo a palo, salta a las de arriba, se queda/agacha en las centrales).
4. **Balón**: círculo con costuras/pentágonos simplificados. Animación de vuelo del punto penal a la zona elegida (translate + scale-down para dar profundidad, ~450ms ease-out). Si es atajado, rebota hacia afuera; si va desviado, vuela por encima del travesaño.
5. **Escena del estadio** (viewBox vertical ~360×560): cielo con degradado nocturno y resplandor de reflectores → tribuna con patrón de multitud → valla publicitaria "BOMBAZO ★" → arco (palos y travesaño blancos, red con patrón de líneas) → césped con franjas de corte, área y punto penal con leve perspectiva.
6. **Banderas** de los 5 países como mini-SVG (36×24, esquinas redondeadas) para chips y marcador.
7. **Tipografía**: display para logo/anuncios (*Luckiest Guy* o similar de Google Fonts) + *Nunito* para UI. Fallback a system-ui si no hay red.
8. **Anuncios de resultado**: textos gigantes animados con pop: "¡GOOOOL!", "¡BOMBAZO!", "¡ATAJADO!", "¡ATAJADÓN!", "¡Afuera!", "¡MUERTE SÚBITA!" — con variantes aleatorias para que no se repita siempre el mismo.

> Si en el futuro queremos arte raster (ilustraciones más ricas), se generarán con herramientas de IA generativa o se tomarán de bancos con licencia libre (Kenney.nl tiene packs de sports assets CC0). Para la v1, el SVG propio es suficiente, pesa nada y escala perfecto.

---

## 8. UX de un penal (secuencia detallada)

**Cuando pateas:**
1. Mensaje "Penal N — ¡Tú pateas!" + grilla insinuada.
2. Tocas una casilla → se ilumina y la grilla se bloquea.
3. El pateador hace la micro-animación de carrera (~200ms).
4. Simultáneamente: el balón vuela a tu casilla (~450ms) y el arquero se lanza a la casilla que eligió la IA.
5. Resultado: anuncio gigante + actualización del marcador (~950ms).
6. Todo vuelve a su posición y pasa el turno.

**Cuando atajas:** igual pero invertido — tu arquero (con los colores de TU equipo) está en el arco, el pateador rival (con SU camiseta) junto al balón; tocas la casilla de tu vuelo y la IA decide el tiro.

Detalles de juicio (game feel):
- Ningún paso requiere más de **1 toque**. No hay confirmaciones.
- Tiempos totales por penal: ~2.5s. La tanda completa dura 1–3 minutos.
- `touch-action: manipulation` para matar el double-tap-zoom; sin hover-dependencias en móvil (usar `:active`).
- Vibración háptica opcional en móviles (`navigator.vibrate`) en gol/atajada — *nice to have*.

---

## 9. Arquitectura técnica (v1)

```
bombazo/
├── index.html              # Shell HTML (fuentes, meta, #app)
├── package.json            # Vite (dev/build/preview)
├── scripts/smoke.cjs       # Smoke test visual con navegador headless
└── src/
    ├── main.js             # Punto de entrada: monta pantallas y navega
    ├── styles/
    │   ├── tokens.css      # Design tokens: la identidad visual vive aquí
    │   └── base.css        # Reset, layout, chips, botones, dots compartidos
    ├── data/
    │   └── teams.js        # TEAMS + DIFFICULTIES (agregar equipo = 1 entrada)
    ├── core/               # Lógica pura, sin DOM (testeable por separado)
    │   ├── shootout.js     # Motor de la tanda: reglas FIFA, corte, muerte súbita
    │   └── ai.js           # keeperPick() y shooterPick() por dificultad
    ├── art/                # Identidad visual 100% SVG propia
    │   ├── flags.js        # Banderas mini por país
    │   ├── ball.js         # Balón cartoon
    │   ├── players.js      # Héroe frontal, pateador de espaldas, arquero
    │   └── stadium.js      # Escena del estadio + geometría de las 9 zonas
    └── components/         # UI por componentes, cada uno con su .css
        ├── MenuScreen.js/.css
        ├── MatchScreen.js/.css   # Orquesta core + Pitch + Scoreboard + Announcer
        ├── EndScreen.js/.css
        ├── Pitch.js/.css         # Escena jugable con API imperativa
        ├── Scoreboard.js/.css
        └── Announcer.js/.css
```

Decisiones:

- **Vite + vanilla JS por componentes** (sin framework): cada componente es una factory que devuelve `{ el, api }` con su CSS co-ubicado. Escalar = agregar componentes; la lógica de juego (`core/`) no conoce el DOM, así que se puede portar o testear sin tocar UI.
- **Capas bien separadas**: `data` (contenido) → `core` (reglas puras) → `art` (SVG parametrizable por CSS vars) → `components` (UI) → `main` (navegación). Las dependencias solo apuntan hacia abajo.
- **Estado**: objeto de tanda plano en `core/shootout.js` (tiros, hábitos) + contexto de partido en MatchScreen. Nada de librerías de estado.
- **Animaciones**: CSS transitions sobre `transform` de los grupos SVG (`#ball`, `#keeper`), secuenciadas con `async/await + sleep()`. Sin canvas ni requestAnimationFrame en la v1.
- **Responsive**: `#app { max-width: 430px }` centrado, altura `100dvh`, safe-areas de iOS. En desktop el fondo (degradado estadio) llena los lados.
- **Deploy**: sitio estático en **Vercel** (cuenta `devcristobal`), build de Vite auto-detectado. No requiere `vercel.json`.
- **Verificación**: `scripts/smoke.cjs` recorre el flujo completo (menú → patear → atajar → desktop) con Edge headless y captura screenshots en `.smoke/`.

---

## 10. Roadmap

### ✅ Fase 0 — Repo y especificación (esto)
- [x] Repositorio `Bombazo` en GitHub (@DevCristobalvc)
- [x] `idea.md` con la especificación completa
- [x] README + .gitignore

### 🎯 Fase 1 — MVP jugable ✅ (2026-07-11)
- [x] Estructura de archivos y estilos base mobile-first (Vite + componentes)
- [x] `teams.js` con los 5 equipos + banderas SVG
- [x] Pantalla menú: héroe con camiseta viva, selectores de equipo/rival/dificultad
- [x] Escena SVG del estadio completa
- [x] Sprites: pateador (espaldas), arquero (frontal + vuelos a 9 zonas), balón
- [x] Grilla 9 zonas interactiva con estados (insinuada / hover / elegida / bloqueada)
- [x] Lógica de tanda completa: 5 tiros, alternancia, corte anticipado, muerte súbita
- [x] IA con las 3 dificultades según la tabla de la sección 6
- [x] Marcador vivo + anuncios animados de resultado
- [x] Pantalla de resultado con revancha
- [x] Deploy a Vercel
- [ ] Prueba real en un teléfono (pendiente: la hace Cristóbal con la URL)

### 🚀 Fase 2 — Juice y pulido (en curso)
- [x] Layout 100% viewport: cero scroll de página; solo scrollean zonas internas pequeñas (chips y panel del menú)
- [x] Sonidos sintetizados con WebAudio (silbato, patada, gol, atajada, ovación, fanfarria) — cero assets, botón mute persistente
- [x] Confeti al ganar (colores del equipo campeón) + tribuna que salta en las celebraciones
- [x] Vibración háptica en móvil (gol, atajada, gol en contra)
- [ ] Barra de "potencia/precisión" opcional al patear (timing skill, no solo puntería)
- [ ] Estadísticas de sesión (efectividad, zona favorita) y racha de victorias en `localStorage`
- [ ] PWA: manifest + service worker para jugar offline e "instalar" en el teléfono

### 🌌 Fase 3 — El cielo es el límite (backlog de ideas)
- [ ] **Customización del personaje**: piel, pelo, nombre y dorsal en la camiseta
- [ ] **Modo torneo**: llave de octavos → cuartos → semis → final con los 16 clasificados reales del Mundial 2026
- [ ] Más selecciones (los 16 de octavos completos) y kits alternos
- [ ] Arqueros con "personalidad" (uno que siempre se queda parado, uno que adivina esquinas…)
- [ ] Multijugador local (pasar el teléfono) y luego online (WebSocket/Vercel)
- [ ] Tabla de posiciones global (leaderboard) con Vercel + base de datos del Marketplace
- [ ] Efectos de clima (lluvia, nieve en Suiza 😄) y estadios distintos por sede
- [ ] Comentarista con frases ("¡La mandó a las nubes!") y modo narrador con TTS

---

## 11. Referencias

- **Reglas de la tanda de penales (IFAB, Ley 10.3)**: 5 tiros alternados, corte anticipado cuando la diferencia es inalcanzable, muerte súbita a partir del sexto. <https://www.theifab.com/laws/latest/determining-the-outcome-of-a-match/>
- **Juegos de referencia UX**: *Penalty Kick Online* (una mano, un toque), *Head Soccer* (estilo cartoon), *Retro Bowl* (arcade deportivo mobile-first hecho simple y adictivo).
- **Psicología real de penales** (para la IA y el flavor): los pateadores profesionales tienen zonas favoritas y los arqueros estudian esos hábitos — exactamente lo que hace nuestra IA en Medio. Los tiros al centro son contraintuitivamente efectivos porque los arqueros casi siempre se lanzan.
- **Assets libres si se necesitan**: Kenney.nl (CC0, incluye sports pack y sonidos), Google Fonts (Luckiest Guy, Nunito), OpenGameArt (filtrar CC0).
- **Plataforma**: Vercel static deploy (<https://vercel.com/docs>), cuenta `devcristobal`; repo en GitHub `DevCristobalvc/Bombazo`.

---

## 12. Criterios de aceptación del MVP (Fase 1)

1. En un teléfono (viewport 360–430px) el juego se ve y se juega completo en vertical, sin scroll horizontal ni zoom accidental.
2. En desktop el juego aparece centrado con el fondo extendido a los lados.
3. Puedo elegir cualquier combinación equipo/rival/dificultad y siempre arranca con Colombia preseleccionada.
4. La tanda respeta el formato FIFA: 5 tiros, corte anticipado y muerte súbita funcionan correctamente.
5. Las 9 zonas responden al primer toque y el resultado (gol/atajada/desviado) es siempre coherente con las zonas elegidas.
6. Las 3 dificultades se sienten claramente distintas (en Fácil casi siempre ganas; en Imposible casi nunca).
7. Todo el arte es SVG propio: no hay ninguna imagen externa ni asset sin licencia.
8. El sitio deployado en Vercel carga en menos de 1 segundo en 4G (peso total < 200KB sin contar fuentes).
