# 04 — Subir el primer clip de tráiler real (prueba de rendimiento)

## Objetivo
Tener al menos una película real del catálogo actual con
`trailer_asset_url` poblado, para probar en producción la carga
perezosa y el rendimiento del hero dinámico de `scrapp-webapp-cinema`.

## Contexto
Ver `.agents/10-dynamic-content-pipeline.md` para la arquitectura completa.
El usuario (Emanuel) tiene los archivos de tráiler entregados por las
distribuidoras guardados localmente (carpeta de oficina) — **no se debe
descargar ni extraer nada de YouTube ni de TMDB para esto** (TMDB no aloja
el archivo, solo enlaza a YouTube; descargar de ahí viola sus Términos de
Servicio y no es la fuente que se quiere usar).

Película sugerida para la prueba: **Spiderman: Un Nuevo Día** (o el título
exacto que exista hoy en `wbpp_movies` — confirmar coincidencia antes de
asumir el nombre).

## Alcance
1. Confirmar que el ticket 03 (columna `trailer_asset_url`) ya está
   resuelto. Si no, resolverlo primero.
2. El usuario colocará el archivo de video localmente en:
   `scrapp-webapp-cinema/resources-cinema/trailers/` (crear la carpeta si
   no existe; esa carpeta ya está en `.gitignore`, no se versiona).
3. Confirmar/ajustar el archivo al formato de la especificación (sección 3
   de `.agents/10-dynamic-content-pipeline.md`): `.mp4` H.264, horizontal
   16:9, 10–20s en loop, idealmente bajo 5–8 MB.
4. Subir el archivo resultante al bucket `webapp_assets` de Supabase
   Storage y obtener la URL pública.
5. Actualizar la fila correspondiente en `wbpp_movies` (buscar por título)
   con `trailer_asset_url = <URL pública>`.

## Criterio de aceptación
- `GET /api/v1/movies` (cualquier `location_id`) devuelve
  `trailerAssetUrl` con la URL real para esa película.
- La URL carga un video reproducible directamente en el navegador (probar
  abriéndola directo, no solo que exista en la fila).

## Fuera de alcance
- No tocar ninguna otra película todavía — es una prueba con una sola.
- No usar `yt-dlp` ni ninguna herramienta de descarga de YouTube/TMDB para
  obtener el archivo. El archivo lo aporta el usuario directamente.
