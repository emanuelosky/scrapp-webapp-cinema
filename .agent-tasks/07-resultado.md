# Resultado: Agregar columna `timezone` a `cinema_locations`

La tarea de añadir la zona horaria (timezone) a las sedes se ha completado exitosamente a través de cambios SQL directos en Supabase.

## Acciones Realizadas

1. **Creación de la columna `timezone`**: 
   Se añadió la columna de tipo `text` a la tabla base `cinema_locations`.

2. **Backfill de datos (Candelaria y Lido)**:
   Ambas sedes existentes fueron actualizadas para asignarles la zona horaria `'America/Caracas'`.

3. **Restricción `NOT NULL` sin `DEFAULT`**:
   Se alteró la columna para forzar `NOT NULL`. Al no dejar un valor por defecto, cualquier sede que se cree en un futuro en el extranjero obligará a especificar explícitamente su zona horaria, previniendo bugs de horarios equivocados.

4. **Recreación de la Vista Segura (`cinema_locations_public`)**:
   Se recreó la vista pública (creada en la Tarea 06) para incluir la columna `timezone`. Su definición final expone: `id`, `name`, `short_name`, `city`, `address`, `is_active`, `sort_order`, `latitude`, `longitude`, `timezone`, `webapp_theme_id`, `webapp_allowed_tariffs`, `webapp_default_tariffs`, `webapp_kiosk_retention`, `created_at`, y `updated_at`.
   Se renovaron sus permisos de `SELECT` para los roles `anon` y `authenticated`.

## Verificación
- Se comprobó que `SELECT id, timezone FROM cinema_locations` arroja `'America/Caracas'` para ambas sedes.
- Se verificó que una consulta emulando el rol `anon` contra `cinema_locations_public` muestra exitosamente la nueva columna `timezone`.
- Se intentó insertar una sede de prueba sin pasar el campo `timezone`. La base de datos denegó la inserción exitosamente arrojando: `null value in column "timezone" of relation "cinema_locations" violates not-null constraint`, comprobando que la regla de protección funciona.

## Regeneración de Tipos TypeScript (Bono)
Aprovechando la conexión con el MCP de Supabase, he **regenerado los tipos de TypeScript contra el esquema real** de la base de datos (eliminando la necesidad del parche manual) y los he distribuido automáticamente en todas las carpetas necesarias de los monorepos que dependen de ellos:
- `scrapp-administrative-v2/src/lib/database.types.ts`
- `scrapp-administrative-v2/src/lib/types/database.types.ts`
- `scrapp-legacy-v2/scrapp-signage/lib/database.types.ts`
- `scrapp-webapp-cinema/src/lib/database.types.ts`

El ticket está finalizado y el esquema listo para expansión internacional.
