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

### Estado actual (2026-09-06)

**Migrado a Supabase Storage** (ver `.agent-tasks/05-migrate-trailers-to-supabase-storage.md`
y sus resultados) — ya no se sirve nada desde `static/trailers/` (esa
carpeta y el shim `localTrailers.ts` se borraron del repo). Las 9
películas confirmadas contra el catálogo real tienen
`wbpp_movies.trailer_asset_url` poblado con una URL pública del bucket
`webapp_assets`; el `laodisea.webm` que pesaba 15.8 MB quedó
reprocesado y corregido (0.56 MB).

Slugs migrados: `coyotevsacme`, `elheladero`, `laguerradelosultimos`,
`lanochedeldemonio`, `laodisea`, `mashaylosos`, `lapatrullacanina`,
`unanochealano`, `spiderman`. Pendiente: `hechizo` (nunca se confirmó a
qué película real corresponde) y `clayface`/`dunapartetres`/
`juegosdelhambre` (confirmado que no existen en el catálogo actual,
descartados).

**Gestión de aquí en adelante:** panel en `scrapp-administrative-v2` →
`/admin/webapp` → pestaña "Tráilers" — permite ver el estado de cada
película (hero/póster asignado o no), subir/reemplazar un clip ya
procesado, y limpiar uno existente. Ya no hace falta un ticket manual
por cada cambio de asignación.

**Interruptor de desarrollo:** `HERO_TRAILERS_ENABLED` en
`src/lib/config/heroTrailers.ts` apaga la carga de clips por completo
(el hero cae al banner estático siempre) sin tocar lógica — útil
mientras se itera sobre otras partes del home sin gastar la cuota de
egress del bucket en cada reload. Confirmar su valor antes de dar por
buena una prueba visual del hero.

## 2. Los 3 niveles de fallback (ya implementados)

`TrailerBackground.svelte` decide automáticamente qué mostrar en el hero de
cada película, en este orden:

**Regla de oro (restricción de distribuidoras):** el banner/clip se muestra
siempre completo, a su proporción natural — **sin overlays ni desenfoques
directamente encima de la imagen/video**. Todo control (título, "Comprar
Boletos", ícono de tráiler/sonido) vive en una franja aparte. El contenedor
del hero ya no fuerza 16:9: adapta su `aspect-ratio` a la proporción real
del archivo cargado (leída del propio navegador), así que un clip que no
sea exactamente 16:9 tampoco se recorta ni se deforma.

1. **Clip propio (`trailer_asset_url`)** — si existe, se reproduce en loop,
   silenciado, con un banner mínimo de `HERO_BANNER_MIN_MS` (4s) antes de
   pasar al video, para que el cambio sea consistente y nunca dependa de
   qué tan rápido cargó el clip. La carga es perezosa por partida doble:
   `IntersectionObserver` (el hero debe estar en pantalla) Y
   `document.hasFocus()` (la pestaña debe tener foco real) — ninguna de
   las dos requiere gesto del usuario, son automáticas. El ícono debajo
   del hero pasa a ser pausa/reanudar + volumen (si el clip trae audio,
   detectado en runtime, ver `TrailerBackground.svelte`) + un botón para
   abrir el reproductor centrado (`TrailerLightbox.svelte`): video con
   scrubber real y controles propios (no el reproductor nativo del
   navegador), con la "aura" del banner de fondo, y debajo un panel con
   título, "me gusta" (corazón), calificación por estrellas y una caja
   para escribir una opinión — estos tres últimos solo se guardan en
   `localStorage` del navegador por ahora, no hay backend ni cuentas de
   usuario reales detrás todavía (ver nota al final del documento).
2. **Enlace de YouTube (`trailer_url`)** — si no hay clip propio pero sí hay
   el tráiler oficial de YouTube (ya se obtiene automáticamente vía TMDB al
   enriquecer metadata en Xelaris), el ícono debajo del hero abre YouTube en
   pestaña nueva. Cero impacto en el diseño del hero.
3. **Búsqueda en YouTube** — si no hay ninguno de los dos datos, el mismo
   ícono arma una búsqueda por título ("{película} tráiler oficial").

Si una película no tiene `banner` (backdrop) en absoluto, simplemente no
entra en la rotación del hero — nunca se usa el póster ahí.

## 3. Especificación técnica y comandos de ffmpeg

### Formato objetivo

| | Hero (fondo del banner) | Tarjeta/póster (hover) |
|---|---|---|
| Contenedor/códec | `.webm` (VP9), sin audio | `.webm` (VP9), sin audio |
| Resolución | 854×480 (480p) — suficiente para un fondo con blur/tamaño reducido | 360×640 o la proporción del póster (2:3), bajo peso |
| Duración | 10–15 s en loop | 3–5 s en loop |
| **Peso objetivo** | **3–5 MB** (máximo aceptable ~6 MB) | **bajo 300 KB** (máximo ~500 KB) |
| Bitrate de video | ~700–900 kbps (con tope explícito, ver comando) | ~400–600 kbps |

### Comandos de ffmpeg (con tope de bitrate explícito)

Usar `-b:v` como **techo real** (no solo un valor de referencia para CRF)
es lo que evita el caso de `laodisea.webm` — VP9 con solo `-crf` puede
"gastar" mucho más bitrate del esperado en escenas con mucho movimiento.

**Hero (horizontal, fondo del banner):**
```bash
ffmpeg -i entrada.mp4 -ss 00:00:05 -t 15 \
  -vf "scale=854:-2" -an \
  -c:v libvpx-vp9 -b:v 800k -maxrate 900k -bufsize 1200k -crf 34 \
  -deadline good -cpu-used 2 \
  static/trailers/hero/<slug>.webm
```

**Tarjeta/póster (vertical, hover sobre el póster):**
```bash
ffmpeg -i entrada.mp4 -ss 00:00:05 -t 4 \
  -vf "scale=360:-2" -an \
  -c:v libvpx-vp9 -b:v 500k -maxrate 600k -bufsize 800k -crf 36 \
  -deadline good -cpu-used 2 \
  static/trailers/posters/<slug>.webm
```

- `-ss 00:00:05`: se salta los primeros 5s (evita logos/intros estáticos).
- `-an`: sin audio (se reproduce muteado de todas formas).
- `-b:v` + `-maxrate` + `-bufsize`: fijan un techo real de bitrate — esto es
  lo que faltó en el clip que salió sobredimensionado.
- `-deadline good -cpu-used 2`: balance razonable entre velocidad de
  codificación y calidad para VP9.

Para **reprocesar `laodisea.webm`** específicamente, correr el comando de
hero de arriba sobre su fuente original.

### Dónde alojar los archivos

**Actualización:** el equipo decidió migrar a Supabase Storage de todos
modos (ver `.agent-tasks/05-migrate-trailers-to-supabase-storage.md`),
a propósito y sabiendo el costo, para generar datos reales de
rendimiento de red/carga asíncrona antes de decidir el hosting
definitivo. La recomendación de fondo para producción **sigue siendo
Cloudflare R2** (sección de abajo) — Supabase Storage cobra por cada GB
servido (egress), a diferencia de R2. Mientras se decide, `HERO_TRAILERS_ENABLED`
(ver "Estado actual" arriba) permite apagar la descarga de clips sin
tocar código cuando no se esté probando activamente esto.

Opciones evaluadas para alojar esto de forma barata/gratuita mientras el proyecto crece:

1. **Cloudflare R2 (recomendado).** Almacenamiento compatible con S3: 10 GB
   gratis de almacenamiento, y lo más importante — **cero costo de salida
   (egress)**, a diferencia de casi cualquier otro proveedor (S3, GCS,
   Supabase Storage cobran por cada GB servido). Para servir video repetidas
   veces a muchos visitantes, esto es la diferencia real. Encaja bien si el
   sitio ya está o puede estar en el ecosistema de Cloudflare (Pages).
2. **Bunny.net (alternativa sólida).** CDN de video muy barato
   (~$0.01/GB de almacenamiento y ~$0.01/GB de ancho de banda, sin cuota
   gratis pero con costos mínimos), pensado específicamente para este caso
   de uso. Simple de configurar, buena opción si prefieren pago por uso
   desde el día uno en vez de gestionar límites de un tier gratuito.
3. **`static/` del propio proyecto (lo que se hizo para esta prueba).**
   Gratis y funciona ya mismo, pero con dos costos ocultos: cada clip queda
   commiteado en el repo (crece para siempre, incluso si luego se
   reemplaza), y el peso de todos los clips se descarga en cada deploy.
   Razonable para los ~13 clips de esta demo puntual; **no escalable** si
   el catálogo crece a decenas o cientos de películas.
4. **Cloudflare Stream** (mención a futuro, no ahora): pensado para
   streaming real con transcodificación adaptativa, pero es de pago desde
   el primer minuto almacenado/servido — vale la pena revisarlo cuando el
   producto ya genere ingresos, no durante la fase de demo.

**Recomendación concreta:** migrar a Cloudflare R2 cuando se quiera dejar
de commitear video al repo — el resto del pipeline (`trailer_asset_url`
apuntando a una URL pública) no cambia, solo cambia de dónde viene esa URL.

## 4. Resuelto: columna en BD, no convención de nombre

Se decidió y ya se aplicó: **`wbpp_movies.trailer_asset_url`** (columna en
Supabase, ver `.agent-tasks/03-add-trailer-asset-column.md`) es la única
fuente de verdad. El shim por convención de nombre de archivo
(`localTrailers.ts`, que emparejaba el título contra un slug de archivo
local) se eliminó del repo — sobrevive a cambios de título y ya no
depende de adivinar el nombre del archivo. Asignar/reemplazar/quitar el
clip de una película se hace desde el panel (sección "Estado actual"),
no editando código.

## 5. Mantenimiento continuo

Cada vez que entra una película nueva en preventa/estreno y se quiera que
tenga clip propio en el home:
1. Ubicar el archivo de tráiler entregado por la distribuidora.
2. Procesarlo con los comandos de ffmpeg de la sección 3 (respetando los
   topes de bitrate).
3. Subirlo al hosting definitivo (sección 3) y activarlo según el método
   vigente (sección 4).

Sin este paso manual, la web sigue funcionando normalmente (cae al nivel 2
o 3 del fallback) — no es bloqueante, es una mejora incremental.

## 6. Futuro (fuera de alcance actual)

- ~~Campo dedicado en el panel administrativo para subir el clip~~ —
  **ya implementado** (`/admin/webapp` → pestaña "Tráilers" en
  `scrapp-administrative-v2`).
- **Cloudflare Stream** u otra solución de streaming real si el volumen de
  tráfico de video lo justifica.
- **Backend real para "me gusta"/calificación/opinión.** Hoy
  (`TrailerLightbox.svelte`) esos tres datos viven en `localStorage` del
  navegador — sirven para probar la experiencia, pero no se sincronizan
  a ningún servidor ni están atados a una cuenta. Pasar esto a datos
  reales (para un futuro programa de loyalty) requiere: autenticación de
  usuarios en la webapp pública (hoy no existe) y tablas nuevas en
  Supabase. El reemplazo en el componente es acotado (mismas funciones
  de leer/guardar, cambian de `localStorage` a llamadas a una API).
- **Revisar las frases de la pantalla de "tráiler terminado."** El
  arreglo `QUOTES` en `TrailerLightbox.svelte` tiene citas textuales de
  películas de otros estudios, sin relación con el catálogo propio del
  cine — vale la pena reemplazarlas por texto propio o frases genéricas
  para evitar un uso de diálogo con derechos de otros sin licencia clara.
