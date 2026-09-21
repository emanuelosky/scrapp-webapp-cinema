# Auditoría de `wbpp_movies` y buckets · 2026-09-18

Motivo: tras reiniciar la tabla de películas se sospecha desincronización general.
Solo lectura, no se modificó nada.

## 1. Veredicto corto

La tabla **no está rota**. Las relaciones sobrevivieron al reinicio. Lo que sí quedó
descolgado son los **archivos del bucket**: los tráilers están subidos pero ninguna
fila los referencia, y casi todos los pósters guardados apuntan a UUID que ya no
existen.

## 2. Lo que está sano

| Comprobación | Resultado |
|---|---|
| Películas | 35 (16 `active`, 19 `draft`) |
| Funciones | 228, del 2026-09-10 al 2026-09-24 |
| Funciones huérfanas (sin película) | **0** |
| Tabla `wbpp_orphan_showtimes` | **0** filas |
| Madres con variantes agrupadas | 7 |
| Hijas declaradas en `grouped_ids` que ya no existen | **0** |

El agrupamiento funciona. El POS emite una entrada por formato, `A CUALQUIER PRECIO (ESP)`
y `A CUALQUIER PRECIO (SUB)`, y la webapp las cuelga de una madre vía `grouped_ids`.
El endpoint `api/v1/movies` (línea 118) filtra `!childToMother.has(m.id) && m.status === 'active'`,
o sea que **oculta las hijas y sube sus funciones a la madre**.

Por eso `A CUALQUIER PRECIO` aparece con 0 funciones propias y sus dos hijas tienen 19:
eso es el diseño, no un fallo. Lo mismo con las otras cinco madres.

## 3. Lo que sí está descolgado

### 3.1 Tráilers: los archivos están, nadie los referencia

18 archivos en `webapp_assets/trailers/`, **6,85 MB**, subidos todos el 2026-09-05 en
un lote de 8 segundos: 9 en `hero/` y los mismos 9 en `poster/`.

**Y `trailer_asset_url` y `trailer_hover_asset_url` están en NULL en las 35 películas.**

La causa es el nombre. Los archivos usan slug (`trailers/hero/coyotevsacme.webm`),
pero el panel de administración escribe con UUID:

```
scrapp-administrative-v2/src/routes/(app)/admin/webapp/+page.server.ts:430
const path = `trailers/${type}/${movieId}.${ext}`;
```

Como no coinciden, el panel no los ve ni los puede reemplazar o borrar. Se subieron
por fuera del panel.

Mapeo de los 9 slugs contra el catálogo actual:

| Slug | Película |
|---|---|
| coyotevsacme | COYOTE VS ACME |
| laguerradelosultimos | LA GUERRA DE LOS ULTIMOS |
| lanochedeldemonio | LA NOCHE DEL DEMONIO |
| laodisea | LA ODISEA |
| lapatrullacanina | LA PATRULLA CANINA |
| mashaylosos | MASHA Y LOS OSOS |
| spiderman | SPIDERMAN: UN NUEVO DIA |
| elheladero | ya no está en cartelera |
| unanochealano | ya no está en cartelera |

### 3.2 La función de tráiler del hero está apagada a propósito

`scrapp-webapp-cinema/src/lib/config/heroTrailers.ts`:

```ts
export const HERO_TRAILERS_ENABLED = false;
```

El comentario dice que es para ahorrar cuota de egress mientras se trabaja en otras
partes del home. **Aunque se arreglen los enlaces, no se reproduce nada hasta que
ese interruptor vuelva a `true`.**

### 3.3 Pósters: 7 de 8 archivos quedaron huérfanos (daño real del reinicio)

Los pósters del bucket viven en `movies/{uuid}/poster_url.jpg`. De los 7 UUID
distintos, **6 ya no existen** en la tabla. Solo sobrevive `858545f1-…`, que es
MASHA Y LOS OSOS, la única fila cuyo `poster_url` apunta al bucket.

Las otras 15 activas toman el póster directo de `image.tmdb.org`, así que se ven
bien, pero los archivos subidos a mano se perdieron de vista.

### 3.4 `tmdb_id` está vacío en las 35 películas

