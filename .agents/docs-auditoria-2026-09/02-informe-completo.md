# Informe completo de auditoría — caché, rendimiento, legalidad y protocolo de sedes

> Generado 2026-09-06 por una auditoria multiagente (62 subagentes, 56 hallazgos, 42 sobrevivieron verificación adversarial contra el código real, 14 descartados). Cada afirmación cita archivo:línea de este repo o del BFF. Ver [01-tareas.md](./01-tareas.md) para el plan de trabajo organizado por fases, y [00-README.md](./00-README.md) para el contexto de por qué existe esta carpeta.

**Repo auditado:** `C:/ONGOING-PROJECTS/SCRAPP-ENTERPRISE/scrapp-webapp-cinema` (SvelteKit 5, `ssr = false`, adapter-static con `fallback: 'index.html'`).
**BFF (solo lectura):** `scrapp-administrative-v2`.
Todo lo que sigue está verificado contra el código real. Donde no pude verificar algo, lo digo.

---

## 0. Lo primero, porque cambia el orden de todo lo demás

Antes de discutir si conviene cachear: **ya estás cacheando butacas y precios, y no lo decidiste tú.**

`scrapp-administrative-v2/src/routes/api/pos/fetch-seats/[posShowId]/+server.ts:305` responde con:

```
'Cache-Control': 'public, max-age=10, stale-while-revalidate=5'
```

Y ese payload contiene **la matriz de butacas** y **las tarifas con sus precios** (`tariffsData.posTariffs`, `allowedTariffs`, `defaultTariffs`, líneas 290-298 del mismo archivo). Del lado del cliente, `src/lib/state/booking.svelte.ts:144` lo pide con un `fetch()` pelado — un grep de `no-store|cache:` sobre todo `src/` del webapp no devuelve **ni una sola** llamada con política de caché.

Traducción: el mapa de sala y los precios pueden servirse hasta **15 segundos obsoletos** (10 frescos + 5 de stale-while-revalidate), y el `public` autoriza a cachés compartidas (CDN, proxy corporativo) a guardarlos. El comentario del BFF dice "10s es suficientemente corto para reflejar butacas recién tomadas" — eso es una opinión, no una garantía. En una taquilla concurrida 15 s es exactamente la ventana en la que dos personas eligen la misma butaca.

**Acción inmediata (1 línea, en tu repo, sin tocar el BFF):**

```ts
// booking.svelte.ts:144
const res = await fetch(`${API_BASE}/api/pos/fetch-seats/${...}`, { cache: 'no-store' });
```

Lo mismo para `/api/tarifas` (`booking.svelte.ts:168`). Y pídele al dueño del BFF que baje ese header a `no-store` o, como mínimo, a `private, no-cache`.

**Segundo problema de precio, en el mismo embudo:** `src/routes/cines/[sede]/checkout/[id]/+page.svelte` muestra al cliente el total en bolívares con `const EXCHANGE_RATE = 40.50` (línea 48, `// Mock Tasa BCV`, usado en :50), pero el payload que se factura usa `tasaConversion: 582.68` (líneas 33 y 35). Le enseñas al cliente un monto ~14x menor del que mandas a facturar. Las dos tasas están hardcodeadas y ninguna se refresca. `EXCHANGE_RATE = 40.50` está duplicado literalmente en `src/routes/cines/[sede]/concessions/[id]/+page.svelte:25`.

Eso, en un negocio que cobra dinero, es más grave que cualquier optimización de este informe.

---

## 1. ¿Conviene cachear en el dispositivo?

**Sí, pero solo código y assets. No datos de negocio. Y el orden importa: primero quita la caché que ya tienes mal puesta, después añade la que falta.**

El razonamiento:

- **Lo que de verdad te cuesta tiempo es JavaScript, no datos.** Tus propias mediciones lo dicen: la primera navegación a `/cines/[sede]` son ~2.0 s dominados por descargar+evaluar el JS de esa ruta, no por la API. Y el hueco de 506 ms del home es "evaluar JS + query serial a Supabase". Cachear carteleras no toca ninguno de los dos.
- **El JS y el CSS son cacheables sin riesgo alguno**, porque `build/_app/immutable/**` lleva hash de contenido: si cambia el contenido, cambia el nombre. Ahí la caché es gratis y correcta por construcción.
- **Los datos de este dominio son casi todos volátiles.** Horarios, butacas, tarifas y la pertenencia misma de una película al carrusel ("¿tiene funciones hoy?") cambian solos con el reloj. Cachearlos no es "un poco de latencia a cambio de un poco de frescura": es vender una butaca que ya no existe.
- **Hay más grasa que quitar que caché que poner.** Antes de un service worker tienes ~220 KB de SDK de IA y ~200 KB de supabase-js en el camino crítico de *todas* las rutas. Quitar eso gana más que cualquier estrategia de caché, y no arriesga nada.

**Veredicto operativo:** caché agresiva para `_app/immutable/**` y assets estáticos. Caché **cero** para todo `/api/`. Service worker: más adelante, y con allow-list, no deny-list (ver §5).

---

## 2. Qué es seguro cachear y qué NUNCA

| Dato | Dónde vive hoy | Cuánto tiempo | Mecanismo | Veredicto |
|---|---|---|---|---|
| JS/CSS/fuentes con hash (`build/_app/immutable/**`) | Sin política (no hay `_headers`, `vercel.json`, `netlify.toml` ni `nginx.conf` en el repo — verificado) | 1 año | `Cache-Control: public, max-age=31536000, immutable` en el host | ✅ **SEGURO** |
| `build/index.html` (el shell SPA) | Sin política | 0 | `no-cache` — **siempre revalidar** | ⚠️ **SEGURO SOLO CON `no-cache`** |
| `build/_app/env.js` | Sin política. **No lleva hash**, vive fuera de `immutable/`, y contiene `PUBLIC_SUPABASE_URL` + anon key | 0 | `no-cache`, explícito | 🔴 **TRAMPA** — la regla `/_app/* → 1 año` que todo el mundo escribe de memoria lo congela; al rotar la anon key los navegadores que vuelven arrancan con credenciales muertas y el home queda vacío |
| `build/_app/version.json` | Sin política | 0 | `no-cache` | ⚠️ Cachearlo congela la detección de deploys de SvelteKit |
| `/favicon.*`, `/logo.svg`, `/robots.txt` | Sin política | 1 día | `max-age=86400` | ✅ SEGURO |
| Pósters/banners de `image.tmdb.org` | Origen externo, `max-age=31919000` (~1 año) que ya manda TMDB | Lo que dice TMDB | Nada que hacer, ya está bien | ✅ SEGURO (no lo toques con un SW: son URLs arbitrarias que llegan del BFF, sin hash) |
| Catálogo de sedes (`cinema_locations`, `cinema.svelte.ts:96-100`) | Solo memoria | ≤24 h **como arranque optimista, nunca como verdad** | localStorage + revalidación en cada arranque, con protocolo de divergencia (§4) | 🟡 **MATIZADO** — ver §4 antes de tocarlo |
| Preferencia de sede (`scrapp_preferred_cinema`, `cinema.svelte.ts:127`) | localStorage | Indefinido | Ya está bien | ✅ SEGURO (es una elección explícita del usuario) |
| Metadatos de película (título, póster, sinopsis, duración) | Vienen mezclados con los horarios | — | **No se puede separar** sin tocar el BFF | 🔴 **NO CACHEAR HOY** — ver nota abajo |
| **Horarios de función** (`showtimes`, `showtimesByDate`) | `/api/v1/movies` | **0** | `no-store`, sin excepción, ni SWR de 1 s | 🔴 **NUNCA** |
| **Matriz de butacas** (`/api/pos/fetch-seats/*`) | Hoy: `public, max-age=10, s-w-r=5` ← **arréglalo** | **0** | `cache: 'no-store'` en el cliente + pedir al BFF que quite el header | 🔴 **NUNCA** |
| **Tarifas y precios** (`/api/tarifas` y `tariffsData` dentro de fetch-seats) | Mismo header público de 10 s | **0** | `no-store` | 🔴 **NUNCA** |
| Todo `/api/kiosk/*` (lock-seats, checkout, ghost-pool) | Sin caché hoy | **0** | Ni tocarlo con un SW. Además son POST y `sendBeacon` | 🔴 **NUNCA** |
| PII del comprador (`customerEmail` dentro de `lastCompletedSale`) | **localStorage, hoy, sin aviso** (`booking.svelte.ts:89`) | Debería ser: vida de la pestaña | `sessionStorage` en clave aparte | 🔴 **NUNCA EN DISCO** — ver §3 |

