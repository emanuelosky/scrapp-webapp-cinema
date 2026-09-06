# 05 — Migrar los 9 clips de tráiler confirmados a Supabase Storage

## Objetivo
Reprocesar (corrigiendo el bug de bitrate de `laodisea`) y subir los 9
clips de tráiler ya confirmados contra el catálogo real a Supabase
Storage, poblar `wbpp_movies.trailer_asset_url` para cada uno, y
construir en `scrapp-administrative-v2` (`/admin/webapp`) el panel para
gestionar esos tráilers desde ahí en adelante — para medir en una
prueba controlada el rendimiento de red y la carga asíncrona del hero
dinámico sirviendo desde un bucket en vez de `static/`, y para que el
equipo deje de depender de tickets manuales cada vez que haya que
asignar, reemplazar o quitar un clip.

**Nota de alcance de repos:** este ticket toca dos proyectos —
`scrapp-webapp-cinema` (de donde sale este archivo) para el
reprocesamiento de los clips, y `scrapp-administrative-v2` (BFF y panel
administrativo) para el bucket, la columna en BD y el panel nuevo. No es
un error que el paso 6 pida tocar componentes Svelte fuera de este
repo — el BFF que habla con Supabase vive en `scrapp-administrative-v2`,
así que la gestión de tráilers (subir, limpiar, ver a qué película está
asignado cada uno) pertenece ahí, no en `scrapp-webapp-cinema` ni es
tarea de Claude.

## Contexto
Ver `.agents/10-dynamic-content-pipeline.md` (arquitectura completa del
pipeline y los 3 niveles de fallback) y `.agent-tasks/04-resultado.md`
(cómo se generaron los 13 clips locales originales).

**Importante — esta prueba es intencionalmente temporal.** La sección 3
de `.agents/10-dynamic-content-pipeline.md` ya evaluó dónde alojar estos
clips y **descartó Supabase Storage a propósito** para la fase de
producción: su plan gratuito cobra por cada GB servido (a diferencia de
Cloudflare R2, que no cobra egress) y no da margen para servir video con
tráfico real. El usuario tiene hoy 5 GB de egress disponibles en su
proyecto de Supabase — cualquier tráfico que consuma el bucket cuenta
contra esa cuota, incluyendo tráfico del propio equipo probando en
desarrollo (no solo visitantes reales). El equipo decidió aceptar ese
costo ahora, a propósito, para generar datos reales de rendimiento antes
de decidir el hosting definitivo — este ticket NO cambia la
recomendación de R2 para producción, solo produce la prueba.

`src/routes/+page.ts` en `scrapp-webapp-cinema` ya prioriza
`trailer_asset_url` de la fila de `wbpp_movies` por encima del shim
local (`matchLocalHeroTrailer`) si ese campo viene poblado — por lo tanto
**no hace falta tocar ningún componente Svelte ni `+page.ts`** para que
esta migración tenga efecto: en cuanto la columna quede poblada, el
frontend empieza a servir desde la URL de Supabase automáticamente.

**Aclaración de vocabulario — "póster" aquí NO es la imagen de TMDB.**
Este documento usa "póster" (heredado del nombre de carpeta
`static/trailers/posters/`) para referirse al **clip de video corto
(3–5s, vertical) que se reproduce al hacer hover sobre la tarjeta de una
película** — la función descrita en `.agent-tasks/04-resultado.md`
sección 2 para `MovieGlassCard.svelte` (todavía no implementada en el
frontend, solo el asset está listo). No tiene relación con
`wbpp_movies.poster_url` (la imagen estática de TMDB que ya se usa en
toda la app) — esa no cambia en absoluto con este ticket. Por eso la
columna nueva se llama `trailer_hover_asset_url` y no
`trailer_poster_asset_url` — para no confundirla con `poster_url`.

### Las 9 películas confirmadas (fuente → slug → título)

