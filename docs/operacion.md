# Operación: correr, probar y desplegar

Estado: verificado el 10-oct-2026 contra `package.json`, `svelte.config.js`, `vite.config.ts`, `scripts/` y `src/lib/api/index.ts`.

## Requisitos

- Node 22 (`.nvmrc` y `engines` en `package.json`).
- npm. El repo trae `.npmrc`.

## Variables de entorno

Van en `.env` en la raíz (ignorado por git). `.env.example` solo trae las dos variables de Supabase, así que no sirve como plantilla completa.

| Variable | Obligatoria | Uso |
|---|---|---|
| `VITE_ADMIN_API_URL` | Sí para `npm run build` | Base del backend (sin barra final). Se incrusta al compilar. Si falta en un build de producción, `prebuild` lo impide. En `npm run dev` sin esta variable, la base cae a `http://localhost:5174`, que es el propio servidor de Vite, no un backend (ver [backlog](./backlog.md)). |
| `VITE_APP_TIMEZONE` | No | Zona de la cartelera. Por defecto `America/Caracas`. |
| `VITE_EPIK_SECRET` | No, pero recomendada | Cabecera `x-epik-secret` del chat. Si falta, el código usa un valor por defecto literal (`src/lib/api/index.ts`, función de cabeceras del chat). Ese valor queda en el bundle público: tratarlo como secreto expuesto. |
| `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` | Solo para `check:sedes` | Verificación de la semilla de sedes. La app en runtime no usa Supabase. |

Valores reales: solo en el `.env` local o en el entorno de CI. No copiarlos a docs.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 5174 (`strictPort`). |
| `npm run build` | Ejecuta antes `prebuild` (`scripts/check-build-env.js`) y luego `vite build`. Salida en `build/`. |
| `npm run preview` | Sirve el build. |
| `npm run check` | `svelte-kit sync` + `svelte-check` con `tsconfig.json`. |
| `npm run lint` | `prettier --check .` y `eslint .`. |
| `npm run format` | `prettier --write .`. |
| `npm run check:sedes` | Compara `src/lib/config/cinemasSeed.ts` con la vista `cinema_locations_public` de Supabase. |

No hay pruebas automatizadas (no existen archivos `*.test.*` ni `*.spec.*`). Para dar algo por bueno: `npm run check`, `npm run lint` y `npm run check:sedes`, más revisar la ruta afectada en el navegador.

## Guardas

- **`prebuild` (`scripts/check-build-env.js`)**: lee `.env`, exige `VITE_ADMIN_API_URL` y avisa si apunta a localhost. Sin esta guarda, un build podía salir apuntando a la infraestructura equivocada.
- **`check:sedes` (`scripts/check-sedes.mjs`)**: falla en CI si no puede verificar o si la semilla no coincide con la base. Fuera de CI solo avisa. Si falla, actualizar `src/lib/config/cinemasSeed.ts` con los datos que imprime y volver a compilar.
- **Divergencia en runtime**: `cinema.svelte.ts` compara la semilla con `GET /api/v1/locations` en cada arranque y la red siempre gana.

## Sedes

La lista de sedes sale de la base de datos del backend. Para agregar o retirar una sede:

1. Cambiar la sede en la base (la vista pública es la fuente que lee `check:sedes`).
2. Ejecutar `npm run check:sedes`. Si falla, copiar la salida a `src/lib/config/cinemasSeed.ts`.
3. Compilar y desplegar.

Una sede retirada se sigue viendo en la semilla hasta que se actualiza. El layout expulsa al usuario si está en esa sede.

## Desarrollo local

1. `npm install`.
2. Crear `.env` con `VITE_ADMIN_API_URL` apuntando a un backend accesible (local o de pruebas). El backend debe responder con CORS para el origen de la webapp (ver [CONTRATO-BACKEND.md](../src/lib/api/CONTRATO-BACKEND.md)).
3. `npm run dev` y abrir `http://localhost:5174`.

Las imágenes del hero y los tráilers vienen de la red. `HERO_TRAILERS_ENABLED` en `src/lib/config/heroTrailers.ts` apaga la carga de clips (ver [catálogo y medios](./referencia/catalogo-y-medios.md)).

## Build y despliegue

- `npm run build` genera un sitio estático en `build/` con `adapter-static` y `fallback: 'index.html'`.
- Hosting: sirve `build/` como estático y reescribe las rutas desconocidas a `index.html`. Sin esa reescritura, al recargar `/cines/...` se obtiene 404.
- Destino real del despliegue: sin verificar. El script de build menciona Render, pero la documentación central dice que Render se está apagando en favor del VPS. Confirmar antes de desplegar.
- `build/` y `.svelte-kit/` están en `.gitignore`; no se versionan.
- Antes de publicar: `robots.txt` permite rastreo y las páginas llevan `noindex` (`src/app.html`, línea 19). Es intencional para pre-lanzamiento (ver [backlog](./backlog.md)).

## Qué no está en git (a propósito)

Según `.gitignore`: `.env`, `build/`, `/resources-cinema` (pósters y fotos sin optimizar), `/scripts_y_pruebas` (procesado de tráilers con ffmpeg y reprocesos) y `/static/trailers` (clips, que van al almacenamiento del backend y no al repo).

## Scripts auxiliares

- `scripts/procesar-combos.py`: recorta las fotos de los banners de combos (1920x1080, texto quemado a la derecha) y se queda con la foto. Ver la cabecera del archivo para los detalles.
- `scripts_y_pruebas/process_trailers.mjs` y `reprocess_05.mjs`: procesado de clips. No están en git.