**Por qué "metadatos de película" está en rojo aunque suene inofensivo:** el BFF mete `showtimes` y `showtimesByDate` **dentro** de cada objeto de `nowPlaying[]` (`scrapp-administrative-v2/src/routes/api/v1/movies/+server.ts:217-218`), y una película solo entra a `nowPlaying` si tiene funciones (`+server.ts:224-227`). Además el home deriva sus carruseles de esos campos volátiles: `src/routes/+page.svelte:107` filtra por `(m.showtimes?.length ?? 0) > 0`. Cachear "solo los metadatos" te deja una bolsa de películas sin forma de saber cuáles van hoy, y cachear la lista completa te deja pintando tarjetas *clicables* de una película cuya corrida terminó. No hay término medio sin partir la respuesta en el BFF, y el BFF es solo lectura para ti.

**Regla de oro para cuando escribas el service worker:** allow-list, no deny-list. Primera línea `if (request.method !== 'GET') return;` (si no, te comes el `navigator.sendBeacon` de liberación de butacas de `ghostSession.svelte.ts:98` y `booking/[id]/+page.svelte:58` — el fallo no es "cartelera vieja", son butacas bloqueadas que nadie puede comprar). Después: cachea `_app/immutable/**` y los 4 archivos de `static/`, y **todo lo demás pasa a red sin tocarse**. Una deny-list falla en abierto: el endpoint que el BFF añada mañana queda cacheado porque nadie se acordó de listarlo.

---

## 3. Legalidad — y sí, hoy estás guardando datos personales sin avisar

### Situación regulatoria

**Venezuela.** No hay ley general de protección de datos ni autoridad de control, y no existe equivalente al art. 5.3 de la Directiva ePrivacy europea — que es la norma que obliga al banner de cookies. **No necesitas banner de cookies.** Lo que sí aplica:

- **Art. 28 CRBV (habeas data):** el ciudadano tiene derecho a conocer el uso y la finalidad de los datos que se tengan sobre él. Eso es una **obligación de informar**, no de pedir consentimiento con un modal.
- **Ley Especial contra los Delitos Informáticos (2001), art. 20:** castiga usar, modificar o borrar datos personales ajenos en un sistema sin consentimiento del titular. Relevante sobre todo para lo que el backend haga con el correo — y, en un kiosco compartido, para el correo del cliente anterior que sigue en pantalla.

**GDPR: no aplica.** El art. 3.2 solo alcanza a un responsable fuera de la UE si ofrece bienes/servicios a personas *que están* en la Unión o monitoriza su comportamiento allí. El Considerando 23 y las Directrices 3/2018 del CEPD son explícitos: la mera accesibilidad desde Europa no basta. Aquí las pruebas *estructurales* son claras: no hay i18n ni rutas por idioma (6 rutas, ninguna con prefijo de locale), no hay moneda EUR en ninguna parte, no hay envío físico, y el servicio se consume en una sala de Caracas. **No montes consentimiento estilo RGPD, ni registro de tratamientos, ni DPO, ni banner de dos capas.** Reevalúa solo si aparece venta a residentes en la UE, versión en inglés dirigida a Europa, o un píxel publicitario (hoy no hay ninguno: cero rastros de gtag, Meta Pixel, Hotjar o Sentry en `src/` ni en `build/`).

> No te apoyes en el RIF, el teléfono ni la tasa del checkout como prueba de "mercado local": son placeholders (`J-12345678-9`, `0414-1234567`). Usa las pruebas estructurales.

### Lo que hoy se guarda sin ningún aviso — esto hay que arreglarlo

**1. El correo del comprador queda en el disco.** `booking.svelte.ts:341-346` construye `lastCompletedSale` con `customerEmail`; `saveToLocalStorage()` lo serializa dentro de `scrapp_booking_state` (línea 89, verificado) y lo escribe en localStorage (línea 92). En disco quedan: **correo, título de película, fecha/hora de función, butacas concretas y total pagado.**

Y no se limpia solo de forma fiable, por dos razones:

- El `$effect` de `src/routes/+layout.svelte:39-41` llama `saveToLocalStorage()` ante *cualquier* mutación del estado rastreado. Por eso `expireSession()` (`booking.svelte.ts:364-370`) hace `removeItem` en la línea 370 y acto seguido el efecto **reescribe la clave** — porque `cartState.clear()` (`cart.svelte.ts:38-41`) nunca pone `lastCompletedSale` a null. El correo sobrevive incluso a la expiración por timeout.
- La única ruta de borrado real es el `onclick` de "Comprar más entradas" (`checkout/success/+page.svelte:54`). Si el usuario cierra la pestaña tras comprar — el comportamiento normal —, se queda ahí.

**Y es visible, no solo residual:** `src/lib/components/booking/ShoppingCartDropdown.svelte:202-214` pinta un botón "Tu Última Venta" mientras `lastCompletedSale !== null`, y navega con `window.location.href` (línea 208). El siguiente usuario del kiosco pulsa ese botón y lee en pantalla el correo del comprador anterior (`checkout/success/+page.svelte:27`). Toda tu infraestructura es `/api/kiosk/*`: el dispositivo compartido es el escenario normal, no el excepcional.

**Arreglo:** sacar `lastCompletedSale` del JSON de `saveToLocalStorage` y guardarlo en `sessionStorage` bajo clave propia. `sessionStorage` sobrevive al F5 y al `window.location.href` de la misma pestaña (que es lo que ese botón necesita) y muere al cerrarla. **No** lo dejes "solo en memoria": ese botón hace recarga dura y quedaría muerto. **No** enmascares el correo en la pantalla de éxito: es el único sitio donde el usuario puede detectar que lo tecleó mal.

**2. Reseñas de texto libre, sin caducidad y sin forma de borrarlas.** `TrailerLightbox.svelte:37-55` guarda `cinepic:trailer:{liked|rating|review}:{movieId}`. El campo `review` es texto libre del usuario (puede llevar su nombre, opiniones, datos de terceros), sin timestamp, sin ventana de 15 min, sin ninguna UI de borrado en todo el repo. En un kiosco compartido se queda ahí para el siguiente.

Y hay algo peor que el almacenamiento silencioso: **la UI miente sobre el destino.** El botón dice "Publicar" (línea 483), confirma "¡Publicado!" (472) y "Ya publicaste una opinión" (474) — pero `cinepic:trailer:review:*` no se lee en ningún otro archivo del repo ni se envía a ninguna API. El usuario cree que publicó una opinión y no la ve nadie, nunca. Arreglo mínimo: relabelar a "Guardar nota" / "Nota guardada", añadir un borrado que limpie las **tres** claves de esa película (si solo borras `review`, el corazón y las estrellas del anterior siguen ahí).

