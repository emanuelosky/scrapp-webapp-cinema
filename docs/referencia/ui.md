# Convenciones de UI y código

Estado: verificado el 10-oct-2026 (configuración y componentes existen en el repo). Las reglas de estilo son convenciones del proyecto, no comprobables con una herramienta.

## Estilos

- Tailwind 4 sin `tailwind.config`: el tema vive en `src/routes/layout.css` (`@theme`, `@plugin 'tailwindcss-animate'`, `@plugin '@tailwindcss/typography'`, `@custom-variant dark`).
- Variables de color en `:root` y en la clase `.dark`. El tema lo gestiona `mode-watcher`.
- Estética: fondos oscuros (zinc), poco color; el acento se reserva para promociones grandes. Evitar neones y desenfoques excesivos.
- Pósters y banners: se muestran completos, sin overlays de texto ni degradados encima (restricción de las distribuidoras para banners y tráilers). El texto va debajo o en una franja aparte.
- Al animar escala dentro de contenedores con `overflow-hidden`, usar capa GPU (`transform-gpu will-change-transform`) y un borde interno para tapar fugas de anti-aliasing en WebKit.

## Componentes

- Primitivos: `src/lib/components/ui/` (shadcn-svelte sobre bits-ui 2). Se importan desde ahí, por ejemplo `$lib/components/ui/button`.
- Globales: `src/lib/components/` en la raíz (Footer, MovieDetailsDialog, etc.).
- Dominio: subcarpetas por vista (`home/`, `booking/`, `cartelera/`, `dulceria/`, `chat/`, `navigation/`).
- Las páginas (`+page.svelte`) orquestan: estado compartido y datos entran por props o por los módulos de `src/lib/state/`. El marcado complejo va a componentes.

## Reglas de código

- Svelte 5 con runas (`$state`, `$derived`, `$effect`, `$props`). En `{#each}` siempre una clave: `{#each items as item (item.id)}`.
- No usar `<SelectValue>` (no existe en bits-ui 2). En `Select`, declarar `type="single"` o `type="multiple"`.
- Todo botón sin texto visible (cerrar, iconos) lleva `aria-label`.
- Iconos solo de `@lucide/svelte`.
- Sin emojis en la interfaz, el código ni la documentación.
- Llamadas al backend: solo por `src/lib/api/index.ts`. Dentro de `load()` usar el `fetch` que recibe la función, no el global.
- Datos de prueba y catálogos temporales: en `src/lib/data/*.mock.ts`, no en componentes.
- Modo demo: los cambios que desactivan una llamada real (bloqueo de butacas, facturación) se marcan con un comentario `DEMO MODE` en `booking.svelte.ts`. Buscar esa cadena antes de dar algo por conectado.

## Zona horaria y montos

- Horarios y fechas: `APP_TIMEZONE` de `src/lib/utils/timezone.ts`. No usar la zona del navegador para filtrar funciones.
- Precios: se muestran tal como los escribe la señalética (referencia en dólares). La tasa de cambio está duplicada en el código y tiene un valor distinto del que se cobra (ver [backlog](../backlog.md)). No convertir en el frontend hasta resolverlo.
