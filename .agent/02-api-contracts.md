# Contratos de APIs

## 1. Cartelera y Funciones (Lectura)
Se consumirá desde la API pública de Cinexo para no saturar el POS heredado local.

- **Endpoint:** `GET https://apifront.cinexo.com.ar/mobile/consultas/peliculas/PeliculasConFuncionesYHorarios`
- **Parámetros:** `idComplejo`, `fecha`
- **Uso:** Sincronización del catálogo principal, listado de películas y sus funciones disponibles para el día.

## 2. Mapa de Butacas (Lectura Crítica)
Se consumirá desde la API local del POS, la cual es pública y no requiere sesión.

- **Endpoint:** `GET http://[IP_POS]/apicomplejo/butacas`
- **Parámetros:** `funcion` (ID de la función)
- **Uso:** Refresco en tiempo real del estado de ocupación de las butacas de una función seleccionada por el cliente.

> [!IMPORTANT]
> **Parseo de la Grilla (Algoritmo CFD):** El JSON de respuesta es un *array plano*, no una matriz 2D. Para renderizar un mapa visual correcto que respete los pasillos (espacios en blanco):
> 1. Extraer los metadatos del primer elemento del array: `filas` (int), `columnas` (int), `invertida`, `tipoColumna`.
> 2. Generar las etiquetas (`tagsColumns`) mediante la función `getTags` (letras o números, invertidos o no).
> 3. Iterar un doble bucle `for(i=1; i<=filas; i++)` y `for(j=1; j<=columnas; j++)`.
> 4. El identificador físico en la posición X,Y se construye uniendo `String(i) + "-" + tagsColumns[j] + "-" + String(i)`.
> 5. Buscar ese identificador exacto en el array de la API. Si *no* existe un match, esa posición física `[i,j]` es un espacio en blanco (pasillo). Si existe, es una butaca cuyo estado está dictado por la propiedad `libre` (1 o 0) y `seleccionada`.

## 3. Orquestación del POS (Escritura / Reserva / Facturación)
Requieren autenticación (`PHPSESSID` y `Authorization` JWT). Estas se manejarán vía el `LegacyPosClient` usando la estrategia de carrito único y multiplexación atómica.

- **Endpoint:** `DELETE http://[IP_POS]/apicomplejo/ventasTemporales` (Resetea el carrito maestro)
- **Endpoint:** `POST http://[IP_POS]/apicomplejo/ventasTemporales/detalles` (Bloquea butacas específicas)
- **Endpoint:** `POST http://[IP_POS]/apicomplejo/cerrarVenta` (Confirma y factura)

## 4. TMDB API (The Movie Database) / OMDb
Se usará como fuente secundaria de verdad para enriquecer los metadatos desde el área de administración.

- **Endpoint:** `GET https://api.themoviedb.org/3/search/movie`
- **Uso:** Búsqueda automática de la película al sincronizar con Cinexo. Extracción de `overview` (sinopsis) y `backdrop_path` / `poster_path` (imágenes alta calidad).