**3. Se escribe en el dispositivo en la primera carga del home, sin ninguna interacción.** El `$effect` de `+layout.svelte:39-41` corre en el primer render de cualquier ruta y `saveToLocalStorage()` no tiene guarda de estado vacío (`booking.svelte.ts:81-96`). Un visitante que entra, mira la cartelera y se va se lleva una clave escrita con `{activeSelection: nulls, cartItems: [], timestamp: ahora}`. Es la única escritura del inventario que no se puede justificar como "estrictamente necesaria para un servicio que el usuario pidió". Arreglo: guarda temprana — si no hay `selectedShowtime`, ni `cartItems.length`, ni `ghostSession`, ni `lastCompletedSale`, hacer `removeItem` y salir. **`removeItem`, no un `return` pelado**: hoy la escritura incondicional actúa como "limpiar al vaciar".

**4. El footer promete una política de privacidad que no existe.** `Footer.svelte:57` y `:63` son `<button onclick={() => toast('Oops. Esta función todavía no está disponible.')}>` para "Términos y Condiciones" y "Políticas de Privacidad" (verificado literalmente). No hay ruta `/privacidad` ni `/terminos` en `src/routes`. Anunciar una política inexistente en una página que cobra dinero es peor que no mencionarla. Además el `Footer` **no se monta en el embudo de compra** (solo en `+page.svelte:214` y `cines/[sede]/+page.svelte:274`), así que arreglar esos botones nunca alcanza al usuario que está entregando su correo: la línea informativa **debajo del input de correo** es la que carga el peso.

**5. Formulario de tarjeta que pide PAN y CVV y no cobra nada.** `checkout/[id]/+page.svelte:169-192`: `cardNumber`, `exp`, `cvv` son `<input type="text">` sin `bind:value` y sin `autocomplete`. Sus valores no se leen jamás — `handlePayment` (líneas 22-45, verificado) envía siempre el `mockPago` con `metodo: 44`. Pero el botón "Pagar Orden" **sí completa una venta real** contra el BFF: libera el ghost, vacía el carrito y navega a success. O sea: el usuario teclea una tarjeta real, nadie la cobra, y aun así se consumen butacas y se emite una venta. Eso reprueba una revisión de adquirente mucho antes que una URL de privacidad ausente.

Mientras siga siendo mock: `autocomplete="off"` en los tres, `inputmode="numeric"`, y enmascarar el CVV con CSS (`-webkit-text-security`), **no** con `type="password"` (los gestores de contraseñas se ofrecen a guardarlo). Y **no** pongas `autocomplete="cc-csc"`: le estás diciendo al navegador "esto es un formulario de tarjeta" y sube la confianza de su heurística sobre los campos hermanos. Cuando cablees un procesador real: iframe/SDK alojado, para no salir del SAQ A. (Un formulario propio con direct post cae en SAQ A-EP, ~140 preguntas; SAQ D es para quien almacena/procesa CHD en sus sistemas.)

**6. El chat manda tu carrito a un LLM y el "secreto" es público.** `EpikWidget.svelte:53-71` (verificado): el transporte inyecta `contextCart` con títulos de película, horarios, número de butacas y combos, y lo manda a `${VITE_ADMIN_API_URL}/api/chat`. Un usuario puede teclear su nombre o cédula en ese cuadro y sale del navegador sin aviso. Y la línea 57 es `'x-epik-secret': import.meta.env.VITE_EPIK_SECRET || 'scrapp_epik_secret_2026_dev'` — el prefijo `VITE_` inlinea el valor en el bundle del cliente, así que ese "secreto" está en devtools de cualquiera, y el fallback está hardcodeado. El BFF sí lo valida (`api/chat/+server.ts:64-68`), así que **no lo quites** (rompería el chat con 401), pero no lo cuentes como control de seguridad. Lo que hay que arreglar de verdad ahí es el `Access-Control-Allow-Origin: '*'` del BFF (`+server.ts:24`, con el comentario "Adjust in production" sin ajustar) y que el rate limit sea un `Map` en memoria (`:14`), inútil en serverless.

### Regla práctica

**No pongas banner de cookies.** No cubre ninguna obligación real y mete fricción en el embudo. En su lugar:

1. Arregla las escrituras de PII (puntos 1, 2, 3).
2. Crea `/legal/privacidad` y `/legal/terminos` como rutas estáticas y apunta los botones ahí. La política debe listar **las claves de almacenamiento local y su propósito** — decir "no usamos cookies" a secas mientras guardas el correo del cliente en localStorage es exactamente la frase que un regulador considera engañosa.
3. Amplía el aviso que **ya existe** bajo el input de correo (`checkout/[id]/+page.svelte:99-101`: "Tu recibo y confirmación de compra serán enviados a este correo") con retención y responsable.
4. **Ojo:** ese aviso hoy es falso. `checkout()` (`booking.svelte.ts:326-336`) envía al BFF únicamente `{ ghostUsername, pago }` — `customerEmail` **nunca sale del navegador**. O mandas el correo al BFF, o cambias el texto. No publiques una política que declare una finalidad que no ocurre.
5. Decide **un** responsable: el footer firma "Cinepic" (`Footer.svelte:15`, `contacto@cinepic.com.ve` en :18) y el checkout declara "Scrapp Cinema LLC" (`checkout/[id]/+page.svelte:200-201`).
6. **No toques el consentimiento de geolocalización, que ya está bien hecho:** `TheatreSelectorDialog.svelte:93-137` muestra una capa previa explícita antes de llamar a `findNearestCinema()`, y su texto ("No almacenamos estos datos en nuestros servidores") es verificablemente cierto según `cinema.svelte.ts:167-174`.

---

## 4. La lista de cines fija + verificación asíncrona

**Veredicto: la idea es correcta, la ganancia es real pero menor de lo que suena, y sin el protocolo completo de divergencia no se debe mergear.**

### El problema que resuelve

`src/routes/+page.ts:9` hace `await cinemaState.init()` y recién en la línea 12 arranca el `Promise.all` de carteleras (verificado). `init()` (`cinema.svelte.ts:84-91`) siempre va a red en arranque en frío, porque la guarda es `this.cinemas.length > 0`. Ese es literalmente el hueco medido: JS descargado a 157 ms → primera llamada API a 506 ms.

### Ganancia honesta

El hueco entero es **349 ms**, así que ese es el techo aritmético. De ahí, ~270-320 ms es el RTT a Supabase y el resto evaluación de JS. **Ahorro realista: ~270-320 ms sobre 1123 ms = 24-28%.** No 30-40%, y los fetch arrancarían a ~190-240 ms, no a "~150 ms" (157 ms es cuando *termina la descarga* del JS, no su evaluación).

Y ojo: el `import { supabase }` de `cinema.svelte.ts:1` sigue siendo estático, así que la semilla **no** ahorra el coste de parsear supabase-js. Solo saca el viaje de red. Para lo otro está la palanca #2 de §5.

**Esto solo aplica al home.** `src/routes/cines/[sede]/+page.ts:16-20` ya paraleliza `init()` con el fetch de películas, con comentario propio explicándolo. Ahí la semilla no gana nada.

### Modos de fallo, ordenados por gravedad

**🔴 Sede DESACTIVADA que sigue en la semilla — el peor caso, y no es "cosmético por unos cientos de ms".**

`/api/v1/movies` **nunca valida si la sede está activa**. `movies/+server.ts:49` toma `location_id` del query string sin validarlo (incluso cae a `|| 'candelaria'`), y el filtro de funciones (líneas 78-82) es solo `is_active` sobre `wbpp_showtimes` + `location_id` + `show_date >= hoy`. Un grep de `cinema_locations` sobre `src/routes/api/v1/` del BFF devuelve **un solo hit**: `locations/+server.ts:22`. Es decir, una sede que el operador cerró **sigue devolviendo cartelera real, con horarios reales y reservables**.

