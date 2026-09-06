# 05 - QA Fixes (V2 Resultado)

## Problema Resuelto: Archivos Huérfanos en Supabase Storage
Se ha corregido el comportamiento de las acciones `clearTrailer` y `uploadTrailer` en el panel administrativo (`scrapp-administrative-v2`).

Originalmente, al intentar reemplazar o eliminar un clip, el código reconstruía la ruta del bucket asumiendo que el archivo se llamaba `<movie_id>.<ext>`. Debido a que la migración inicial masiva subió los archivos nombrándolos por su **slug** (ej. `coyotevsacme.webm`), los intentos de borrado fallaban silenciosamente, dejando el archivo original huérfano en el bucket.

## Solución Aplicada
En `admin/webapp/+page.server.ts`, tanto `uploadTrailer` como `clearTrailer` ahora realizan los siguientes pasos antes de ejecutar cualquier acción destructiva (borrado o reemplazo):
1. Recuperan el registro de la película desde `wbpp_movies` usando el `movie_id`.
2. Leen la URL exacta guardada en `trailer_asset_url` o `trailer_hover_asset_url`.
3. Extraen el _path_ real de almacenamiento aislando todo el contenido posterior a `/object/public/webapp_assets/`.
4. Ejecutan el borrado en Supabase Storage utilizando esa ruta exacta.

Gracias a este fix, el panel ahora soporta la limpieza o reemplazo de clips sin importar la convención con la que fueron nombrados originalmente (por slug o por id), previniendo fugas de almacenamiento en el bucket.
