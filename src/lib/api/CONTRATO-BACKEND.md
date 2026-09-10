# Qué necesita la webapp de su backend

Este documento describe lo que la webapp pide para funcionar, **sin asumir qué
sistema lo va a servir**. Sirve para dos cosas: evaluar un candidato (Vista, un
conector al sistema legacy, o el intermediario actual llevado a producción), y
saber qué se degrada si un candidato no cubre algo.

La implementación vive en [`index.ts`](./index.ts), que es el único archivo de
la webapp que habla con el backend. Adaptarse a un sistema distinto es
reescribir ese archivo.

## Reglas generales

- **Todo endpoint puede fallar sin tumbar la página.** La capa de datos ya
  devuelve un valor vacío ante cualquier error, y la interfaz muestra su estado
  de "no hay nada". Un backend que devuelva 500 hace que la cartelera se vea
  vacía, no que la web se rompa.
- **Nada de credenciales del lado del cliente.** La webapp es estática y su
  código es público: cualquier clave que reciba es una clave filtrada.
- **CORS.** La webapp se sirve desde un dominio distinto al del backend, así
  que todos estos endpoints necesitan `Access-Control-Allow-Origin` con el
  dominio de la webapp.
- **Zona horaria.** Los horarios se comparan contra la hora de PARED de la
  sede, no la del visitante. Ver `timezone` más abajo: no es opcional.

## Lo que se consume hoy

### Sedes
Sedes activas, con su zona horaria.

Campos por sede: `id`, `name`, `short_name`, `city`, `is_active`, y
**`timezone`** (identificador IANA, p. ej. `America/Caracas`). `latitude` y
`longitude` son opcionales hoy, pero forman parte de la firma con la que la
webapp detecta que su catálogo local quedó viejo.

`timezone` **es obligatorio**: decide qué funciones son "hoy" y "mañana" en
toda la cartelera. Sin él, una sede en otro huso mostraría la cartelera
equivocada.

### Cartelera por sede
Dado un identificador de sede, devuelve tres cosas: las películas en cartelera,
las próximas, y las fechas que tienen funciones.

Por película: `id`, `title`, `poster`, y opcionalmente `banner`, `synopsis`,
`duration`, `rating`, `genres`, `label` (ESTRENO / PREVENTA / EVENTO),
`trailerAssetUrl` (clip propio) o `trailerYoutubeUrl`.