Peor: no hay ni un `invalidate` / `invalidateAll` / `depends` en todo `src/` del webapp (grep vacío). El `load` del home no es reactivo a `cinemaState.cinemas`. Cuando llegue la corrección de Supabase, `data.nowPlaying` ya está calculado y **no se recalcula en toda la visita**. Esas funciones del cine cerrado se quedan en el carrusel del home y son clicables hasta que el usuario recargue.

**🟠 Sede NUEVA ausente del bundle.** El `Promise.all` de `+page.ts:12` ya se disparó con la lista rancia: su cartelera falta del carrusel entero durante esa carga. Y el guard 404 de `cines/[sede]/+page.ts:27` (`if (cinemaState.cinemas.length > 0 && !isKnownCinema(sede))`) pasa a ser cierto desde el primer tick contra la copia local → **404 inmediato a un link de campaña de una sede que sí existe.**

**🟡 El early-return se vuelve permanente.** `cinema.svelte.ts:85` (`if (this.cinemas.length > 0) return;`) es verdadero apenas publiques la semilla de forma síncrona. Eso convierte en no-op todas las llamadas posteriores a `init()` — incluidas `TheatreSelectorDialog.svelte:61` y, sobre todo, `findNearestCinema` (`cinema.svelte.ts:162-166`), que hace `await this.init()` antes de elegir el cine más cercano. Con semilla, "Usar mi ubicación" te manda al cine más cercano **según el bundle**, sin haber esperado jamás a la red.

**🟡 Bundle viejo cacheado tras un deploy.** La semilla vieja sobrevive. Por eso la verificación tiene que correr en **cada** arranque, no una vez.

### Cómo debe comportarse — el protocolo completo, no negociable

1. **La semilla es un arranque, jamás la verdad.** El resultado de red siempre pisa a la semilla, nunca al revés. Y la semilla **no se persiste** en localStorage como si fuera catálogo válido.
2. **Expón un handle público a la promesa de verificación** (p.ej. `catalogVerified: Promise<void>`), porque `await init()` deja de servir. `findNearestCinema` tiene que awaitar ese handle, no `init()`.
3. **El guard 404 de `cines/[sede]/+page.ts:27` espera a la verificación** antes de tirar 404. O directamente no 404ea y deja que el BFF devuelva lo que devuelva.
4. **Al detectar divergencia, invalidar el `load` del home.** Es el punto que casi todo el mundo se salta. Sin un `invalidate`/`depends` sobre el load, la corrección del catálogo solo arregla el selector y deja las funciones del cine cerrado dentro de `data.nowPlaying` toda la sesión.
5. **Baja inmediata.** Si el usuario ya está parado en una sede que resultó desactivada: aviso y vuelta al home. No lo dejes comprar.
6. **Chequeo en CI.** Un script de build que consulte `cinema_locations` y **falle el build** si diverge de `SEED_CINEMAS`. Sin esto la semilla se pudre en silencio y nadie se entera hasta que un cliente compra en un cine cerrado.

**Alternativa más barata y casi igual de buena:** en vez de semilla en el bundle, persiste el catálogo en `localStorage` (`scrapp_cinemas_v1 = {v, savedAt, cinemas}`) con TTL de 24 h, hidratación síncrona en el constructor y `#fetchCinemas()` sin await para revalidar. Misma ganancia, sin el problema de "la semilla se pudre en el bundle", pero **con exactamente los mismos 6 puntos del protocolo** — el modo de fallo de la sede desactivada es idéntico.

**Si no vas a implementar los 6 puntos, no hagas ninguna de las dos.** Cambiar 300 ms por vender entradas de un cine cerrado es mal negocio.

---

## 5. Otras palancas, priorizadas por (ganancia / esfuerzo)

### 🔥 HAZLO YA — correcciones (no son de velocidad, son de que no vendas mal)

**C1. `cache: 'no-store'` en fetch-seats y tarifas.** §0. Una línea. Cierra 15 s de butacas y precios cacheables públicamente. **Riesgo: cero.**

**C2. Unificar la tasa de cambio del checkout.** `checkout/[id]/+page.svelte:48` (40.50 mostrado) vs `:33-35` (582.68 facturado), más el duplicado en `concessions/[id]/+page.svelte:25`. Sacarla del BFF o, como mínimo, de una sola constante. **Riesgo de no hacerlo: le cobras al cliente un monto distinto del que le enseñaste.**

**C3. Reconciliar butacas al recibir la matriz fresca.** `booking.svelte.ts:149` asigna la matriz del POS y `:151` llama a `loadFromLocalStorage()`, que en `:107` reemplaza `activeSelection` entera por la copia de hasta 15 min atrás — sin cotejarla. Si otro cliente compró una de esas butacas, `SeatMapViewer.svelte:170` la pinta como `isTaken` y deja el botón `disabled` (`:175`), pero **sigue dentro de `selectedSeats`**: cuenta en `activeSelectionPrice` (`seatMap.svelte.ts:26-33`), mantiene `canProceed` en true, y el usuario **no puede deseleccionarla porque el botón está deshabilitado**. Pulsa "Confirmar Asientos" y no pasa nada, porque `addSelectionToCart` traga el 409 con un `console.error` (`booking.svelte.ts:310-312`).
Arreglo: construir el set de ids `taken` **de `data.matrix`** (la respuesta del POS, NUNCA de `seatMapState.matrix`), filtrar `selectedSeats`, y decrementar cantidades reutilizando la lógica de `seatMap.svelte.ts:90-108` (que prioriza la tarifa DISCAPACITA si la butaca caída era de silla de ruedas — si no, cobras mal). Y muestra un toast. Esfuerzo bajo. **No sirve la "alternativa simple" de dejar de restaurar**: la selección obsoleta ya está en memoria desde el constructor (`:62`), desde `booking/[id]/+page.svelte:16` y desde `syncState` (`:401`).

**C4. Revisar el fallback a mapa inventado.** `booking.svelte.ts:196-200`: tras 15 reintentos, `seatMapState.matrix = seatMapState.generateMockMatrix()` — una sala **ficticia** de 16x20 donde la ocupación es `i % 3 === 0 && j % 4 === 0` (`seatMap.svelte.ts:71`). El aviso "Mostrando mapa simulado" se borra a los 4 segundos y el mapa falso queda en pantalla, clickable. Y esa rama **no** actualiza `lastSyncTimestamp`, así que `syncState` (`:413`) nunca reintenta. En una app que vende boletos, eso debe ser una pantalla de error, no un mapa.

**C5. TTL absoluto para la selección especulativa.** `saveToLocalStorage` escribe `timestamp: Date.now()` (`:90`) y el `$effect` del layout lo reescribe ante cualquier mutación, así que el chequeo de `:106` mide "minutos desde la última escritura", no "desde que empezó la reserva". Separa `createdAt` (fijo) de `updatedAt`, y **conserva `createdAt` a través de las rehidrataciones** (`loadFromLocalStorage` reescribe `movie`/`selectedShowtime` en `:107` desde tres sitios más). Dos cuidados: (a) `lastCompletedSale` viaja en el mismo blob — si le aplicas el TTL de reserva, una compra que se completa 16 min después de elegir función pierde el comprobante y `checkout/success/+page.svelte:11-15` echa al usuario fuera; sácalo del TTL. (b) Mientras haya `ghostSession` viva, el reloj bueno es `lockedAt + retentionTimeMinutes` (`ghostSession.svelte.ts:34-53`), que ya es absoluto — respétalo.