La columna tiene índice `UNIQUE` y es la llave externa estable para volver a casar
con TMDB. Está en NULL en todas, aun cuando los pósters vienen de TMDB. Sin ella,
cualquier re-sincronización tiene que ir por título, que es justo lo frágil.

### 3.5 Tres activas tienen el tráiler en blanco

22 de 35 no tienen tráiler de YouTube utilizable. Tres de ellas son activas y
guardan **un espacio en blanco** en vez de NULL: MASHA Y LOS OSOS, OASIS y TURBA.
Pasa cualquier chequeo de "no nulo" pero no es una URL.

## 4. Qué haría, en orden

1. **Enlazar los 7 tráilers que sí corresponden.** Las columnas guardan la URL
   pública completa, así que basta un UPDATE con la URL del archivo por slug. No hace
   falta renombrar nada y el panel sigue pudiendo reemplazarlos después, porque su
   lógica de borrado parsea la URL.
2. **Decidir sobre el interruptor del hero.** Enlazar sin encender no cambia nada
   visible.
3. **Rellenar `tmdb_id`** en las 16 activas, para que la próxima re-sincronización no
   dependa del título.
4. **Limpiar los 6 pósters huérfanos** del bucket, o volver a subirlos por el panel
   si se quieren esas versiones concretas.
5. **Normalizar los tres tráilers en blanco** a NULL.

Ninguna aplicada: esto es auditoría.

---

## 5. Enlace aplicado · 2026-09-18

Verificado primero que la cartelera viene del servidor correcto:

| Sede | URL base del POS | Veredicto |
|---|---|---|
| candelaria | `http://38.121.221.44` | PRODUCCION |
| lido | `http://190.216.241.86:32080` | PRODUCCION |

Ninguna apunta al servidor de pruebas `190.216.241.26:33080`.

Prueba en seco antes de escribir: cada slug dio **exactamente una** coincidencia y
todas en estado `active`, así que no hubo ambigüedad ni riesgo de enlazar a una hija.

Enlazadas 7 películas, `trailer_asset_url` y `trailer_hover_asset_url`:

| Película | Slug |
|---|---|
| COYOTE VS ACME | coyotevsacme |
| LA GUERRA DE LOS ULTIMOS | laguerradelosultimos |
| LA NOCHE DEL DEMONIO: ESTÁN ENTRE NOSOTROS | lanochedeldemonio |
| LA ODISEA | laodisea |
| LA PATRULLA CANINA: LA DINO PELÍCULA | lapatrullacanina |
| MASHA Y LOS OSOS | mashaylosos |
| SPIDERMAN: UN NUEVO DIA | spiderman |

Las 14 URL comprobadas una a una: **HTTP 200, `video/webm`, con bytes reales**
(de 22 kB el más pequeño a 1,12 MB el mayor).

Estado: 7 de 16 activas con clip en ambos formatos.

### Sin enlazar, pendientes de decisión

Búsqueda a fondo en los 35 títulos: ninguno se parece. No están en el catálogo.

| Archivos | Tamaño | Subidos |
|---|---|---|
| `trailers/hero/elheladero.webm` + `trailers/poster/elheladero.webm` | 0,77 MB | 2026-09-05 |
| `trailers/hero/unanochealano.webm` + `trailers/poster/unanochealano.webm` | 0,63 MB | 2026-09-05 |

### Recordatorio

Sigue en pie `HERO_TRAILERS_ENABLED = false` en
`src/lib/config/heroTrailers.ts`. **El enlace ya está hecho, pero el hero no
reproducirá ningún clip hasta que ese interruptor pase a `true`.**

## 6. Cierre · 2026-09-18

**`unanochealano` resuelto.** El usuario confirmó que ese clip es de **SÓLO POR UNA
NOCHE**; el nombre del archivo no coincidía con el título. Enlazado, y sus dos URL
comprobadas: HTTP 200, `video/webm`, 592.277 y 68.678 bytes.

**`elheladero` eliminado.** El usuario confirmó que la película ya salió de cartelera.
Antes de borrar se verificó que **ninguna fila** de `wbpp_movies` lo referenciaba en
ningún campo de arte. Los dos archivos se descargaron a
`SCRAPP-ENTERPRISE/_backups/trailers_elheladero/` (741.925 y 67.306 bytes) y después se
borraron del bucket por la API de Storage, que respondió `Successfully deleted` en ambos.

