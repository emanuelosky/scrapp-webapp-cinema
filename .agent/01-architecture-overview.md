# Visión Arquitectónica B2C

El proyecto B2C Cinema Webapp proporciona una interfaz moderna y eficiente para que los clientes finales consulten la cartelera, vean información de películas, seleccionen asientos y compren entradas.

## Desafíos y Estrategia

El principal desafío es la escalabilidad y las limitaciones del Punto de Venta (POS) heredado, el cual:
- No soporta concurrencia masiva en la reserva de butacas.
- Las reservas temporales (`ventaTemporal`) están atadas a una sesión única por usuario en el POS.

### 1. APIs Públicas y de Lectura
Para evitar la saturación del sistema, el **80% del tráfico (lecturas)** no pasará por la orquestación del POS Legacy:
- **Cartelera y Funciones:** Se consumen desde la API pública de Cinexo (`apifront.cinexo.com.ar`).
- **Disponibilidad de Butacas:** Se consumen desde el endpoint local del POS (`GET /apicomplejo/butacas`), el cual comprobamos que **no requiere autenticación**.
- **Metadatos y CMS:** Se consumen desde un área administrativa propia apoyada por la API de TMDB (The Movie Database) para gestionar sinopsis y banners en alta calidad.

### 2. Estrategia del "Single Cart" (Carrito Único)
En lugar de crear un "cajero virtual" o "facturero" por cada cliente B2C (lo que requeriría un pool de sesiones complejo y costoso en recursos), implementaremos el modelo del **Carrito Único Escalable**:

- Existe **un único usuario dedicado** en el POS heredado para todas las transacciones web.
- Todas las selecciones de butacas de los usuarios web (que aún no han pagado) se agrupan temporalmente en la `ventaTemporal` de ese usuario único.
- El BFF B2C (Backend-for-Frontend) mantiene un registro de qué usuario B2C bloqueó qué butacas (Redis o Postgres) con un TTL (ej. 5 minutos).

### 3. Área Administrativa (CMS)
El sistema contará con un módulo administrativo para que el equipo del cine mejore la presentación del catálogo (banners en alta resolución y sinopsis extendidas/editadas).
- La cartelera se sincroniza con Cinexo.
- Se enriquece la data consultando TMDB mediante el título original o código.
- Los editores pueden modificar estos textos antes de que sean visibles en el frontend B2C.

### 4. Desacoplamiento Estricto (Edge Hosting)
Para garantizar máxima seguridad y ahorro de costos:
- **El Frontend B2C (SvelteKit):** Se alojará en un proveedor Edge/Estático como Vercel o Cloudflare Pages.
- **Sin acceso a Base de Datos:** El frontend NO tendrá credenciales de Supabase ni accesos directos a la BD. 
- **Comunicación REST:** Toda operación del usuario final pasará a través de la API expuesta por `scrapp-administrative-v2` (BFF/Admin layer), el cual validará peticiones, manejará la orquestación Mutex y se conectará al POS o a Supabase de forma segura.

## 6. Auto-Failover y Enrutamiento Backend
* Todas las comunicaciones hacia las APIs legacy (Boletera, Candy) operan detrs de una capa de Auto-Failover en scrapp-administrative-v2.
* No debe haber APIs configuradas quemadas en el frontend de cinema; el BFF asume la responsabilidad del balanceo y la salud de la red.
* El BFF administra la conmutacin automtica (Latencia, Pings en background) y reintenta antes de propagar errores 5xx al cliente webapp.
