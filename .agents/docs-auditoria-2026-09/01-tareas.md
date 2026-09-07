# Tareas — auditoría de caché, rendimiento, legalidad y sedes

> Detalle completo, citas de código y advertencias de cada punto: [02-informe-completo.md](./02-informe-completo.md). Este archivo es el checklist de trabajo; el informe es la referencia.

Orden acordado: **primero la estética de las rutas visuales, luego lo funcional (tasas/pago/facturación), y la integración con el POS legacy que bloquea butacas queda como iniciativa aparte para más adelante.** El backlog de rendimiento no bloquea nada y se puede tomar en cualquier momento libre.

---

## ✅ Ya hecho (no repetir)

- [x] Enrutamiento multisede: la URL es la fuente de verdad de la sede activa (`0ca77c8`).
- [x] Semilla fija de `cinema_locations` + protocolo de divergencia completo + `npm run check:sedes` en CI (`28378be`).
- [x] Borrado de `src/routes/api/poster/[id]/+server.ts` (endpoint muerto, posters mock — los reales vienen de Supabase).

---

## Fase 1 — Terminar las rutas visuales (home, cartelera, sede, butacas)

Bugs concretos encontrados **dentro de estas mismas rutas** que vale la pena barrer mientras se pulen, porque tocar la UI para definir la estética es el momento natural de tocarlos también. No son de tasas/pago/facturación, así que no rompen el orden acordado.

- [ ] **`DateSelector.svelte:29,55-56`** — la etiqueta "Hoy, {fecha}" usa el huso horario del navegador (`getLocalTimeZone()`), pero la cartelera se filtra con `APP_TIMEZONE`. Fuera de UTC-4 la etiqueta puede decir un día distinto al que realmente se muestra. Usar `APP_TIMEZONE` también en la etiqueta y en `minValue`/`maxValue`. Existe ya `src/lib/utils/timezone.ts:12-20` con el helper correcto y **nadie lo usa**.
- [ ] **`MovieDetailsDialog.svelte:124,141`** — tiene su propio reloj congelado (hora del navegador + 30 min de gracia), independiente del de `cines/[sede]/+page.svelte:70-92`. A las 19:15 la página puede ocultar la función de las 19:00 pero el diálogo la deja reservar igual. Unificar a una sola fuente de "ahora" + gracia.
- [ ] **`NetworkHero.svelte:42,51`** — monta `NetworkHeroMobile` Y `NetworkHeroDesktop` siempre, ocultando la que no toca con CSS (`display:none` no evita que un `<img>` eager se descargue). Efecto colateral real: ambas variantes escriben `activeHasClip` vía `onClipStateChange`, así que la oculta puede cancelar la pausa de autorrotación que pide la visible → **corta el tráiler a la mitad**. Usar `src/lib/hooks/is-mobile.svelte.ts` para montar solo una.
- [ ] **Imágenes sin `loading`/`decoding`** — cero uso de esos atributos en las 30 `<img>` del proyecto. En los carruseles (`NowPlayingCarousel.svelte:156/192`, `UpcomingCarousel.svelte:107/121`), usar `loading={i < 6 ? 'eager' : 'lazy'} decoding="async"`. Cuidado: `safeMovies` duplica el array si `6 ≤ movies.length < 12` — revisar que `i` siga mapeando a pósters únicos antes de aplicar el corte en 6.
- [ ] **Confitería (`concessions/[id]/+page.svelte:34,43,52,61`)** — 363 KB de Unsplash hotlinkeado a `?q=80&w=1200` para una franja de `h-32/h-40` con dos tercios tapados por gradiente. Recortar a ~1100x320 y mover a `src/lib/assets/` (con hash), no a `static/`. **Antes de invertir tiempo**: confirmar si esas categorías (hoy `// Mock concession categories`, línea 29) van a venir del BFF con URLs propias — si sí, este recorte es trabajo desechable.

No prescribo nada del diseño en sí (paleta, layout, composición) — eso es criterio del usuario/Antigravity. Esto es solo la lista de bugs de estas rutas que la auditoría encontró.

---

## Fase 2 — Funcional: tasas, pago, facturación

### 🔴 Crítico — dinero real