**Estado final del bucket de tráilers:**

| Métrica | Valor |
|---|---|
| Archivos en `trailers/` | 16 (8 hero + 8 póster) |
| Archivos huérfanos | **0** |
| Películas con clip en ambos formatos | 8 de 16 activas |

Correspondencia 1 a 1: cada archivo del bucket tiene su película y cada película
enlazada tiene sus dos archivos.

**El interruptor del hero ya lo activó el usuario**, así que los clips deberían
reproducirse en cuanto la webapp esté desplegada con ese cambio.

### Lo que sigue pendiente de la §4

- 6 pósters huérfanos en `movies/{uuid-viejo}/` (daño del reinicio).
- `tmdb_id` en NULL en las 35 películas.
- Tres activas con un espacio en blanco en `trailer_url` en vez de NULL:
  MASHA Y LOS OSOS, OASIS y TURBA.

## 7. `tmdb_id` y tráilers en blanco resueltos · 2026-09-18

### Tráilers en blanco

Tres activas guardaban un espacio en vez de NULL. Normalizadas: MASHA Y LOS OSOS,
TURBA y OASIS: DONT LOOK BACK IN ANGER. Quedan 13 de 16 activas con tráiler de
YouTube real, que ahora sí se puede detectar con un simple `is not null`.

### `tmdb_id`: 16 de 16, sin adivinar

**Método.** El `poster_url` de casi todas apunta a `image.tmdb.org/t/p/w500/{ruta}`, y
esa ruta es un identificador de asset de TMDB. Así que en vez de casar por título, que
es lo frágil, se buscó cada película en TMDB y se aceptó **solo el resultado cuyo
`poster_path` fuera idéntico al que ya teníamos guardado**. Si el póster coincide, es
por definición el mismo registro del que salió.

| Confirmación | Películas |
|---|---|
| Póster idéntico (prueba definitiva) | 14 |
| Resultado único de búsqueda | 2 |

Las dos por resultado único se verificaron a mano:

- **OASIS: DONT LOOK BACK IN ANGER** → 1447853. Título prácticamente idéntico, único
  resultado, estreno 2026-09-09.
- **MASHA Y LOS OSOS** → 1448028. Es la única activa cuyo póster vive en el bucket y no
  en TMDB, así que no había con qué contrastar. Verificada por contenido: la sinopsis
  guardada (el hermano bajo hechizo convertido en cabra, los tres osos) coincide con esa
  película rusa de 2025, cuyo **título original `Маша и Медведи` es literalmente
  "Masha y los osos", en plural**. Duración 80 frente a 79 de TMDB. El título en español
  de TMDB, "Masha y el oso", es el que despista.

Sin colisiones: 16 identificadores distintos para 16 películas, y la columna tiene
índice `UNIQUE`.

**Nota de entorno.** Node fallaba con `fetch failed` mientras `curl` funcionaba sin
problema. Causa: con la VPN activa el DNS devuelve una dirección IPv6 cuyo camino está
roto, y Node la prueba primero. Se resolvió ejecutando con
`node --dns-result-order=ipv4first`.

### Estado final

| | Activas (16) | Borradores (19) |
|---|---|---|
| Con `tmdb_id` | 16 | 0 |
| Tráiler en blanco | 0 | 0 |
| Con tráiler de YouTube | 13 | 0 |
| Con clip en el bucket | 8 | 0 |

Los borradores no llevan `tmdb_id` a propósito: **16 de los 19 son hijas** de una
película madre y el endpoint las oculta, así que no necesitan ficha propia.

Los 3 borradores restantes no cuelgan de ninguna madre y quedan para revisión manual:

| Título | Creada | Funciones |
|---|---|---|
| AVENGERS: END GAME BONUS | 2026-09-17 | 0 |
| F1 GRAN PREMIO ESPAÑA | 2026-09-14 | 1 |
| PUERTEÑOS (ESP) | 2026-09-17 | 6 |

`PUERTEÑOS (ESP)` tiene 6 funciones y no se muestra en la webapp por seguir en
borrador y no tener madre. Es el único de los tres con impacto real en cartelera.
