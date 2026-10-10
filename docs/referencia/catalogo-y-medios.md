# Catálogo, sedes y medios (tráilers, pósters, promociones)

Estado: verificado el 10-oct-2026 en el código del frontend. Los datos de base y de almacenamiento vienen de tareas ejecutadas entre el 4 y el 9 de septiembre de 2026 y de una auditoría del 18-sep-2026; no se han vuelto a comprobar contra Supabase.

## Fuentes de datos

- El frontend no lee la base. Pide la cartelera, sedes y promociones al backend (`src/lib/api/index.ts`). El contrato con sus campos está en [CONTRATO-BACKEND.md](../../src/lib/api/CONTRATO-BACKEND.md).
- Confitería (combos, menú, armador, promociones): datos mock en `src/lib/data/`. No hay fuente real aún.
- Tabla de películas (general del backend): `wbpp_movies`; funciones: `wbpp_showtimes`; promociones: `wbpp_promos`. Esquema y reglas de la base: documentación general del proyecto.

## Sedes

- La semilla del bundle es `src/lib/config/cinemasSeed.ts`. Se verifica contra la base en cada arranque (ver [operación](../operacion.md#sedes)).
- La vista pública de sedes es `cinema_locations_public`. El rol anónimo puede leerla; la tabla base `cinema_locations` quedó sin lectura anónima porque guarda credenciales de POS y taquilla (verificado el 7-sep-2026).
- `timezone` (IANA) es obligatorio y `NOT NULL` sin valor por defecto desde el 7-sep-2026. Candelaria y Lido quedaron en `America/Caracas`. Una sede sin zona horaria no debe entrar.

## Cartelera y funciones

- Se pide `GET /api/v1/movies?location_id=…` por sede. El layout une las sedes activas (`mergeMovies` en `src/routes/+layout.ts`).
- Horarios: se comparan con la hora de la sede, no con la del visitante (`APP_TIMEZONE`).
- El POS emite una entrada por formato (por ejemplo, ESP y SUB) y el backend las agrupa bajo una película madre (`grouped_ids`). La madre muestra las funciones de sus hijas (comportamiento según auditoría del 18-sep-2026, no verificado en el backend).

## Tráilers

Estado de la implementación (verificado):

- `src/lib/config/heroTrailers.ts`: `HERO_TRAILERS_ENABLED = true`. Con `false`, el hero siempre muestra el banner estático y no descarga clips. Nota: la auditoría del 18-sep lo registró en `false`; hoy está en `true`.
- `TrailerBackground.svelte` decide qué mostrar en el hero: clip, si existe y el interruptor está activo, o banner estático.
- Regla de las distribuidoras: el banner o el clip se muestran completos, sin overlays ni desenfoques encima. Los controles van en una franja aparte.
- `TrailerLightbox.svelte`: "me gusta", calificación y reseña viven solo en `localStorage`. Ver [backlog](../backlog.md).

Datos y almacenamiento (según tareas y auditoría de septiembre de 2026):

- Bucket público `webapp_assets` en Supabase Storage. Hay clips en `trailers/hero/<slug>.webm` y `trailers/poster/<slug>.webm`.
- Columnas en `wbpp_movies`: `trailer_asset_url` (hero) y `trailer_hover_asset_url` (póster). Son la única fuente de verdad. No se usa convención de nombre de archivo en el frontend.
- El panel de administración (`scrapp-administrative-v2`, `/admin/webapp`, pestaña "Tráilers") sube, reemplaza y limpia clips. Al reemplazar o borrar, lee la URL guardada para encontrar el archivo real, porque algunos clips se subieron con el slug y no con el id de la película (corregido el 6-sep-2026).
- Los 9 clips se migraron el 5-6 de septiembre. El 18-sep se enlazaron 7 películas activas, con URL que responden `video/webm` (HTTP 200).

Especificación de compresión (para nuevos clips, según la documentación de pipeline de septiembre):

| | Hero (banner) | Póster (hover) |
|---|---|---|
| Códec | `.webm` VP9, sin audio | `.webm` VP9, sin audio |
| Resolución | 854x480 | 360 de ancho (2:3) |
| Duración | 10-15 s en loop | 3-5 s en loop |
| Peso objetivo | 3-5 MB (máximo ~6) | menos de 300 KB (máximo ~500) |

```bash
# Hero: -b:v es el techo real de bitrate; sin él, VP9 con solo -crf puede sobredimensionar.
ffmpeg -i entrada.mp4 -ss 00:00:05 -t 15 -vf "scale=854:-2" -an \
  -c:v libvpx-vp9 -b:v 800k -maxrate 900k -bufsize 1200k -crf 34 -deadline good -cpu-used 2 \
  salida-hero.webm

# Póster: mismo patrón, más corto y menor bitrate.
ffmpeg -i entrada.mp4 -ss 00:00:05 -t 4 -vf "scale=360:-2" -an \
  -c:v libvpx-vp9 -b:v 500k -maxrate 600k -bufsize 800k -crf 36 -deadline good -cpu-used 2 \
  salida-poster.webm
```

Pendientes de tráilers:

- Confirmar con la distribuidora que el permiso de "publicidad propia" cubre la web pública antes de publicar un clip. Esta decisión no es técnica.
- Decidir el hosting definitivo. La recomendación de septiembre fue Cloudflare R2 (sin costo de salida), porque Supabase Storage cobra por egress. Hoy sigue en Supabase.

## Pósters y banners

- Hoy los pósters vienen de TMDB directo al navegador (transitorio). Objetivo: tres tamaños en WebP guardados en el almacenamiento propio (ver [CONTRATO-BACKEND.md](../../src/lib/api/CONTRATO-BACKEND.md), sección de imágenes).
- `src/lib/utils/images.ts` usa `posterSizes` y `bannerSizes` si vienen; si no, deriva tamaños de TMDB; si solo hay una URL, la muestra tal cual.
- En la base había películas con `tmdb_id` vacío y pósters subidos a rutas que ya no existían (auditoría del 18-sep). Esos datos son de la base, no del frontend.

## Promociones

- Vienen de `GET /api/v1/promos?location_id=…`. Sin sede no hay promoción.
- El texto del aviso "Lunes Populares" se corrigió en la base el 9-sep-2026 (quitó una redundancia). Es un dato de la tabla `wbpp_promos`, no del repo.

## Auditoría del catálogo del 18-sep-2026 (snapshot)

Estado: snapshot, no re-verificado. Sirve como referencia de lo que se encontró:

- 35 películas (16 activas, 19 borrador) y 228 funciones entre el 10 y el 24 de septiembre. Sin funciones huérfanas.
- Clips: 18 archivos en el bucket (9 de hero y 9 de póster) sin referencia en la base en ese momento. Se enlazaron 7 películas activas. Quedan sin enlazar 2 clips (`elheladero`, `unanochealano`) porque sus películas ya no están en el catálogo.
- Pendientes de datos: rellenar `tmdb_id` en las películas activas, limpiar 6 pósters huérfanos y normalizar 3 tráilers que guardaban un espacio en blanco en vez de `NULL`.

Los pendientes de datos son del backend y de la base, no de este repo. Ver [backlog](../backlog.md) para lo que sí corresponde al frontend.
