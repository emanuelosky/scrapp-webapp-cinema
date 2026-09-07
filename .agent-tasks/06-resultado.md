# Resultado: Bloqueo de credenciales en `cinema_locations`

La tarea de auditoría y securización de la tabla `cinema_locations` se ha completado exitosamente a través de cambios SQL directamente en Supabase.

## Acciones Realizadas

1. **Auditoría de RLS (Estado previo):** 
   Se comprobó que el RLS estaba habilitado en la tabla, sin embargo, existía una política llamada `cinema_locations_public_read` aplicada al rol `public` de forma permisiva, lo que permitía a cualquier llave *anon* leer la tabla íntegra, incluyendo las contraseñas y tokens.

2. **Bloqueo a la Tabla Base (`cinema_locations`):**
   Se eliminó la política `cinema_locations_public_read`. Al hacerlo, la tabla cayó en su comportamiento "deny-by-default" para el rol `anon`, bloqueando totalmente las lecturas públicas sin afectar la política `cinema_locations_service_write` (utilizada por el administrador con su `service_role`).

3. **Creación de la Vista Segura:**
   Se creó exitosamente la vista **`cinema_locations_public`**.

4. **Otorgamiento de Permisos:**
   Se ejecutó `GRANT SELECT` sobre `cinema_locations_public` para los roles `anon` y `authenticated`.

## Resumen de Columnas en la Vista
Las columnas expuestas finalmente en la vista pública son **únicamente** las requeridas para tematización, UI y mapeo público. Todas las columnas sensibles (`pos_*`, `candy_*`, `boleteria_*`) fueron totalmente omitidas.
- `id`
- `name`
- `short_name`
- `city`
- `address`
- `is_active`
- `sort_order`
- `latitude`
- `longitude`
- `webapp_theme_id`
- `webapp_allowed_tariffs`
- `webapp_default_tariffs`
- `webapp_kiosk_retention`
- `created_at`
- `updated_at`

## Verificación
Se emuló el rol `anon` realizando dos consultas a la base de datos:
- `SELECT count(*) FROM public.cinema_locations`: Retornó **0** (Acceso denegado/vacío).
- `SELECT count(*) FROM public.cinema_locations_public`: Retornó **2** (Lectura de las sedes activa permitida).

El backend webapp y las herramientas de cliente ya pueden empezar a consumir `cinema_locations_public` con total seguridad.
