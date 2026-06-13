# Integración y Datos del POS de Cinexo

Este documento describe la arquitectura de datos relacionales subyacente a `scrapp-webapp-cinema`, la cual es inyectada y controlada por **Xelaris (SCRAPP Administrative v2)**. La PWA para clientes (B2C) es puramente un consumidor de estas tablas.

## 1. Mapeo de Entidades (Supabase)
La cartelera y las funciones derivan directamente de las tablas de Supabase manejadas por Xelaris:
- **`wbpp_movies`**: Contiene la información de la película. Un registro único consolida múltiples variantes de proyección.
  - La UI B2C nunca interactúa directamente con el ID del POS de la película. Su ID primario es un UUID.
  - Solo debe leer películas con `status: 'ESTRENO'`, `'PREVENTA'`, `'PLAY'` o `'PROX_ESTRENO'`.
- **`wbpp_showtimes`**: Contiene la programación (fechas, horas, salas). Cada registro incluye el `pos_show_id` (el ID puro proveniente del POS Cinexo).
  - La interfaz usará los campos `language` y `dimension` para renderizar visualmente "ESP 2D" o "SUBT 3D".
  - Solo mostrar funciones donde `is_active = true`.
- **`app_settings.wbpp_allowed_tariffs`**: Es una lista global de las tarifas del POS que están habilitadas para ser vendidas a través de la web (ej. `Adulto`, `Niño`). El frontend web NO debe mostrar opciones de compra como `Cortesia` o `Staff` aunque la API de Cinexo las ofrezca.

## 2. Flujo de Identificadores (POS ID)
Durante la compra de boletos, el usuario seleccionará asientos para una `wbpp_showtime` específica.
- Cuando la aplicación frontend inicie un checkout o interactúe con el backend (por ejemplo, para bloquear asientos y cobrar), enviará el **`pos_show_id`** real de la función hacia la API que en última instancia inserta en Cinexo.
- Nunca enviar prefijos de DataTables (ej. `"row_20335"`). El ID siempre debe estar sanitizado y ser puramente numérico (ej. `"20335"`).

## 3. Estado de Sincronización
La web asume que las tablas siempre son la "fuente de la verdad" del momento. Las cancelaciones de sala, reasignación de películas o eliminación de horarios las realiza y administra Xelaris. La web app B2C únicamente debe preocuparse por refrescar la lectura de `wbpp_showtimes` (mediante websockets o refetch periódico) para evitar permitir compras en funciones que acaban de ser marcadas como `is_active = false`.

## 4. B2C Checkout y Ghost Users Pool
Para realizar operaciones de venta temporal (como bloquear butacas) directamente contra el POS heredado:
1. El frontend web NO se comunica con el POS heredado directamente, sino que delega la orquestación a un endpoint intermedio (ej. `/api/kiosk/lock-seats`).
2. El backend B2C utiliza un **Ghost User** prestado del Pool de `pos_ghost_users` de Supabase (gestionado por Xelaris).
3. Este fantasma mantiene una cookie y un token válidos para la sesión del cliente mientras completa el pago.
4. Si el cliente abandona la página o agota el tiempo (TTL 5 mins), el backend ejecuta un `DELETE` al POS para liberar los asientos. Si este proceso falla, el fantasma entra en estado `ORPHAN` para revisión administrativa.
