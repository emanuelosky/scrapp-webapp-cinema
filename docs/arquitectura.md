# Arquitectura

Estado: verificado el 10-oct-2026 contra el código.

## Rol

Webapp pública de venta de boletos y dulcería de las sedes de Cinepic (Candelaria, Lido y otras). Es un frontend estático: no tiene base de datos ni credenciales en runtime y no habla con el POS. Todo dato pasa por una única capa, `src/lib/api/index.ts`, que llama a un backend configurado en `VITE_ADMIN_API_URL`. Según la documentación general del proyecto, ese backend es `scrapp-administrative-v2` (BFF); eso no se comprueba desde este repo.

Regla del proyecto: ningún componente ni `load()` llama a `fetch` contra el backend ni arma una URL de API a mano. Todo entra por `src/lib/api/index.ts`, y el contrato que necesita el frontend está en [CONTRATO-BACKEND.md](../src/lib/api/CONTRATO-BACKEND.md).

## Stack

- SvelteKit 2 con Svelte 5 en modo runas (`svelte.config.js` fuerza runas fuera de `node_modules`).
- SPA: `ssr = false` en `src/routes/+layout.ts`, `@sveltejs/adapter-static` con `fallback: 'index.html'`.
- Vite 8 (puerto de desarrollo 5174, `strictPort`), Tailwind 4 (configuración en CSS, `src/routes/layout.css`).
- UI: componentes shadcn-svelte en `src/lib/components/ui/` sobre bits-ui 2; iconos `@lucide/svelte`; toasts `svelte-sonner`; `mode-watcher` para tema.
- Animación: gsap, animejs, embla-carousel-svelte, vaul-svelte.
- Chat EPIK: `@ai-sdk/svelte` (streaming al endpoint del backend).
- Node 22 (`.nvmrc` y `engines`).

## Rutas

| Ruta | Archivo | Qué hace |
|---|---|---|
| `/` | `src/routes/+page.svelte` | Home: hero, carruseles de cartelera y promoción vigente |
| `/cartelera` | `cartelera/+page.ts` | Cartelera sin sede elegida (se muestra como si fuera una sede automática) |
| `/cines/[sede]` | `cines/[sede]/+page.svelte` | Página de sede |
| `/cines/[sede]/cartelera` | `cines/[sede]/cartelera/` | Cartelera de una sede |
| `/cines/[sede]/booking/[id]` | `booking/[id]/` | Selección de butacas de una función |
| `/cines/[sede]/concessions/[id]` | `concessions/[id]/` | Dulcería de la compra |
| `/cines/[sede]/checkout/[id]` | `checkout/[id]/` | Pago |
| `/cines/[sede]/checkout/success` | `checkout/success/` | Confirmación |
| `/dulceria/menu`, `/dulceria/crea-tu-combo`, `/promociones` | respectivas carpetas | Confitería; hoy con datos mock |

`src/routes/+layout.ts` carga la cartelera de todas las sedes activas y las une (`mergeMovies`) para las vistas globales; la promoción se pide solo si la URL trae una sede. `+layout.svelte` monta el chat EPIK, el timeout de sesión de compra, el toaster y el `$effect` que persiste el estado de compra.

## Estado global (`src/lib/state/`)

- `cinema.svelte.ts`: catálogo de sedes. Arranca con la semilla fija `src/lib/config/cinemasSeed.ts` y, en cada arranque, la reemplaza con `GET /api/v1/locations`. Si la red no coincide con la semilla, marca `divergente` y el layout corrige la vista (expulsa al usuario si está en una sede retirada).
- `booking.svelte.ts`: flujo de compra (función, butacas, tarifas, reserva temporal, checkout). Persiste en `localStorage` (`scrapp_booking_state`).
- `ghostSession.svelte.ts`: sesión de reserva en el POS (usuario fantasma del pool del backend).
- `seatMap.svelte.ts`: matriz de butacas. Se parsea desde el array plano del POS (ver CONTRATO-BACKEND).
- `cart.svelte.ts`: carrito de dulcería.
- `chat.svelte.ts`: estado del chat EPIK y de las acciones que dispara el bot.

## Flujo de venta: estado real

Verificado en el código el 10-oct-2026:

- Cartelera, sedes, promos, mapa de butacas y tarifas salen del backend (`src/lib/api/index.ts`).
- El bloqueo de butacas es DEMO. `booking.svelte.ts` (~líneas 225-245) no llama a `/api/kiosk/lock-seats`; devuelve un `ventaTemporalId` falso (`DEMO-LOCK-…`) y el usuario `DEMO_USER`. La llamada real está comentada.
- La facturación es DEMO. `booking.svelte.ts` (~línea 319) no llama a `/api/kiosk/checkout`. `checkout/[id]` envía un objeto `mockPago` (método fijo 44). No se cobra nada ni se factura.
- La dulcería (combos, menú, armador, promociones) devuelve datos de `src/lib/data/*.mock.ts` desde `src/lib/api/index.ts` (~líneas 255-290).
- La tasa de cambio está fija en dos páginas (`EXCHANGE_RATE = 40.50`) y el pago usa `582.68`. Ver [backlog](./backlog.md).

