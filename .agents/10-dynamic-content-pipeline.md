# Pipeline de Contenido Dinámico (Tráilers y futuro: GIFs/posters animados)

Este documento describe qué hace falta operativamente para mantener la web
"viva" con clips de tráiler propios, y cómo está construido el sistema de
fallback en `scrapp-webapp-cinema`.

## 1. Origen del contenido

El cine recibe de cada distribuidora el archivo de video del tráiler oficial
(el mismo contenido que se publica en YouTube) para uso publicitario propio.
Hoy ese archivo se usa en el digital signage del cine (pantallas sin
conexión constante a internet). El mismo archivo puede reutilizarse para la
web, adaptándolo de formato.

> **Nota de alcance:** el permiso que la distribuidora otorga es para
> "publicidad propia" — antes de publicar el primer clip en la web pública
> (no solo en las pantallas internas del cine), confirmar con quien gestionó
> ese acuerdo que cubre explícitamente uso en sitio web público. No es algo
> que este documento pueda resolver por sí solo.

## 2. Los 3 niveles de fallback (ya implementados)

`TrailerBackground.svelte` decide automáticamente qué mostrar en el hero de
cada película, en este orden:

**Regla de oro (restricción de distribuidoras):** el banner/clip se muestra
siempre completo, a su proporción natural, **sin overlays ni desenfoques
encima** — nada de texto o botones superpuestos a la imagen. Todo control
(título, "Comprar Boletos", ícono de tráiler/sonido) vive en una franja
aparte, debajo del medio.

1. **Clip propio (`trailer_asset_url`)** — si existe, se reproduce en loop,
   silenciado, ocupando el ancho completo del hero (16:9, sin recortes). El
   ícono debajo del hero pasa a ser un toggle de sonido en vez de un enlace.
   Se carga de forma perezosa (`IntersectionObserver`): nunca descarga el
   video hasta que el hero entra en pantalla.
2. **Enlace de YouTube (`trailer_url`)** — si no hay clip propio pero sí hay
   el tráiler oficial de YouTube (ya se obtiene automáticamente vía TMDB al
   enriquecer metadata en Xelaris), el ícono debajo del hero abre YouTube en
   pestaña nueva. Cero impacto en el diseño del hero.
3. **Búsqueda en YouTube** — si no hay ninguno de los dos datos, el mismo
   ícono arma una búsqueda por título ("{película} tráiler oficial").

Si una película no tiene `banner` (backdrop) en absoluto, simplemente no
entra en la rotación del hero — nunca se usa el póster ahí.

## 3. Especificación técnica para subir un clip propio

Cuando el equipo tenga un archivo listo para publicar en la web:

- **Formato:** `.mp4` (H.264) — mejor compatibilidad que `.webm`.
- **Proporción:** 16:9 exacto (igual que los backdrops de TMDB) — el
  contenedor del hero está fijado a esa proporción para no recortar ni
  dejar barras negras. Un archivo con otra proporción sí se vería
  recortado o con letterboxing.
- **Orientación:** horizontal/panorámica. El caso de video vertical *sobre
  el póster* de cada tarjeta es una idea separada, todavía no construida
  (ver sección 5).
- **Duración:** 10–20 segundos en loop es suficiente — no hace falta el
  tráiler completo, el objetivo es ambiente, no narrativa.
- **Peso objetivo:** idealmente bajo 5–8 MB para ese fragmento, comprimido
  (esto es lo que hace que la carga perezosa realmente ahorre datos al
  usuario).
- **Sin audio necesario** (se reproduce silenciado por defecto), pero no
  estorba si el archivo lo trae.
- **Dónde subirlo:** bucket `webapp_assets` en Supabase Storage (público, ya
  existe — confirmado en `.agent-tasks/01-resultado.md`).
- **Cómo activarlo:** pegar la URL pública resultante en la columna
  `trailer_asset_url` de la fila correspondiente en `wbpp_movies` (columna
  agregada vía `.agent-tasks/03-add-trailer-asset-column.md`). Hoy esto se
  hace manualmente en Supabase; no existe todavía un campo en el panel de
  Xelaris para esto — es trabajo futuro si se vuelve una tarea recurrente.

## 4. Mantenimiento continuo

Cada vez que entra una película nueva en preventa/estreno y se quiera que
tenga clip propio en el home:
1. Ubicar el archivo de tráiler entregado por la distribuidora.
2. Recortar/comprimir según la especificación de la sección 3.
3. Subir al bucket `webapp_assets`.
4. Pegar la URL en `wbpp_movies.trailer_asset_url` para esa película.

Sin este paso manual, la web sigue funcionando normalmente (cae al nivel 2
o 3 del fallback) — no es bloqueante, es una mejora incremental.

## 5. Futuro (fuera de alcance actual)

- **GIFs o clips verticales sobre el póster de cada tarjeta** (no solo el
  hero) — misma lógica de assets propios, pero aplicada a
  `NowPlayingCarousel`/`HeroCarousel` en vez de solo al hero. Requiere
  decidir si se generan recortes verticales distintos al clip del hero o si
  se reutiliza el mismo archivo.
- **Campo dedicado en el panel administrativo** para subir el clip
  directamente desde Xelaris en vez de pegar la URL a mano en Supabase.
