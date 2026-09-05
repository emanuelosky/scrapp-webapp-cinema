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

### Estado actual (2026-09-05)

Ya existe un lote real de clips procesados en `static/trailers/` (generados
por `scripts_y_pruebas/process_trailers.mjs`, vía Antigravity — ver
`.agent-tasks/04-resultado.md`):

| Película (slug de archivo) | Hero (16:9 corto) | Póster (vertical) |
|---|---|---|
| clayface | ✅ 1.6 MB | ⚠️ vacío (0 bytes, falta reprocesar) |
| coyotevsacme | ✅ 1.5 MB | ✅ 223 KB |
| dunapartetres | ✅ 1.4 MB | ✅ 157 KB |
| hechizo | ✅ 1.2 MB | ✅ 211 KB |
| icecreamman | ✅ 1.8 MB | ✅ 166 KB |
| juegosdelhambre | ✅ 1.3 MB | ✅ 176 KB |
| laguerradelosultimos | ✅ 1.6 MB | ✅ 211 KB |
| lanochedeldemonio | ✅ 2.8 MB | ✅ 157 KB |
| **laodisea** | ⚠️ **15.8 MB** (fuera de rango, ver nota) | ✅ 437 KB (también alto) |
| mashayeloso | ✅ 1.4 MB | ✅ 153 KB |
| pawpatrol | ✅ 1.3 MB | ✅ 163 KB |
| soloporunanoche | ✅ 1.4 MB | ✅ 169 KB |
| spiderman | ✅ 1.4 MB | ✅ 146 KB |

**12 de 13 están listos para probar hoy mismo** (todo menos `clayface`, que
solo tiene el clip de hero). Verificado con `ffprobe`: son VP9 en `.webm`,
854×480, ~15s, ~24fps — coincide con la spec de Antigravity.

> **Atención — `laodisea.webm` (hero) pesa 15.8 MB, ~11× más que el resto**
> con la misma resolución y duración (854×480, 15s). `ffprobe` muestra un
> bitrate de ~8.4 Mbps contra ~750 kbps del resto — probablemente el
> encoder eligió una calidad más alta para una escena con mucho movimiento
> y no había un tope de bitrate explícito. Hay que reprocesar este archivo
> específico con el comando de la sección 3 (que sí fija un bitrate máximo)
> antes de usarlo en producción — a este peso anula por completo el
> beneficio de la carga perezosa.

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
   silenciado. El ícono debajo del hero pasa a ser un toggle de sonido en
   vez de un enlace. Se carga de forma perezosa (`IntersectionObserver`):
   nunca descarga el video hasta que el hero entra en pantalla.
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

### Dónde alojar los archivos (no Supabase, por ahora)

Se descartó Supabase Storage a propósito para esta fase — el plan gratuito
no da margen de ancho de banda para servir video con el tráfico de una
demo, y sacarlo del alcance actual era la prioridad. Opciones evaluadas
para alojar esto de forma barata/gratuita mientras el proyecto crece:

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

## 4. Pendiente de decidir: convención de nombre de archivo vs. columna en BD

Hay dos formas de que el frontend sepa qué clip usar para cada película, y
hoy conviven sin haberse resuelto cuál es la definitiva:

- **Convención por nombre** (lo que ya implementó Antigravity): el archivo
  se llama como el título en minúsculas sin espacios/acentos
  (`coyotevsacme.webm`) y el frontend arma la ruta al vuelo. Cero trabajo
  de base de datos, pero se rompe si el título cambia, y no distingue
  películas con el mismo título simplificado.
- **Columna en Supabase** (`wbpp_movies.trailer_asset_url`, el diseño
  original de `.agent-tasks/03-add-trailer-asset-column.md`): más robusto
  y sobrevive cambios de título, pero requiere un paso manual (o futuro
  campo en el panel) para pegar la URL por película.

Para probar los 12 clips que ya existen, la convención por nombre alcanza
sin trabajo adicional. La columna en BD sigue siendo la recomendación para
cuando esto deje de ser una prueba y el catálogo crezca.

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

- **Campo dedicado en el panel administrativo** para subir el clip
  directamente desde Xelaris en vez de pegar la URL a mano.
- **Cloudflare Stream** u otra solución de streaming real si el volumen de
  tráfico de video lo justifica.
