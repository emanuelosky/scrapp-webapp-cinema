# Contratos de APIs

## 1. BFF (Backend For Frontend) - Scrapp Administrative v2
La webapp (y futuras apps móviles) ahora consumen exclusivamente nuestro backend propio para obtener el catálogo, evitando lecturas directas a la base de datos desde el cliente. Todas las respuestas están pre-formateadas para renderizado inmediato.

### 1.1 Cartelera Principal (`/api/v1/movies`)
- **Endpoint:** `GET [BACKEND_URL]/api/v1/movies`
- **Parámetros (Query):** `?cinema_id=X` (Para futuro soporte Multi-Sede)
- **CORS:** Habilitado para `*`
- **Respuesta (200 OK):** JSON estricto estructurado así:
  ```json
  {
    "nowPlaying": [ /* Array de objetos Movie, ordenados por PREVENTA > ESTRENO */ ],
    "comingSoonMovies": [ /* Array de objetos Movie, filtrados por Próximos Estrenos */ ],
    "activeDates": [ "2026-09-02", "2026-09-03" ] // Fechas con funciones disponibles
  }
  ```

### 1.2 Banner Promocional (`/api/v1/promos`)
- **Endpoint:** `GET [BACKEND_URL]/api/v1/promos`
- **Parámetros (Query):** `?cinema_id=X` (Para futuro soporte Multi-Sede)
- **CORS:** Habilitado para `*`
- **Respuesta (200 OK):** JSON estructurado así:
  ```json
  {
    "activePromo": {
       "id": "uuid",
       "name": "Lunes Popular",
       "message": "50% Off en entradas",
       "bg_color_class": "bg-yellow-500",
       "text_color_class": "text-black",
       "icon": "Ticket",
       "is_active": true
    } // O nulo si no hay promoción activa en este día/hora
  }
  ```

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