**C6. Borrar el bloque muerto de `pagehide`.** `booking/[id]/+page.svelte:52-66` lee `sessionStorage.getItem('scrapp_ghost_session')` y hace un `sendBeacon` de release. **Nadie escribe nunca esa clave** (verificado: solo existen el `getItem` de `:53` y el `removeItem` de `:62`). El handler no hace nada, jamás. Bórralo completo — líneas 52-66, los `addEventListener` de 68-69 y los `removeEventListener` de 72-73, conservando el `clearInterval` de 74.
**Y NO lo "cablees bien".** `pagehide` dispara al pasar la pestaña a segundo plano en móvil, y esta app está diseñada para sobrevivir a eso (`+layout.svelte:20-29` re-sincroniza en `visibilitychange`/`focus`). Cablear `releaseGhost()` ahí significa que un usuario que cambia de app a mitad de la compra libera sus propias butacas mientras la UI sigue mostrándolas retenidas. La retención del servidor (5 min) ya cubre el caso.

### ⚡ HAZLO YA — rendimiento, esfuerzo bajo, ganancia grande

| # | Palanca | Gana | Cuesta | Arriesga |
|---|---|---|---|---|
| **P1** | **Diferir EpikWidget.** `+layout.svelte:8` lo importa estático y `:125` lo renderiza sin `{#if}`, en TODA ruta. Trae `ai`+`zod`+`marked`+`dompurify` = **222.296 B crudos / ~62 KB gzip = 85% de `nodes/0`**. `zod` ni siquiera se importa en `src`: entra por `ai@7 → @ai-sdk/provider-utils`. Partir en `EpikLauncher` (FAB estático) + `EpikPanel` (import dinámico) | `nodes/0` baja de 261 KB a ~39 KB crudos, en home, sede, booking y checkout | Medio | ⚠️ **NO uses `{#if chatState.isOpen}` para el panel.** `minimizeWithBubble()` hace `chatState.close()` en `EpikWidget.svelte:187` y se llama automáticamente desde `:149`, `:171` y `:179` — el chat se auto-minimiza casi en cada acción. Desmontar destruye la instancia `Chat` (`:53`) y **pierde todo el historial**, y resetea `processedActions` (`:127`), lo que puede **re-disparar acciones ya procesadas** → navegación no pedida a `/booking/`. Carga el módulo una vez y **mantén el panel montado**, ocultándolo con `hidden`. Sube `showBubble`/`bubbleQuote` a `chat.svelte.ts` (los escribe el panel, los lee el launcher). Y si quitas `marked` de la burbuja: hoy `bubbleQuote` sí lleva salida cruda del LLM (`:193`), no solo el array `quotes` — un `**negrita**` saldrá literal |
| **P2** | **Sustituir supabase-js por un `fetch` a PostgREST.** `createClient()` corre a nivel de módulo (`supabase.ts:7`, verificado) y todo el cliente se usa para **una** query: `cinema_locations` en `cinema.svelte.ts:96-100`. Arrastra GoTrue, Realtime/phoenix, Storage, Functions | **Medido:** chunk compartido 413.565 → 212.990 B (**-200.575**), gzip 120.138 → 69.764 (**-50.374**). Total JS del cliente -16,9%. En las **dos** rutas de entrada | Bajo (~12 líneas) | ⚠️ **Manda los DOS headers** (`apikey` **y** `Authorization: Bearer`) — la key es del formato nuevo `sb_publishable_*`, no JWT. Y **guarda contra la forma del error**: supabase-js garantiza que `cinemas` sea siempre array; PostgREST crudo devuelve un **objeto** `{message, code, hint}` en 4xx y `fetch` no rechaza. Sin `if (!res.ok) return;` + `if (!Array.isArray(data)) return;`, una key rotada convierte la degradación suave de hoy (home vacío pero vivo) en TypeError dentro del `load` → error 500 en `/` (`+page.ts:13` hace `.map`), selector roto (`TheatreSelectorDialog.svelte:65` `.filter`) y guard 404 saltado en silencio (`cines/[sede]/+page.ts:27`, `undefined > 0`) |
| **P3** | **Excluir del escaneo de Tailwind los 45 directorios `ui/` sin usar.** `layout.css:1` es `@import "tailwindcss"` sin `@source`, así que v4 escanea todo `src/` y extrae clases de componentes que ningún código importa. Añadir `@source not "../lib/components/ui/{accordion,...}"` | **Medido: -78.803 B crudos / -10.467 B gzip** del CSS que bloquea el render en **todas** las rutas (hoy 272 KB / 39 KB gzip) | Bajo | ⚠️ La lista excluye justo los que shadcn arrastra por dependencia (`label`, `separator`, `skeleton`, `sheet`, `tooltip`). El día que alguien añada `sidebar` o `form`, se rompe el estilo de varios a la vez **y el build sale en verde** — solo se ve en runtime como componente sin estilos, potencialmente en el mapa de butacas. Mejor: **borra los directorios** (son regenerables con `npx shadcn-svelte add`, y hay git en el repo), que produce error de import duro. `sonner-loading-bar` **no** se va con esto: es CSS de `node_modules/svelte-sonner`, y `<Toaster>` está vivo en `+layout.svelte:121` |
| **P4** | **`loading="lazy"` en los carruseles.** No existe **un solo** `loading=`/`decoding=`/`fetchpriority=` en las 30 etiquetas `<img>` del proyecto. `Carousel.Content` renderiza todos los items, así que se piden los 14 pósters de golpe. En el `{#each}` (el índice `i` **ya existe**: `NowPlayingCarousel.svelte:156`, `UpcomingCarousel.svelte:107`) poner `loading={i < 6 ? 'eager' : 'lazy'} decoding="async"` en el `<img>` de `:192` / `:121` | **~840 KB diferidos** fuera de la ventana crítica (los 6 eager son 562 KB medidos). Mismo número en desktop y mobile | Bajo | Bajo. El lazy nativo usa posición visual y Embla mueve con transform, así que puede haber un frame en blanco al arrastrar rápido — por eso el corte en 6. ⚠️ El `<img>` del glow (`:169`, `:113`) **ahorra 0 bytes**: misma URL, el navegador deduplica. Si lo tocas, envuélvelo en `{#if hovered}` y véndelo como lo que es: 14 capas `blur(30px)` menos de GPU. ⚠️ `safeMovies` (`:20-28`) duplica el array si `6 ≤ movies.length < 12`; con cartelera corta, `i` deja de mapear a pósters únicos. ⚠️ `UpcomingCarousel` **no está en el home**, se monta en `cines/[sede]/+page.svelte:273` |
| **P5** | **`preconnect` a Supabase.** Es el único origen remoto del camino crítico medido | ~50-150 ms en producción (1 RTT DNS + 1-2 de TCP+TLS; más en móvil) | Bajo | ⚠️ **Con `crossorigin`** (supabase-js hace peticiones CORS; sin el flag el socket no se reutiliza y la ganancia es 0 en silencio). ⚠️ **No hardcodees `onrender.com`**: `.env:3` dice `VITE_ADMIN_API_URL=https://localhost:5173` y `grep -rl onrender.com build/` no devuelve nada — ese fallback está muerto en el build actual. **No se puede medir la ganancia real desde aquí**: todas tus mediciones son localhost, donde el handshake es ~0 |
| **P6** | **`preconnect` a `image.tmdb.org`.** `app.html:8-9` solo precalienta las fuentes (verificado) | Hasta ~200 ms al primer píxel del hero | Bajo | ⚠️ **SIN `crossorigin`.** Copiarlo de la línea de fuentes es el error clásico: todas tus imágenes son `<img src>` plano sin atributo `crossorigin` (grep: la única coincidencia en `src/` es `app.html:9`), y un `<img>` cross-origin sin atributo es una petición no-cors; el navegador usa pools de sockets distintos y **no reutiliza el precalentado**. Con `crossorigin` la línea no hace nada y deja un socket ocioso |
| **P7** | **Cabeceras de caché del build.** No hay `_headers`, `vercel.json`, `netlify.toml` ni `nginx.conf` en el repo | 1-2 RTT en revisita (~100-300 ms en enlace lento). **No** 18 RTT: `build/index.html` emite los 12 `modulepreload` en bloque plano y HTTP/2 los revalida en paralelo | Bajo | 🔴 La regla debe ser exactamente **`/_app/immutable/*`** para el max-age largo. `/_app/*` congelaría `env.js` (§2). `index.html`, `env.js` y `version.json` → `no-cache`. Objetivo documentado en `.agents/01-architecture-overview.md:32`: Vercel o Cloudflare Pages, no Netlify/nginx |
| **P8** | **`gsap` con import dinámico.** `BrutalistMegaMenu.svelte:4` lo importa estático para animar un menú que solo se abre al hover. 6 hits en todo el repo, todos en ese archivo | **70.128 B crudos / ~20 KB gzip** fuera de `/` y `/cines/[sede]` | Bajo | 🔴 **El riesgo NO es cosmético.** `handleMouseLeave` (`:110-123`) también necesita gsap, en `:116`, dentro de un `setTimeout` de 150 ms. Si el usuario pasa el ratón y lo aparta enseguida con el chunk aún en vuelo → TypeError, y como `activeTab = null` solo se asigna en el `onComplete` de esa timeline (`:117`), **el mega menú se queda abierto tapando la página** (`absolute top-[56px] w-full z-50`). Guarda **una** promesa compartida, awaitala también en `handleMouseLeave`, y envuelve ambos caminos en try/catch con fallback sin animación. Detalle: no nombres la variable `gsap` — sombrea el namespace ambiental y rompe el tipo de `:51` (`gsap.core.Timeline`); usa `gsapLib`. El punto de inserción va **después** del `await tick()` de `:84`, no al principio. Y el `gsap.set` de `:126` es redundante hoy: el panel ya tiene `visibility: hidden` inline en `:166` |