- [ ] **Tasa de cambio inconsistente.** `checkout/[id]/+page.svelte:48` muestra `EXCHANGE_RATE = 40.50` al cliente; `:33-35` factura con `582.68`. Cobra ~14x lo que se enseñó. Duplicado también en `concessions/[id]/+page.svelte:25`. **Decisión pendiente del usuario:** ¿cuál tasa es la correcta, y de dónde debería salir (constante única, o pedida al BFF)?
- [ ] **Formulario de tarjeta fantasma con checkout real.** `checkout/[id]/+page.svelte:169-192` — `cardNumber`/`exp`/`cvv` no tienen `bind:value`, nunca se leen. `handlePayment` (líneas 22-45) siempre manda `mockPago` con `metodo: 44`, pero el botón "Pagar Orden" sí completa una venta real: libera el ghost, vacía el carrito, emite la venta. El usuario teclea una tarjeta real y nadie la cobra, pero igual se consumen butacas.
  - [ ] Mientras siga en mock: `autocomplete="off"` en los tres campos, `inputmode="numeric"`, enmascarar CVV con CSS (`-webkit-text-security`) — **no** `type="password"` (dispara gestores de contraseñas), y **no** `autocomplete="cc-csc"` (sube la confianza del navegador en que es un formulario de pago real).
  - [ ] Cuando se cablee un procesador real: usar iframe/SDK alojado (mantiene el sitio en SAQ A). Un formulario propio con direct post cae en SAQ A-EP (~140 preguntas de PCI-DSS).

### 🟠 Datos personales (kiosco compartido)

- [ ] **Correo del comprador persistido sin límite fiable.** `booking.svelte.ts:341-346` mete `customerEmail` en `lastCompletedSale`; `saveToLocalStorage()` (línea 89) lo escribe en `scrapp_booking_state`. No se limpia con fiabilidad: `expireSession()` hace `removeItem` (línea 370) y el `$effect` de `+layout.svelte:39-41` lo **reescribe** en la siguiente mutación porque `cartState.clear()` nunca pone `lastCompletedSale` a null. Mover a `sessionStorage` con clave propia (sobrevive F5 y `window.location.href` de la misma pestaña, muere al cerrarla).
- [ ] **Botón "Tu Última Venta" expone el correo del cliente anterior.** `ShoppingCartDropdown.svelte:202-214` + `checkout/success/+page.svelte:27` — en un kiosco compartido (que es el escenario normal aquí, no la excepción: toda la infraestructura es `/api/kiosk/*`), el siguiente usuario ve el correo del anterior. Se resuelve solo junto con el punto anterior.
- [ ] **Escritura silenciosa en la primera visita.** `+layout.svelte:39-41` corre en cualquier ruta desde el primer render; `saveToLocalStorage()` no tiene guarda de estado vacío. Un visitante que solo mira la cartelera y se va deja una clave escrita. Añadir guarda: si no hay `selectedShowtime`, `cartItems.length`, `ghostSession` ni `lastCompletedSale` → `removeItem` y salir (no un `return` pelado — hoy la escritura incondicional hace de "limpiar al vaciar").
- [ ] **Reseñas del tráiler mienten sobre su destino.** `TrailerLightbox.svelte` — el botón dice "Publicar"/"¡Publicado!" pero `cinepic:trailer:review:*` solo vive en `localStorage`, no se lee en ningún otro archivo del repo ni se manda a ninguna API. Relabelar a "Guardar nota"/"Nota guardada", y añadir borrado que limpie las **tres** claves de esa película (like/rating/review) — borrar solo `review` deja el corazón y las estrellas del usuario anterior.

### 🟡 Legal / confianza

- [ ] **Crear `/legal/privacidad` y `/legal/terminos`.** Hoy `Footer.svelte:57,63` son botones con un toast de "no disponible". No hace falta banner de cookies (no aplica en Venezuela, no aplica GDPR — ver informe §3), pero sí una política real que liste qué se guarda localmente y para qué.
- [ ] **Hacer cierto el aviso del checkout.** `checkout/[id]/+page.svelte:99-101` dice "Tu recibo y confirmación de compra serán enviados a este correo", pero `checkout()` en `booking.svelte.ts:326-336` nunca manda `customerEmail` al BFF. O se manda el correo, o se cambia el texto.
- [ ] **Unificar el responsable legal.** El footer firma "Cinepic" (`contacto@cinepic.com.ve`); el checkout declara "Scrapp Cinema LLC" (`checkout/[id]/+page.svelte:200-201`). Elegir uno.
- [ ] **No enmascarar el correo en la pantalla de éxito** (`checkout/success/+page.svelte:26-27`) — es el único lugar donde el usuario puede notar que lo tecleó mal. (Nota: esto es "no hacer algo que parecía buena idea", no una tarea nueva.)

---

## Fase 3 — Integración con el POS legacy (bloqueo de butacas)

Iniciativa aparte, según lo acordado. Casi todos los hallazgos más graves de la auditoría viven exactamente en este punto de contacto.