| Archivo fuente (`resources-cinema/trailers/`) | Slug | Nota |
|---|---|---|
| `coyotevsacme_trailer.webm` | `coyotevsacme` | |
| `icecreamman_trailer.webm` | `elheladero` | renombrado, confirmar título exacto en `wbpp_movies` |
| `LaGuerraDeLosUltimos_trailer.webm` | `laguerradelosultimos` | |
| `LaNocheDelDemonio_trailer.webm` | `lanochedeldemonio` | |
| `LaOdisea_trailer.webm` | `laodisea` | **reprocesar con tope de bitrate, ver más abajo** |
| `MashaYelOso_trailer.webm` | `mashaylosos` | renombrado |
| `PawPatrol_trailer.webm` | `lapatrullacanina` | renombrado |
| `SoloPorUnaNoche_Trailer.webm` | `unanochealano` | renombrado |
| `SpiderMan_Trailer.webm` | `spiderman` | ya existe un archivo subido por el ticket 04 (formato `.mp4`) — revisar antes de duplicar, ver Alcance paso 3 |

Para cada una, buscar la fila correspondiente en `wbpp_movies` por
título (mismo patrón que el ticket 04) — no asumir el nombre exacto sin
confirmar contra la tabla real.

## Alcance

1. **Reprocesar los 9 archivos** con los comandos de
   `.agents/10-dynamic-content-pipeline.md` sección 3 (ya traen tope de
   bitrate explícito — es lo que corrige el caso de `laodisea`, que hoy
   pesa 15.8 MB por falta de ese tope):

   Hero (horizontal, banner):
   ```bash
   ffmpeg -i entrada.webm -ss 00:00:05 -t 15 \
     -vf "scale=854:-2" -an \
     -c:v libvpx-vp9 -b:v 800k -maxrate 900k -bufsize 1200k -crf 34 \
     -deadline good -cpu-used 2 \
     static/trailers/hero/<slug>.webm
   ```

   Póster (vertical, hover):
   ```bash
   ffmpeg -i entrada.webm -ss 00:00:05 -t 4 \
     -vf "scale=360:-2" -an \
     -c:v libvpx-vp9 -b:v 500k -maxrate 600k -bufsize 800k -crf 36 \
     -deadline good -cpu-used 2 \
     static/trailers/posters/<slug>.webm
   ```

   Repetir para los 9 pares fuente→slug de la tabla de arriba
   (`entrada.webm` = el archivo listado en `resources-cinema/trailers/`,
   `<slug>.webm` = el nombre de salida). Confirmar con `ffprobe` que
   `laodisea.webm` (hero) queda dentro de 3–6 MB antes de subirlo — si
   sigue fuera de rango, no continuar con la subida de ese archivo hasta
   resolverlo.

2. **Crear/usar el bucket de Supabase Storage.** Reutilizar el bucket
   `webapp_assets` (el mismo del ticket 04) para consistencia. Antes de
   subir el clip de `spiderman`, revisar si el archivo `.mp4` que subió
   el ticket 04 sigue ahí — si sí, decidir si se reemplaza por este
   `.webm` recién generado (recomendado, mismo formato que el resto) o
   se conserva el `.mp4` existente y se omite `spiderman` de este lote;
   documentar la decisión en el resultado.

3. **Subir los 9 archivos hero + 9 póster** (18 archivos) manteniendo la
   misma estructura de carpetas que `static/trailers/` dentro del
   bucket: `trailers/hero/<slug>.webm` y `trailers/posters/<slug>.webm`.
   Obtener la URL pública de cada uno.

4. **Poblar `wbpp_movies.trailer_asset_url`** (hero) **y
   `trailer_hover_asset_url`** (póster, columna nueva — ver la
   respuesta al plan más abajo) para las 9 filas correspondientes, con
   la URL pública de cada clip. El póster todavía no tiene consumidor en
   el frontend de `scrapp-webapp-cinema` (`MovieGlassCard.svelte` no
   implementa el hover-clip todavía, es solo documentación a futuro en
   `.agent-tasks/04-resultado.md` sección 3), pero el panel de gestión
   (paso 6) sí necesita esa columna poblada para mostrar su estado — no
   la dejen vacía solo porque el frontend del webapp aún no la consuma.

5. Reportar en `05-resultado.md`: URLs públicas finales (hero y póster,
   las 18), tamaño final de cada archivo (confirmar que `laodisea` quedó
   corregido), y qué filas de `wbpp_movies` se actualizaron (id + título).

