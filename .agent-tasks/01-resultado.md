# Resultado Auditoría: Almacenamiento de Pósters

## 1. Fuente Actual de las Imágenes
Tras auditar la tabla `wbpp_movies` (46 películas en total), la gran mayoría de las imágenes **aún apuntan directamente a TMDB**, no a Supabase. 

**Resumen de valores en `poster_url`:**
- **37 películas** apuntan a `image.tmdb.org`.
- **1 película** apunta a un dominio de Supabase.
- **8 películas** tienen el campo nulo o vacío.

**Resumen de valores en `backdrop_url`:**
- **37 películas** apuntan a `image.tmdb.org`.
- **0 películas** apuntan a Supabase.
- **9 películas** tienen el campo nulo o vacío.

*Conclusión:* Las imágenes están dependiendo de un CDN externo y requeriremos crear un pipeline/script para descargar, procesar y migrar estas imágenes hacia nuestro propio Storage.

## 2. Estado de Supabase Storage
Revisé los buckets actuales en `scrapp-database` y **sí existe** un bucket ya creado y configurado:
- **Nombre:** `webapp_assets`
- **Estado:** Público (`public = true`).

*Conclusión:* No hace falta crear un nuevo bucket ni configurar políticas de lectura. El bucket `webapp_assets` está listo para recibir las imágenes que suba el equipo de mercadeo desde el CMS.

## 3. Imágenes Faltantes
Hay 8 o 9 películas que están huérfanas de assets (campos nulos en pósters y banners). Esto puede deberse a que TMDB no encontró coincidencias o porque son eventos/películas locales sin ficha en TMDB. El pipeline deberá contemplar una imagen por defecto o placeholder.