### 🟠 SIGUIENTE TANDA — esfuerzo medio

**P9. Devolver una promesa desde el `load` del home.** `+page.ts:12` hace `await Promise.all(...)`: no resuelve hasta la última sede, y hasta entonces SvelteKit no monta nada. Devolver `{ movies: Promise<...> }` sin await y envolver en `{#await}` adelanta el primer pintado de ~1123 ms a **~506 ms (~617 ms)**. Verificado que funciona: en un `load` universal SvelteKit solo hace `await` del objeto, no de sus propiedades.
🔴 **El alcance es mayor que "envolver el carrusel":** `data.nowPlaying` se consume en 7 puntos fuera del `{#await}` — `+page.svelte:60`, `:107`, `:114`, `:122`, `:125`, `:127` y sobre todo `:136` `<SiteHeader nowPlaying={data.nowPlaying}>`, donde `SiteHeader.svelte:135` hace `[...nowPlaying, ...]` → hacer spread de una Promise **tumba la página entera**.
🔴 **No existe el "hero estático":** `NetworkHero.svelte:41` es `{#if activeMovie}` y `activeMovie` deriva de `data.nowPlaying`. Con lista vacía renderiza **altura cero**. Los skeletons son el trabajo principal, no un detalle.
🔴 **Estado pendiente ≠ estado vacío.** Con `[]`, `BrutalistMegaMenu.svelte:30` clasifica como "próximamente" todo lo que no tiene `showtimes` — un usuario que abra el mega menú en los primeros 600 ms ve funciones de hoy etiquetadas como estrenos futuros. Un falso "no hay funciones" cuesta una venta igual que un horario inexistente.

**P10. `/api/kiosk/settings` fuera del camino del mapa de butacas.** `booking.svelte.ts:135` lo espera **antes** del `fetch-seats` de `:144`, y está dentro del bucle de 15 reintentos. Lo único que saca es `retention_time_minutes`, un temporizador de UI.
Pero **antes de paralelizarlo, comprueba si el endpoint sirve para algo**: la fila `app_settings` con `id='kiosk_settings'` solo la lee `settings/+server.ts:9` y **nadie la escribe** en todo el BFF (el panel admin persiste la retención en `cinema_locations.webapp_kiosk_retention`). Con `.single()` sobre una fila inexistente responde 500 y `retentionTimeMinutes` nunca sale del default 5. Si es así, **borra las líneas 134-142** en vez de paralelizarlas.
🔴 Y hay un motivo de corrección para no honrar ese valor aunque exista: el TTL real está **hardcodeado** en `scrapp-administrative-v2/src/lib/server/sessionPoolManager.ts:374` (`const TTL_MINUTES = 5`), y el cron de limpieza ignora tanto `app_settings` como `cinema_locations`. Si el endpoint devolviera 10, mostrarías una cuenta atrás de 10 min mientras el servidor ya soltó las butacas a los 5 → sobreventa. **Hoy el valor seguro es el default local de 5.**

**P11. Refrescar la matriz mientras el usuario mira el mapa.** Con la pestaña visible y enfocada el mapa **no se revalida nunca**: `syncState()` solo corre en mount/`visibilitychange`/`focus` (`+layout.svelte:20-29`), y el único `setInterval` de la pantalla (`booking/[id]/+page.svelte:46-50`) solo lee el contador del pool.
No es sobreventa (el POS es autoritativo: `lock-seats/+server.ts:181-192` devuelve 409), es un **callejón sin salida silencioso**: el usuario pulsa "Confirmar Asientos" y no pasa nada.
🔴 **No reutilices `loadSeats()` tal cual.** Extrae un `refreshMatrix()` que solo haga el fetch, escriba `status` y `lastSyncTimestamp`: sin `isProcessing` (pone un overlay `fixed inset-0 bg-black/80` sobre el mapa, `SeatMapViewer.svelte:115-122`), **sin tarifas** (un refresco que deje fuera una tarifa descuadra `activeSelectionPrice` contra `totalTickets` → footer con total menor y butacas sin bloquear), sin `loadFromLocalStorage()`, y **sin fallback a mock** (multiplicarías la probabilidad de sustituir disponibilidad real por fabricada).

**P12. Diferir `Calendar`+`Popover` de `DateSelector`.** Es el único consumidor de `ui/popover` y `ui/calendar` del repo, y arrastra `@floating-ui` (18.786 B) más los 18 wrappers del barrel: **40-70 KB crudos** en la ruta de sede — bastante más de lo que parece.
Ojo: `@internationalized/date` (18.450 B) **no se recupera**: `cines/[sede]/+page.svelte:30` lo importa directo y `DateSelector.svelte:29` lo usa en la etiqueta siempre visible.
Y **no toques** la aritmética de `+page.svelte:56-80` para ahorrar esos 18 KB: `today(APP_TIMEZONE)` decide con qué fecha se filtra la cartelera y `now(APP_TIMEZONE)` oculta funciones pasadas. Cambiarlo por `Intl` puede desplazar el límite del día. (Existe `src/lib/utils/timezone.ts:12-20` con el helper Intl correcto, pero **nadie lo usa**: es código muerto, sin tests.)
🐛 De paso, hay un bug de husos ya vivo ahí: `DateSelector.svelte:29` pinta "Hoy, {fecha}" con `getLocalTimeZone()` (huso del **navegador**) y `:55-56` fija `minValue`/`maxValue` igual, mientras la cartelera se filtra con `APP_TIMEZONE`. Fuera de UTC-4, la etiqueta dice un día y la cartelera muestra otro.