6. **Construir el panel de gestión de tráilers en
   `scrapp-administrative-v2`, ruta `/admin/webapp`.** Es parte de este
   mismo cambio, no una tarea aparte — sin esto, cada asignación futura
   requeriría otro ticket manual. Ubicación en el repo:
   `src/routes/(app)/admin/webapp/` (ya existe esa ruta con un patrón de
   paneles establecido — `WebappCleanerPanel.svelte`,
   `WebappOrphansPanel.svelte`, `WebappMoviesTable.svelte`, etc.; seguir
   ese mismo patrón para un `WebappTrailersPanel.svelte` nuevo, o una
   sub-ruta `/admin/webapp/trailers` si el panel crece demasiado para
   vivir como una sección más de la página existente — a criterio de
   quien lo implemente).

   Capacidades mínimas que el panel necesita cubrir:
   - **Listado con estado por película:** título, si tiene clip hero
     asignado (sí/no + URL), si tiene clip póster asignado (sí/no + URL).
     Debe ser fácil ver de un vistazo qué películas del catálogo activo
     todavía no tienen tráiler propio (caen al fallback de YouTube).
   - **Asignar/reemplazar:** subir un archivo `.webm` ya procesado (o
     los dos, hero y póster) para una película, que lo suba al bucket
     `webapp_assets/trailers/...` y actualice `trailer_asset_url` en
     `wbpp_movies` para esa fila. No hace falta que el panel corra
     ffmpeg — asume que el archivo ya viene procesado (los comandos de
     la sección 3 de `.agents/10-dynamic-content-pipeline.md` son la
     referencia para quien prepare el archivo antes de subirlo).
   - **Limpiar/quitar:** para una película con tráiler asignado, poder
     borrar el archivo del bucket y limpiar `trailer_asset_url` (vuelve
     a caer al fallback de YouTube automáticamente, sin tocar código).
   - **Vista previa:** un `<video>` o thumbnail para confirmar que el
     archivo subido es el correcto antes/después de asignarlo, evita
     asignar el clip equivocado a una película por error de nombre.

   Esto requiere las rutas de servidor (`+page.server.ts` o
   `/api/admin/...`, según el patrón que ya use el resto de
   `/admin/webapp`) que hablen con el bucket de Supabase Storage y con
   `wbpp_movies` — ese es el trabajo de BFF que le corresponde a este
   ticket, no a `scrapp-webapp-cinema`.

## Criterio de aceptación
- Los 18 archivos están en el bucket `webapp_assets`, accesibles
  públicamente (200 OK al pedirlos directo, `content-type` de video).
- `laodisea.webm` (hero) pesa entre 3–6 MB, no 15.8 MB.
- Las 9 filas de `wbpp_movies` tienen `trailer_asset_url` poblado con la
  URL pública del bucket (no una ruta `/trailers/...` local).
- Cargar el home de `scrapp-webapp-cinema` y confirmar en la pestaña
  Network del navegador que el video se pide contra el dominio de
  Supabase, no contra `/trailers/hero/...` — sin necesitar ningún cambio
  de código en el repo del webapp.
- El panel en `/admin/webapp` de `scrapp-administrative-v2` permite:
  ver el estado de tráiler de cualquier película del catálogo, subir/
  reemplazar un clip para una película, y limpiar (quitar) uno ya
  asignado — probado en vivo, no solo el código escrito.

## Fuera de alcance
- **No tocar `hechizo`** — su coincidencia con un título real del
  catálogo sigue sin confirmar (pendiente que el usuario la indique).
  No asignarlo a ninguna fila de `wbpp_movies` por adivinanza.
- **No tocar `clayface`, `dunapartetres`, `juegosdelhambre`** — confirmado
  por el usuario que no existen en el catálogo actual. Sus fuentes en
  `resources-cinema/trailers/` y los `.webm` locales ya se descartaron.
- **No editar componentes Svelte, `+page.ts` ni `localTrailers.ts`** —
  el pipeline ya prioriza la columna de BD automáticamente (ver
  Contexto). Una vez este ticket esté resuelto y confirmado, Claude se
  encarga de borrar `static/trailers/` del repo (ya no haría falta con
  la columna poblada) — no lo borres tú desde este ticket, por si la
  prueba necesita compararlos lado a lado primero.
