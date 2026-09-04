# 01 — Auditar almacenamiento de imágenes de películas en Supabase

## Objetivo
Determinar si las imágenes de películas (pósters/banners) que hoy alimentan
`scrapp-webapp-cinema` ya viven en Supabase Storage optimizadas, o si son
URLs crudas de TMDB/Cinexo sin optimizar — para poder decidir si necesitamos
un pipeline de subida/optimización antes de habilitar edición desde el CMS
administrativo.

## Contexto
`scrapp-webapp-cinema` es una SPA estática (Cloudflare Pages/Vercel, sin
servidor). Cualquier imagen que el equipo de mercadeo deba poder cambiar sin
que un desarrollador haga un redeploy **debe** venir de una fuente en
runtime (Supabase Storage), no del bundle del repo. Ya existe la intención
documentada en `scrapp-administrative-v2` de un CMS que enriquece `wbpp_movies`
con banners de alta resolución vía TMDB (ver `.agent/gem-docs/05-webapp-cinema-sync.md`
sección de sincronización). Necesitamos confirmar el estado real antes de
diseñar el flujo de subida de assets nuevos (pósters, banners de promos,
futuras fotos de combos).

## Alcance
1. Conectar al proyecto Supabase `scrapp-database` (ID `kicyswemjxroszgjftkl`).
2. Ejecutar una consulta de muestra sobre `wbpp_movies` (columnas de
   imagen: `poster_url`, `backdrop_url` o equivalentes — confirmar nombres
   reales primero con `\d wbpp_movies` o el catálogo de columnas).
3. Clasificar los valores encontrados:
   - ¿Apuntan a un dominio de Supabase Storage (`*.supabase.co/storage/...`)?
   - ¿Apuntan directo a `image.tmdb.org` u otro CDN externo sin control
     propio?
   - ¿Hay valores nulos o vacíos?
4. Revisar si ya existe un bucket de Storage dedicado a estos assets
   (`list buckets` o inspección del dashboard) y si tiene política pública
   de lectura.
5. Reportar también cuántas filas de `wbpp_movies` tienen imagen vs cuántas
   no.

## Criterio de aceptación
Un resumen (en este archivo o en `01-resultado.md`) que responda:
- ¿De dónde vienen hoy las imágenes que ve el usuario final?
- ¿Existe ya un bucket utilizable para alojar imágenes editables por
  mercadeo, o hay que crearlo?
- Cualquier fila con imagen rota o faltante que valga la pena señalar.

## Fuera de alcance
- No crear el bucket ni subir imágenes todavía — esto es solo diagnóstico.
- No modificar el esquema de `wbpp_movies`.
- No tocar código del repo `scrapp-webapp-cinema` ni `scrapp-administrative-v2`.