**P13. Confitería: 363 KB de Unsplash hotlinkeado.** `concessions/[id]/+page.svelte:34,43,52,61` piden `?q=80&w=1200` para pintarlas en una franja de `h-32/md:h-40` con `bg-cover` — y encima `:105` superpone `bg-gradient-to-t from-black via-black/80` que tapa dos tercios. Como van por `style="background-image"`, no admiten `loading="lazy"`.
Recorta a ~1100x320 y guárdalas en **`src/lib/assets/`** (hash de contenido de Vite), **no en `static/`** (nombre literal, sin invalidación). Ganancia honesta: **~280-315 KB** con AVIF, ~580-615 KB sin. Y saca un tercero del embudo de compra. La licencia de Unsplash permite descargar y usar comercialmente; no es bloqueante. **Confirma antes** si el catálogo de confitería acabará viniendo del BFF con sus propias URLs (hoy es `// Mock concession categories` en `:29`), o el recorte es trabajo desechable.

**P14. `CommandPalette` y `TrailerLightbox` diferidos.** ~25 KB min / ~7 KB gzip y ~10 KB / ~3 KB gzip.
🔴 **En ambos, usa un latch de un solo sentido (`hasOpenedOnce`), no `{#if isOpen}`.** `dialog-content.svelte:31` tiene `data-closed:animate-out ... duration-100`: bits-ui mantiene el nodo montado durante la salida y solo entonces devuelve el foco al trigger. Gatear por `isOpen` destruye el subárbol en el mismo tick y deja el foco en `<body>` — regresión de accesibilidad silenciosa. Y en `CommandPalette` **mueve el listener de ⌘K** (`:22-33`) a `SiteHeader`, o el atajo muere sin dar error.
🔴 En `TrailerLightbox`, **iza una sola instancia a `NetworkHero.svelte`**: hoy cada hero monta la suya (`NetworkHeroDesktop.svelte:307`, `NetworkHeroMobile.svelte:171`) y, como `Dialog.Content` va a un portal, el `md:hidden` no las suprime — un `{#if}` en cada hero montaría **dos** overlays y **dos** `<video>`. Y prefetchea en `pointerenter` del botón Maximize2: los `$effect` de `:66-68` y `:57-59` pausan el tráiler de fondo **síncronamente** al abrir, así que sin prefetch el usuario ve el hero congelado durante toda la descarga.

**P15. Fuentes autohospedadas.** `app.html:10` es un `<link rel="stylesheet">` render-blocking a un tercero (~360-390 ms en frío, medido). Su cache es `private, max-age=86400, stale-while-revalidate=604800` — el `SWR` de 7 días que muchos omiten significa que **el golpe bloqueante es de primera visita o tras 7+ días**, no diario.
`Antonio` no se descarga nunca (Bebas Neue cubre `U+0000-00FF` y todo tu texto en `--font-display` cae ahí), así que quitarla de la URL y de `layout.css:21` es higiene, **no perf**: 0 bytes.
Si autohospedas: **borra también `SeatMapViewer.svelte:100`**, que tiene otro `<link>` a Google Fonts dentro de `<svelte:head>` en la ruta de butacas — sin eso, la propuesta "elimina el segundo origen" es falsa. Y **incluye la itálica** de Montserrat: hay 5 usos de `italic`, tres de ellos titulares `font-black` en el embudo de pago; el sesgado sintético de un Black se ve claramente mal.
⚠️ Contexto que relativiza todo esto: `build/_app/immutable/assets/0.*.css` pesa **271.980 B** y también bloquea en el mismo head. Ese es el pez gordo del primer pintado, no el CSS de ~1 KB de Google (por eso P3 está más arriba).

**P16. `@tailwindcss/typography` fuera del CSS global.** `layout.css:4` mete 19.396 B (120 reglas `.prose*`) en la hoja bloqueante de todas las rutas para **una** burbuja de chat (`EpikWidget.svelte:454`). Ganancia real medida: **-19,4 KB crudos / -2,3 KB gzip / -2,0 KB brotli**. Es limpieza correcta, no una palanca de rendimiento — 2,3 KB gzip es ruido frente a 506 ms.
🔴 **Si quitas la clase `prose` de `:454`, rompes en silencio `link.closest('.prose')` de `:227`**: `messageEl` pasa a null y **toda** acción de enlace del chat mostraría el genérico "¡Listo! Abriendo..." en vez del mensaje real. Cambia `:227` a `.closest('.epik-ai-bubble')` (misma etiqueta div).
🔴 La alternativa de "mover el `@plugin` al chunk del chat" **no funciona en Tailwind v4**: `@plugin` solo emite si va acompañado de `@import 'tailwindcss'`, y entonces arrastra theme+preflight duplicados (**28.624 B**, más caro que los 19.396 que querías ahorrar). Usa el bloque acotado en el `<style>`, y cubre también `h1-h6`, `blockquote`, `pre`, `hr`, `table`, `img` (55 de las 120 reglas son la escala de `prose-sm`).

**P17. `NetworkHero` monta las dos variantes a la vez.** `NetworkHero.svelte:42` y `:51` montan `NetworkHeroMobile` y `NetworkHeroDesktop` **siempre**; se ocultan con `md:hidden` (`Mobile:79`) y `hidden md:flex` (`Desktop:136`). `display:none` **no** impide que un `<img>` eager se descargue.
Ganancia honesta: **0 a ~100 KB según la cartelera del día**, no ~100 KB fijos — cuando la película destacada también está en el carrusel, es la misma URL y cuesta 0 bytes; el ahorro aparece en preventas (el hero pone PREVENTA/ESTRENO primero, `+page.svelte:61-63`, y esas pueden no tener funciones hoy).
🔴 **Usa render condicional con el hook `src/lib/hooks/is-mobile.svelte.ts`, no `loading="lazy"`.** En mobile ese póster está en el viewport inicial (`h-[440px]`): ponerle lazy despriorizaría el elemento más visible del hero en el dispositivo principal de un cine, a cambio de bytes invisibles en escritorio.
🎁 El montaje condicional arregla de paso un bug real: ambas variantes escriben el mismo `activeHasClip` vía `onClipStateChange` (`NetworkHero.svelte:45` y `:59`), así que la variante oculta reporta `hasClip=false` y puede cancelar la pausa de la autorrotación que pide la visible — **cortando el tráiler a la mitad**.

### 🔵 MÁS ADELANTE

**P18. Service worker.** Sí es posible con adapter-static (verificado: SvelteKit 2.63 trae `build_service_worker.js` y el módulo virtual `$service-worker`; lo construye el plugin de Vite, no el adapter). Pero:

- **No arregla los ~2.0 s de la primera navegación.** El SW se instala *después* de la primera carga, y tu propia medición de "segunda navegación ~120 ms" muestra que dentro de la sesión el chunk ya está en la caché de módulos.
- **Ese camino ya está mitigado a mano:** `TheatreSelectorDialog.svelte:26-28` hace `preloadCode('/cines/[sede]')` al abrir el diálogo, y `:39` `preloadData(...)`. Y todas las entradas al flujo (header `SiteHeader.svelte:112`, hero, carrusel, CommandPalette, deep link `?pelicula=`) pasan por ese mismo diálogo.
- **Mide antes de escribir una línea:** si tu host ya sirve `_app/immutable/**` con `immutable` (P7), la caché HTTP del navegador ya te da el ahorro y el SW aporta ~0. Lo que quedaría es offline y red inestable.
- `$service-worker.build` son 35 archivos, **todos** bajo `_app/immutable/` — **no incluye ni `index.html` ni `/_app/env.js`**, y `build/index.html` hace `import("/_app/env.js")` antes de arrancar. Con la receta estándar, offline te queda pantalla blanca. Añádelos explícitamente, y **network-first**, nunca cache-first.
- **El shell viejo es tan volátil como los datos.** Si sirves `index.html` desde caché, en el mejor caso los chunks hasheados desaparecen tras el deploy (y con `fallback: 'index.html'` no dan 404: el host devuelve HTML con 200 y el navegador intenta parsear HTML como módulo JS); en el peor, ejecutas la lógica de tarifas y lock **antigua** contra un POS actualizado. `skipWaiting()` + `clients.claim()` + purga de caches versionadas en `activate`.