- [ ] **Cabecera de caché pública en butacas y precios.** `scrapp-administrative-v2/.../fetch-seats/[posShowId]/+server.ts:305` responde `Cache-Control: public, max-age=10, stale-while-revalidate=5` sobre la matriz de butacas **y las tarifas**. 15s de butacas/precios cacheables por CDNs y proxies compartidos.
  - [ ] Del lado del webapp: añadir `{ cache: 'no-store' }` al `fetch` de `booking.svelte.ts:144` (y al de `/api/tarifas`, línea 168). Es una línea y cero riesgo, pero queda dentro de Fase 3 (la integración con el POS legacy) y sin marcar hasta que se aborde esa fase.
  - [ ] Del lado del BFF (`scrapp-administrative-v2`, recordar: **nunca commitear ahí**, solo se puede editar/proponer): bajar el header a `no-store` o `private, no-cache`.
- [ ] **Reconciliar butacas al recibir la matriz fresca.** `booking.svelte.ts:149-151` — `loadFromLocalStorage()` reemplaza `activeSelection` entera con una copia de hasta 15 min sin cotejar contra la matriz real. Una butaca vendida mientras tanto queda "taken" en el mapa pero sigue en `selectedSeats`, contando en el precio, con el botón de deseleccionar deshabilitado. Construir el set de `taken` desde `data.matrix` (nunca desde `seatMapState.matrix`), filtrar `selectedSeats`, reutilizar la lógica de `seatMap.svelte.ts:90-108` (prioriza tarifa DISCAPACITA si la butaca caída era de silla de ruedas).
- [ ] **Fallback a mapa inventado tras 15 reintentos.** `booking.svelte.ts:196-200` genera una sala ficticia 16x20 clickeable (`seatMapState.generateMockMatrix()`), con el aviso "Mostrando mapa simulado" borrándose a los 4s. Debería ser pantalla de error, no un mapa falso interactivo. Esa rama tampoco actualiza `lastSyncTimestamp`, así que nunca reintenta.
- [ ] **TTL de sesión mide la última escritura, no el inicio real.** `saveToLocalStorage` reescribe `timestamp` en cada mutación (vía el `$effect` del layout), así que el chequeo de expiración mide "minutos desde la última escritura", no desde que empezó la reserva. Separar `createdAt` (fijo) de `updatedAt`. Dos cuidados: `lastCompletedSale` no debe llevar este TTL (una compra completada 16 min después no debe perder el comprobante), y mientras haya `ghostSession` viva el reloj bueno es `lockedAt + retentionTimeMinutes` (ya absoluto).
- [ ] **Borrar el bloque muerto de `pagehide`.** `booking/[id]/+page.svelte:52-73` lee una clave (`scrapp_ghost_session` en sessionStorage) que nadie escribe nunca. Nunca hace nada. Borrar por completo (líneas 52-66, los `addEventListener` 68-69, los `removeEventListener` 72-73; conservar el `clearInterval` de 74). **No** cablearlo de verdad: `pagehide` dispara al cambiar de app en móvil, y liberar butacas ahí libera las del propio usuario mientras la UI las sigue mostrando retenidas.
- [ ] **`/api/kiosk/settings` — confirmar si sirve para algo antes de tocarlo.** `booking.svelte.ts:135` lo espera en serie antes de `fetch-seats`, dentro del bucle de 15 reintentos, solo para `retention_time_minutes`. La fila que lee (`app_settings.kiosk_settings`) no la escribe nadie en el BFF — probable 500 constante, valor real siempre el default (5 min). Si se confirma que es así, **borrar las líneas 134-142** en vez de paralelizarlas. Y ojo: el TTL real de verdad está hardcodeado en `sessionPoolManager.ts:374` del BFF (`TTL_MINUTES = 5`) e ignora tanto `app_settings` como `cinema_locations` — mostrar un valor distinto de 5 sería mostrar una cuenta atrás mentirosa.
- [ ] **El mapa de butacas no se revalida mientras el usuario lo mira.** Con la pestaña visible y enfocada, nunca se refresca (`syncState()` solo corre en mount/visibilitychange/focus). No es sobreventa (el POS es autoritativo y devuelve 409), pero sí un callejón sin salida silencioso: "Confirmar Asientos" no hace nada. Si se implementa `refreshMatrix()`: sin `isProcessing` (pone un overlay que tapa el mapa), sin fallback a mock, sin `loadFromLocalStorage()`.
- [ ] **Pedirle al BFF un `?location_id=all`** que devuelva la unión ya hecha (hoy son N llamadas idénticas escaneando `wbpp_movies` completa cada una). Si se pide: exigir que conserve `location_id` por horario en la respuesta — hoy el merge del cliente concatena horarios de sedes distintas sin atribución, inofensivo mientras solo se usen como booleano, pero peligroso el día que se rendericen como clicables.

---

## Backlog de rendimiento (no bloquea nada, tomar cuando haya hueco)

Ordenado por ganancia/esfuerzo. Detalle y advertencias de cada uno en el informe completo (sección 5, P1-P19).