Por eso el backlog tiene tanto peso en tasas, pagos y POS: la parte funcional aún no está conectada.

## Endpoints que consume el frontend

Lista completa y contrato en [CONTRATO-BACKEND.md](../src/lib/api/CONTRATO-BACKEND.md). Resumen de lo que `src/lib/api/index.ts` llama hoy:

- `GET /api/v1/locations`, `GET /api/v1/movies?location_id=`, `GET /api/v1/promos?location_id=`
- `GET /api/kiosk/settings`, `GET /api/pos/fetch-seats/{showtimeId}`, `GET /api/tarifas?showtimeId=`
- `GET /api/kiosk/ghost-pool/status`, `POST /api/kiosk/ghost-pool/warmup`, `POST /api/kiosk/ghost-pool/extend`, `…/release`
- `POST /api/chat` (chat EPIK, con cabecera `x-epik-secret`)

El fallo de cualquier llamada devuelve un valor vacío y no tumba la página (`getJson`).

## Chat EPIK

`src/lib/components/chat/`: `EpikLauncher.svelte` (botón flotante), `EpikChat.svelte` y `EpikWidget.svelte` (conversación y herramientas). El bot puede disparar `navigate_to`, `open_movie_modal` y `start_booking`. El endpoint del backend es opcional: si no existe, el resto de la webapp funciona igual.

## Zona horaria

`src/lib/utils/timezone.ts` exporta `APP_TIMEZONE` (variable `VITE_APP_TIMEZONE`, por defecto `America/Caracas`). La cartelera se filtra con esa zona, no con la del visitante. Hay un bug conocido en la etiqueta de `DateSelector` (ver backlog).

## Decisiones vigentes

- Frontend 100% SPA sin Node en producción: el sitio se sirve como archivos estáticos y el backend es la única fuente de datos (decisión de la migración a SPA).
- Sin acceso directo a la base de datos desde el navegador. La verificación de sedes pasó del cliente de Supabase a `GET /api/v1/locations` (ver `src/lib/state/cinema.svelte.ts`).
- Objetivo: imágenes y tráilers en almacenamiento propio, no en terceros. Hoy los pósters aún vienen de TMDB (transitorio). Detalle en [catálogo y medios](./referencia/catalogo-y-medios.md).
- Móvil: webapp híbrida (PWA o Capacitor) en lugar de apps nativas (decisión del 2-sep-2026). Capacitor aún no está en el repo.
- Estructura de componentes: las rutas orquestan y los componentes de dominio viven en carpetas por vista (`home/`, `booking/`, `cartelera/`, `dulceria/`, `chat/`). Ver [UI](./referencia/ui.md).

## Documentación general (fuera de este repo)

La webapp es un cliente puro del BFF (`scrapp-administrative-v2`) y del backend de IA (`AI-CHATBOT`), consumiendo servicios de taquilla y sesiones que conectan al sistema legado de Cinexo:
- **BFF y API de gestión:** [Ficha de scrapp-administrative-v2](../../../.docs/proyectos/scrapp-administrative-v2.md) y [resumen operativo del broker](../../scrapp-administrative-v2/docs/02-broker-contrato.md).
- **POS legado y sesiones:** [Flujo de venta, cierre y facturación del POS](../../../.docs/apis/pos-apicomplejo-flujo-venta.md), [broker de sesiones Cinexo](../../../.docs/cinexo/sesiones/00-indice-y-uso.md), [pasarela de Cinexo](../../../.docs/cinexo/pasarela-cinexo.md) y [caché de lectura del POS y butacas](../../../.docs/infra/cache-pos-butacas.md).
- **Chat EPIK:** [Ficha de AI-CHATBOT](../../../.docs/proyectos/ai-chatbot.md), [arquitectura de EPIC](../../../AI-CHATBOT/docs/epic/00-arquitectura-de-epic.md) y [contrato HTTP del backend](../../../AI-CHATBOT/docs/CONTRATO-API-BACKEND.md).

Los documentos de diseño de la antigua maqueta del BFF (`.agents/`: carrito único, mutex de venta, datos mockeados) se retiraron el 10-oct-2026 por obsoletos, dado que el bloqueo real lo gestiona el broker de sesiones. Su histórico permanece en git.