**P19. Pedirle al BFF (no es tuyo, es una petición):** (a) cabecera de caché de `fetch-seats` a `no-store` — prioritario, §0; (b) un `?location_id=all` que devuelva la unión ya hecha, para que el home haga 1 llamada en vez de N (`movies/+server.ts:52-54` trae `wbpp_movies` entera sin filtrar por sede: N llamadas = N escaneos idénticos). Ganancia realista **~100-300 ms**, no los 617 ms del tramo — las N llamadas ya son paralelas (`Promise.all` en `+page.ts:12`). Y si lo pides, **exige que conserve `location_id` por horario**: hoy el merge del cliente (`+page.ts:56`) concatena horarios de sedes distintas sin atribución. Hoy es inofensivo porque el home solo los usa como booleano, pero congelar esa forma como contrato significa que el primer consumidor que los pinte como clicables reservará una función sin sede.

---

## 6. Lo que NO hay que hacer

**❌ Banner de cookies.** No hay obligación en Venezuela, no aplica el RGPD, y metes fricción en el embudo. Lo que falta es **informar** (política real + aviso junto al correo), no pedir consentimiento con un modal.

**❌ Aparato completo de RGPD** (registro de tratamientos, DPO, consentimiento de dos capas). Y no lo justifiques con el RIF y el teléfono del checkout: son placeholders. Usa las pruebas estructurales (sin i18n, sin EUR, servicio consumido en sala).

**❌ Cachear "solo los metadatos" de película y reconstruir los carruseles.** Suena limpio y no lo es: la pertenencia a "hoy en pantalla" *es* función de los horarios y del minuto actual (`+page.svelte:105-107`, `cines/[sede]/+page.svelte:70-91`). Para hidratar tendrías que persistir la lista de ids por sede, que es el dato prohibido con otro nombre. Y con TTL de días seguirías pintando tarjetas **clicables** de una película cuya corrida terminó.

**❌ Cachear pósters con el service worker.** Son URLs absolutas arbitrarias que llegan del BFF (`movie.poster`, `types.ts:13`), sin hash de contenido. Cache-first ahí clava un póster reemplazado. Y ya vienen con `max-age` de ~1 año de TMDB: no hay nada que ganar.

**❌ Precargar la ruta de sede con un `<script>` en `index.html`.** Ya está resuelto por `preloadCode` en el diálogo, y en una navegación SPA el navegador **no vuelve a parsear `index.html`**, así que ese script nunca correría para el caso que quieres arreglar. Además el coste real de precargar esa ruta desde el home es **161.172 B** sin comprimir (~45 KB gzip), no los ~575 KB que se suele estimar.

**❌ Convertir los `window.location.href` de `ShoppingCartDropdown.svelte:171,185,208` a `goto()` sin más.** Trampa fina: la línea 171 apunta a `/cines/${currentSede}`, que **es la URL en la que ya estás** (el componente solo se monta en home y cartelera vía `SiteHeader.svelte:85`). Hoy la recarga dura re-ejecuta el `load` y trae cartelera fresca; un `goto()` a URL idéntica **no re-ejecuta el `load`** y reutiliza los datos cacheados. El botón "Añadir Otra Película" pasaría a ofrecer horarios de hace 15+ minutos. Si lo conviertes, va con `invalidateAll()`.

**❌ Cablear el `pagehide` de `booking/[id]/+page.svelte:52-66` para liberar butacas.** Ver C6: `pagehide` dispara al cambiar de app en móvil, y liberarías las butacas del propio usuario mientras la UI sigue mostrándolas retenidas.

**❌ Descongelar el reloj de `cines/[sede]/+page.svelte:70-92` "para poder cachear 60 s".** Es un non sequitur: un tick local solo puede *quitar* funciones de un payload ya descargado; no revela una función añadida, cancelada, ni una butaca vendida. Corrección de reloj y frescura de datos son ortogonales. (Aparte: `NowPlayingCarousel` ni siquiera renderiza horarios; el filtro de `:81` solo decide qué pósters aparecen. Y `MovieDetailsDialog.svelte:124` tiene su **propio** reloj congelado, con hora del navegador y una gracia de 30 min en `:141` — a las 19:15 la página oculta la función de las 19:00 pero el diálogo la deja reservar. Esa divergencia sí vale la pena arreglarla, pero no es un tema de caché.)

**❌ `preconnect` con `crossorigin` a `image.tmdb.org`** (P6) y **❌ `preconnect` sin `crossorigin` a Supabase** (P5). Los dos errores hacen que la optimización no haga nada y encima dejan un socket ocioso. Un cambio que silenciosamente no funciona es peor que uno que rompe, porque nadie lo revisa después.

**❌ Añadir `fetchpriority="high"` estático al banner del hero.** El hero **auto-rota cada 12 s** sobre hasta 8 películas (`NetworkHero.svelte:92-97`) y los `{#key movie.id}` recrean el `<img>` en cada vuelta: acabarías con 7 peticiones de alta prioridad durante la sesión activa, compitiendo justo contra el `preloadData` de la ruta de booking. Si lo haces, condiciónalo a `currentIndex === 0`. Y **no** le pongas `decoding="async"` al elemento LCP: difiere el decode y por tanto el paint. (Aparte: el backdrop se construye como `/t/p/original` en `metadata/index.ts:73`, no `w1280` — si eso es lo que sirve en producción, el banner pesa megas y `fetchpriority` solo reordena la cola. La corrección de fondo es servir `w1280`.)

**❌ Quitar `tariffs`/`allPosTariffs`/`defaultTariffsIds` del objeto persistido sin arreglar antes `booking.svelte.ts:107`.** La intención es buena (los precios no deben vivir en disco), pero como la línea 107 asigna el objeto parseado **de golpe**, quitarlos los deja en `undefined` tras cualquier rehidratación — y `syncState` rehidrata en cada `focus` de pestaña desde `+layout.svelte:22/29`, también en checkout, donde no hay `loadSeats` que los repueble. Alt-tab y volver revienta con TypeError en `checkout/[id]/+page.svelte:251` y en `seatMap.svelte.ts:28`. Cambiar un precio de ≤15 min por una pantalla rota a mitad del pago es peor negocio. Si lo haces: merge contra defaults (`{...defaults, ...state.activeSelection}`) **y** deja de persistir también `ticketQuantities` (está indexado por `tariff.id`; sin sus tarifas quedan tickets fantasma que `totalTickets` suma y `addSelectionToCart` se salta, desalineando `seatsQueue`).

**❌ Enmascarar siempre el correo en la pantalla de éxito.** `checkout/success/+page.svelte:26-27` es el único sitio donde el usuario puede detectar que tecleó mal el correo al que va su boleto.

---

### Orden sugerido de ataque

1. **C1** (`no-store` en butacas y precios) — hoy, 5 minutos.
2. **C2** (tasa de cambio) — hoy.
3. **PII: sacar `lastCompletedSale` del localStorage** + guarda de escritura vacía (§3 puntos 1 y 3).
4. **C3, C4, C5, C6** — la semana.
5. **P1, P2, P3** — las tres grandes de bundle: ~272 KB crudos / ~72 KB gzip fuera del camino crítico de todas las rutas, más ~79 KB del CSS bloqueante.
6. **P4-P8** — tarde de trabajo, bajo riesgo.
7. **P9** y la semilla de cines (§4) **con los 6 puntos del protocolo**, o ninguno de los dos.
8. Política de privacidad y rutas legales, **después** de arreglar 3, no antes: no publiques un documento que prometa lo que el código no cumple.
9. Service worker: solo si tras P7 mides que la caché HTTP no te está dando ya el ahorro.