Las funciones vienen agrupadas por fecha, y cada una trae `id` (el que se usa
para reservar), `time` (ya formateada para mostrar), `format` (p. ej. "SUBT
3D") y `rawTime` (`HH:MM:SS`, para poder ocultar las que ya pasaron).

### Promoción vigente
Por sede. Devuelve el aviso a mostrar arriba, o nada. Es opcional: sin
promociones la webapp simplemente no muestra la franja.

### Compra
Cuatro piezas: el mapa de butacas de una función, sus tarifas, la reserva
temporal de asientos (crear, extender, liberar), y el cierre de compra.

Esta es la parte que **más cambia según el backend**. El modelo actual es el de
la taquilla: un mapa de butacas más una lista de tarifas. Vista modela lo mismo
como una orden con artículos que se agregan y se pagan. No es traducible campo
a campo: si se adopta Vista, esta sección se reescribe, no se adapta.

### Chat EPIK
Un endpoint de conversación compatible con streaming. Es prescindible: si no
existe, se quita el widget y el resto de la webapp funciona igual.

## Imágenes: el requisito y su degradación

**Este es el punto que hay que negociar con cualquier candidato.**

Lo ideal es que el backend entregue **tres tamaños** de cada póster y cada
banner, ya comprimidos en WebP:

| Tamaño | Ancho aprox. | Para qué |
|---|---|---|
| `thumb` | ~160 px | Relleno desenfocado mientras baja la grande, y fondos decorativos |
| `card` | ~400 px | Tarjetas y carruseles |
| `full` | 780 px (póster) / 1920 px (banner) | La imagen buena |

En el tipo `Movie` eso viaja como `posterSizes` y `bannerSizes`
(ver `$lib/types`). **Solo `full` es obligatorio.**

### Por qué tres y no uno

Los banners a resolución completa pesan varios MB. Sin miniatura pasan dos
cosas: el visitante mira un hueco hasta que baja la imagen entera, y los fondos
que se pintan borrosos a propósito (`blur-2xl` y similares) descargan megabytes
para después desenfocarlos, que es desperdicio puro.

### Qué pasa si el backend da una sola imagen

Funciona igual, con menos gracia. `$lib/utils/images` resuelve tres escenarios
sin que ningún componente sepa cuál está activo:

1. **El backend da los tamaños.** Se usan tal cual. Es lo que se pide.
2. **La URL es de TMDB.** Situación de hoy, transitoria: TMDB sirve la misma
   imagen en varios tamaños cambiando un segmento de la ruta, así que se
   derivan. Cuando las imágenes se muden al almacenamiento propio, esta rama
   deja de aplicar sola.
3. **Una sola URL de origen desconocido.** Es lo que hay que asumir de Vista:
   una imagen, en el formato y la calidad que ellos decidan. Se muestra esa. Se
   pierde el destape progresivo y los fondos decorativos bajan la imagen
   completa; no se pierde ninguna funcionalidad.

### Dónde debe generarse

**En el backend, no en la webapp.** La webapp es estática y no puede procesar
imágenes de otros. El procesamiento pertenece a quien administra el catálogo:
cuando el equipo de proyección sube un póster, o cuando se rellenan datos desde
un proveedor de metadatos, ahí es donde se generan los tres tamaños y se
guardan en el almacenamiento propio.

Nota para quien lo implemente: no hace falta una librería de imágenes en el
servidor. El navegador del administrador puede generar los tres tamaños y
convertirlos a WebP con `createImageBitmap` (con `resizeQuality: 'high'`) más
`canvas.toBlob('image/webp')`, y subir los tres. Eso ahorra CPU del servidor y
sube tres archivos pequeños en vez de un original de varios MB. Está
verificado que TMDB responde con `Access-Control-Allow-Origin: *`, así que el
mismo camino sirve para una imagen subida a mano y para una traída de TMDB.

## Confitería: combos, menú y promociones

Esta sección **todavía no existe del lado del backend**. La webapp ya la
consume a través de `fetchCombos`, `fetchMenu`, `fetchArmador` y
`fetchPromociones`, pero hoy esas funciones devuelven una maqueta local
(`$lib/data/*.mock.ts`). Lo que sigue es lo que hace falta para reemplazarla.

### Por qué no alcanza con lo que ya hay

El catálogo comercial vive en el POS heredado. El intermediario lo cachea como
JSON crudo en `legacy_catalog_cache` y lo expone en
`/api/legacy-pos/catalog?type=combos`. Eso sirve para operar la taquilla, pero
no para una vitrina pública, por tres razones:

1. **No tiene imágenes.** No hay campo de imagen para productos ni combos en
   ninguna tabla, vista ni pantalla de administración. La única subida de
   imágenes que existe es la de películas. Hoy nadie es dueño de la foto de un
   combo.
2. **No tiene precio por sede.** `legacy_catalog_cache` es una fila global sin
   `location_id`. El único precio que sí varía por sede es el de boletos.
3. **No tiene texto comercial.** El POS guarda la receta interna (qué insumos
   descuenta un combo), no cómo se le cuenta al visitante. "1 cotufa grande, 2
   refrescos medianos, ración de nuggets" es texto de mercadeo, y no siempre
   coincide con la receta.

Es decir: hace falta una capa propia, no un proxy del POS.

### Lo que la webapp necesita

**Combos.** Por sede. Cada combo: `id`, `slug`, `name` (solo el apellido:
"Acción", no "COMBO ACCIÓN" — el rótulo lo pone la interfaz), `items` (líneas
de texto, en orden), `price`, `addons` (opcional), `image` y `featured`.

**Menú.** Por sede, agrupado en categorías. Cada categoría: `id`, `name`,
`tagline` opcional y sus productos. Cada producto: `id`, `name`,
`description` opcional, `price`, y `sizes` opcional cuando se vende en varios
tamaños.

**Armador.** Los pasos para componer un combo a medida: `id`, `title`, `hint`,
`required` y sus opciones (`id`, `name`, `price`). El orden importa y lo define
el backend, no la webapp.

**Promociones y coleccionables.** Una sola lista con un campo `kind` que
distingue entre los dos. Cada uno: `title`, `description`, `price` opcional,
`terms` opcional e `image` opcional.

### Imágenes

Vale lo mismo que para pósters y banners (ver la sección de imágenes más
arriba): idealmente tres tamaños en WebP, y **solo `full` es obligatorio**.
`$lib/utils/images` degrada solo si vienen menos.

El caso de los combos tiene un detalle propio que conviene no repetir. El arte
que entrega mercadeo son banners 1920x1080 de señalética, con el nombre, el
contenido y el precio **quemados en el JPEG**. Para la web ese texto es un
estorbo: congela el precio en píxeles, no se puede leer por un lector de
pantalla ni buscar, y un 16:9 con el texto al costado no entra en una tarjeta
vertical de móvil. Por eso `scripts/procesar-combos.py` recorta la foto y
descarta el texto, y el texto vuelve como datos.

**Lo ideal es que el backend reciba la foto ya limpia**, sin texto encima, y
que el nombre y el precio viajen como campos. Si el catálogo lo entrega un
sistema que solo da el arte compuesto, la webapp lo va a mostrar igual, pero se
pierde el móvil y la posibilidad de corregir una errata sin volver a diseño.

### Precio

El precio se muestra como lo escribe la señalética: `REF 18⁹⁹`, referencia en
dólares. La webapp **no convierte a bolívares** y no debería empezar a hacerlo
hasta resolver una contradicción que ya existe en el código: la tasa está
duplicada como `EXCHANGE_RATE = 40.50` en `cines/[sede]/concessions/[id]` y en
`cines/[sede]/checkout/[id]`, pero el payload de pago de ese mismo checkout usa
`582.68`. Si el backend va a mandar la tasa, que la mande una sola vez y que
sea la única.

## Lo que la webapp NO debe hacer

- **No hablar con la base de datos directamente.** Se hacía (el catálogo de
  sedes se consultaba contra Supabase con la clave anónima) y se quitó: ataba
  la webapp a una base concreta y metía su cliente en el paquete.
- **No pedirle imágenes a un tercero.** Hoy los pósters vienen de la red de
  TMDB directo al navegador. Es transitorio: deben vivir en el almacenamiento
  del cliente, tanto por control de tamaños como por no depender de la
  disponibilidad y los términos de uso de un servicio ajeno.
- **No construir URLs de API fuera de `index.ts`.** Es la razón de existir de
  esta capa.