- **No decidir el hosting definitivo.** Esto es una prueba de
  rendimiento sobre Supabase Storage a petición explícita del equipo;
  la recomendación ya documentada para producción sigue siendo
  Cloudflare R2 (sección 3 de `10-dynamic-content-pipeline.md`).
- **El panel de `/admin/webapp` no necesita correr ffmpeg ni procesar
  video** — solo subir archivos ya procesados y gestionar el
  bucket/BD. El reprocesamiento (paso 1) es un paso previo, manual o
  scripteado, separado del panel.

## Respuesta al plan propuesto (revisado por Claude, 2026-09-05)

Plan aprobado en general — buena división en fases, y la arquitectura de
subir el archivo vía `action` de SvelteKit al servidor (que después usa
`supabaseServer` con service role) en vez de subir directo desde el
navegador es la correcta: evita exponer la service role key al cliente
y evita tener que configurar CORS en el bucket. Adelante con eso.

Sobre las dos preguntas puntuales:
- **Reemplazar el `.mp4` viejo de Spiderman por el `.webm` nuevo:** sí,
  de acuerdo — es la opción que el ticket ya marcaba como recomendada
  (formato consistente con el resto del catálogo).
- **Arquitectura de `actions` sin depender de CORS:** confirmado, es el
  enfoque correcto.

Auditamos `scrapp-administrative-v2` directamente para no dejar las dos
dudas abiertas. Resultado — una se descarta, la otra se confirma y ahora
viene con instrucciones concretas:

1. **Auth: confirmado, sin acción necesaria.** `src/hooks.server.ts`
   (líneas ~213–231) ya aplica un gate server-side global: redirige a
   `/` si no hay sesión, y a `/dashboard` si el rol no es `admin` para
   cualquier ruta bajo el prefijo `/admin` (`ADMIN_ONLY_PREFIX`). Esto
   cubre `/admin/webapp` y cualquier sub-ruta sin necesitar un
   `+layout.server.ts` propio. Las nuevas `actions` (`uploadTrailer`,
   `clearTrailer`) quedan protegidas automáticamente por este guard, no
   hace falta agregar nada.

2. **Póster: confirmado que la columna NO existe — hay que crearla.**
   Revisamos `src/lib/types/database.types.ts` (el tipo generado de
   `wbpp_movies`): hoy solo tiene `backdrop_url`, `poster_url` y
   `trailer_url` (YouTube) como campos relacionados. No existe ninguna
   columna para el clip de póster/hover. Acción: agregar
   `wbpp_movies.trailer_hover_asset_url` (nullable, mismo tipo/patrón
   que se usó para `trailer_asset_url` en el ticket 03), y que el panel
   la lea/escriba igual que la de hero.

   De paso, encontramos algo a corregir ya que van a tocar el schema:
   **`trailer_asset_url` tampoco aparece en `database.types.ts`** — el
   código de `src/routes/api/v1/movies/+server.ts:200` ya la usa (y por
   eso `+page.ts` del webapp la consume hoy), así que casi seguro sí
   existe en la BD real desde el ticket 03/04, pero el archivo de tipos
   generado quedó desactualizado. Al agregar la columna de póster,
   correr de nuevo el generador de tipos de Supabase para que ambas
   columnas queden reflejadas — evita que el panel nuevo se escriba
   contra tipos que no coinciden con la tabla real.

3. **Patrón a reutilizar, no inventar uno nuevo.** Ya existe
   `src/routes/api/movies/upload-image/+server.ts`: recibe `FormData`
   con `file` + `movieId` + `field`, sube a Supabase Storage
   (`webapp_assets`, ruta `movies/${movieId}/${field}.${ext}`), obtiene
   `getPublicUrl`, y hace `supabase.from('wbpp_movies').update({ [field]: publicUrl })`.
   `uploadTrailer`/`clearTrailer` deberían seguir exactamente este mismo
   patrón (adaptando la ruta del bucket a `trailers/...` y el campo a
   `trailer_asset_url`/`trailer_hover_asset_url`) en vez de escribir
   lógica de subida desde cero. Y el lugar para las nuevas `actions` ya
   está claro: `admin/webapp/+page.server.ts` (líneas ~120–402) ya
   exporta un objeto `actions` con 9 acciones existentes — agregar ahí.

