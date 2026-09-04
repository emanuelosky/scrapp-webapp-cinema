# 03 — Agregar columna `trailer_asset_url` a `wbpp_movies`

## Objetivo
Permitir que cada película tenga un clip de tráiler **propio, auto-alojado**
(distinto del `trailer_url` de YouTube que ya existe), para reproducirlo sin
depender de un embed externo en el hero de `scrapp-webapp-cinema`.

## Contexto
`wbpp_movies.trailer_url` ya existe y guarda el enlace de YouTube del tráiler
oficial (viene del enriquecimiento con TMDB). Ese campo se usa como
**fallback** (botón "Ver Tráiler" que abre YouTube en pestaña nueva).

El objetivo de negocio es distinto: el cine recibe los archivos de video del
tráiler directamente de la distribuidora (los mismos que van a YouTube, pero
como archivo propio) para hacer publicidad. Un equipo interno los adaptará
(formato, recorte, compresión) y los subirá manualmente al bucket
`webapp_assets` de Supabase Storage (ya existe, público — confirmado en el
ticket 01). Este ticket es solo la columna para guardar esa URL resultante.

## Alcance
1. Agregar columna `trailer_asset_url` (tipo `text`, nullable) a
   `wbpp_movies`.
2. No hace falta backfill — quedará vacía hasta que el equipo suba los
   primeros clips manualmente (el frontend ya maneja el caso `null`
   mostrando el fallback de YouTube).
3. Confirmar que el bucket `webapp_assets` acepta archivos `.mp4`/`.webm`
   sin restricciones de tipo MIME que lo impidan.

## Criterio de aceptación
- La columna existe y es nullable.
- Confirmación de que se puede subir un archivo de video de prueba al
  bucket `webapp_assets` y obtener una URL pública funcional.

## Fuera de alcance
- No subir ningún clip real todavía.
- No tocar código de `scrapp-webapp-cinema` ni `scrapp-administrative-v2`
  (ya está hecho del lado de Claude — el endpoint `/api/v1/movies` ya
  devuelve `trailerAssetUrl`, que hoy siempre será `undefined` hasta que
  esta columna exista y tenga datos).