**Bajo esfuerzo, ganancia grande:**
- [ ] P1 — Diferir `EpikWidget` (chat): ~62 KB gzip fuera del camino crítico de TODAS las rutas. ⚠️ No usar `{#if}` para desmontar el panel — pierde el historial del chat y puede re-disparar acciones ya procesadas. Mantenerlo montado, ocultar con `hidden`.
- [ ] P2 — Sustituir `supabase-js` por `fetch` a PostgREST (se usa para una sola query). Medido: -200 KB crudos / -50 KB gzip. ⚠️ Mandar `apikey` y `Authorization: Bearer`; guardar contra la forma del error (PostgREST devuelve objeto en 4xx, no array).
- [ ] P3 — Excluir del escaneo de Tailwind los 45 directorios `ui/` sin usar (o mejor: borrarlos, son regenerables). Medido: -78 KB de CSS bloqueante en todas las rutas.
- [ ] P4 — `loading`/`decoding` en imágenes de carrusel (ver Fase 1, ya listado ahí).
- [ ] P5 — `preconnect` a Supabase, **con** `crossorigin`.
- [ ] P6 — `preconnect` a `image.tmdb.org`, **sin** `crossorigin`.
- [ ] P7 — Cabeceras de caché del build: `/_app/immutable/*` (no `/_app/*` — congelaría `env.js`) a 1 año; `index.html`/`env.js`/`version.json` a `no-cache`.
- [ ] P8 — `gsap` con import dinámico en `BrutalistMegaMenu`. ⚠️ Cubrir también `handleMouseLeave`, que también lo usa — sin guardarlo, el mega menú puede quedarse abierto tapando la página.

**Esfuerzo medio:**
- [ ] P9 — `load` del home sin esperar el `Promise.all`, con `{#await}`. Ganancia real ~617ms, pero alcance grande: `data.nowPlaying` se consume en 7 puntos fuera del carrusel (incluido `SiteHeader`, donde un spread de una Promise tumba la página), y hay que construir skeletons de verdad para hero/mega-menú, no solo envolver el carrusel.
- [ ] P12 — Diferir `Calendar`+`Popover` de `DateSelector` (~40-70 KB). No tocar la aritmética de fechas existente (usa timezone correcto).
- [ ] P14 — Diferir `CommandPalette` y `TrailerLightbox`. ⚠️ Usar un latch de un solo sentido, no `{#if isOpen}` (rompe el foco de salida de bits-ui).
- [ ] P15 — Autohospedar fuentes de Google. Nota: `Antonio` nunca se descarga (queda higiene, no perf); incluir la itálica de Montserrat si se autohospeda.
- [ ] P16 — Sacar `@tailwindcss/typography` del CSS global (solo lo usa una burbuja del chat). ⚠️ Si se quita la clase `prose`, hay que cambiar el selector `.closest('.prose')` de `EpikWidget.svelte:227` o se rompe la detección de enlaces del chat.
- [ ] P17 — Montaje condicional (no solo CSS) de `NetworkHeroMobile`/`Desktop` — mismo punto que en Fase 1.

**Más adelante / evaluar con más cuidado:**
- [ ] P13 — Optimizar imágenes de confitería (ver Fase 1).
- [ ] P18 — Service worker. Es posible con adapter-static, pero **no resuelve los ~2s de la primera navegación** (eso ya está mitigado con `preloadCode`/`preloadData` en el selector de sedes). Medir después de P7 si la caché HTTP ya no está dando el ahorro antes de escribir una sola línea.
- [ ] P19 — Ver ítem de Fase 3 (`?location_id=all`).

---

## No hacer (ya evaluado y descartado — no reabrir sin releer el porqué)

Ver informe completo §6 para el razonamiento de cada uno:
- Banner de cookies / aparato completo de RGPD.
- Cachear "solo los metadatos" de película para reconstruir carruseles (la pertenencia a "hoy" ES función de los horarios).
- Cachear pósters con service worker (URLs sin hash, ya vienen con buen `max-age` de TMDB).
- Precargar la ruta de sede con un `<script>` en `index.html` (ya resuelto vía `preloadCode`; no correría en navegación SPA de todos modos).
- Convertir los `window.location.href` de `ShoppingCartDropdown` a `goto()` sin más (rompería el refresco de cartelera).
- Cablear `pagehide` para liberar butacas (libera las del propio usuario al cambiar de app en móvil).
- Descongelar relojes "para poder cachear 60s" (frescura de datos y corrección de reloj son problemas ortogonales).
- `fetchpriority="high"` estático en el hero (rota cada 12s entre hasta 8 imágenes; condicionar a `currentIndex === 0` si se hace).
- Quitar tarifas del objeto persistido sin arreglar antes la rehidratación de golpe (`booking.svelte.ts:107`) — revienta con TypeError tras un alt-tab en checkout.