Nit menor, no bloqueante: ya existe `scripts_y_pruebas/process_trailers.mjs`
(Node, multiplataforma) con casi la misma lógica que el nuevo
`reprocess_05.ps1` propuesto (PowerShell). No hace falta cambiar el
plan por esto, pero si es fácil, actualizar el `.mjs` existente con los
topes de bitrate en vez de crear un script paralelo evita tener dos
fuentes de verdad para "cómo se procesa un tráiler" — a criterio de
quien lo implemente, no es un requisito.

Con el punto 2 resuelto (columna nueva + regenerar tipos) y el punto 3
como referencia de implementación, **aprobado para arrancar** — ya no
quedan preguntas abiertas de nuestro lado.

## QA post-implementación (Claude, 2026-09-05)

Probamos en vivo: los 18 archivos responden 200 públicamente, la API
`GET /api/v1/movies` ya devuelve `trailerAssetUrl` con las URLs de
Supabase para las 9 películas, y confirmamos visualmente en
`scrapp-webapp-cinema` que el hero reproduce el clip real desde el
bucket (probado con "El Heladero"). El pipeline de la Fase 1 y Fase 3
funciona correctamente — **`laodisea.webm` (hero) ahora pesa 0.56 MB**,
el bug de bitrate quedó resuelto.

Encontramos un bug real en el panel (Fase 2), revisando
`admin/webapp/+page.server.ts`:

**`uploadTrailer`/`clearTrailer` arman la ruta del bucket por
`movie_id` (`trailers/${type}/${movieId}.${ext}`), pero la migración
masiva (Fase 3) guardó los 18 archivos por *slug*
(`trailers/hero/coyotevsacme.webm`, confirmado en `05-resultado.md`).**
Consecuencia: al presionar "Eliminar" en el panel para cualquiera de
las 9 películas ya migradas, el código intenta borrar
`trailers/hero/<uuid>.webm` — que no existe. El borrado falla (el
propio código ignora ese error a propósito) pero igual limpia la
columna en la BD: la UI muestra éxito, pero el archivo real
(`trailers/hero/<slug>.webm`) queda huérfano en el bucket para
siempre. Al revés, "reemplazar" sube un archivo nuevo con nombre de id
en vez de sobreescribir el original — duplica contenido en vez de
reemplazarlo.

**Fix recomendado (más robusto que solo alinear la convención de
nombres):** en vez de reconstruir la ruta a partir de `movie_id` +
`ext`, que `clearTrailer` (y la subida, para el reemplazo) lean primero
la URL ya guardada en `wbpp_movies.trailer_asset_url` /
`trailer_hover_asset_url`, extraigan el path real del bucket a partir
de esa URL (todo lo que sigue después de
`.../object/public/webapp_assets/`), y operen sobre esa ruta exacta.
Así funciona sin importar si el archivo fue nombrado por slug (los 9
de esta migración) o por id (cualquier asignación nueva desde el
panel de ahora en adelante) — no depende de adivinar una convención.

No bloquea la prueba de rendimiento actual (nadie ha tocado el panel
todavía, los 9 clips funcionan bien), pero si se usa "eliminar" o
"reemplazar" en el panel antes de este fix, va a generar archivos
huérfanos silenciosos en el bucket. Arreglar antes de que el equipo
empiece a usar el panel para gestión real.

Dos notas menores, no bloqueantes:
- El bucket sirve los objetos con `Cache-Control: no-cache` — cada
  vista vuelve a descargar el clip completo, lo cual infla el consumo
  de egress durante la prueba de rendimiento. Vale la pena revisar la
  configuración de caché del bucket si esto se vuelve un problema real
  con la cuota de 5 GB.
- `uploadTrailer` no valida tipo ni tamaño del archivo subido — para
  una herramienta interna no es urgente, pero un límite básico
  (extensión/tamaño máximo) evitaría subidas accidentales.
