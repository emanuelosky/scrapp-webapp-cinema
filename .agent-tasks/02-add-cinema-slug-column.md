# 02 — Agregar columna `slug` a `cinema_locations` (desacoplar URL pública del id interno)

## Objetivo
Permitir que la URL pública de una sede (ej. `/cines/sambil-candelaria`) sea
distinta del `id` interno usado por el pipeline de sincronización
(`cinema_locations.id = 'candelaria'`), sin tocar ese `id` ni romper las
referencias existentes.

## Contexto
`scrapp-webapp-cinema` usa rutas `/cines/[sede]`. Hoy el segmento `sede` se
manda tal cual como `location_id` a `scrapp-administrative-v2`
(`GET /api/v1/movies?location_id=<sede>`), y ese endpoint filtra
`wbpp_showtimes` con `.eq('location_id', locationId)`.

En el esquema de Supabase, `wbpp_showtimes.location_id` es **foreign key
hacia `cinema_locations.id`**, y la fila de la sede de Candelaria tiene
literalmente `id = 'candelaria'` (no es un UUID generado, es un string
elegido a mano). Cambiar ese `id` directamente a `'sambil-candelaria'`
arriesga romper cualquier fila que lo referencie por FK (confirmado:
`wbpp_showtimes`; posiblemente más — ver Alcance).

Queremos renombrar la URL pública a `/cines/sambil-candelaria` (más precisa
y correcta que solo "candelaria") sin migrar el `id` interno.

## Alcance
1. Agregar columna `slug` (tipo `text`, `unique`, nullable por ahora) a
   `cinema_locations`.
2. Backfill:
   - Fila con `id = 'candelaria'` → `slug = 'sambil-candelaria'`.
   - Fila con `id = 'lido'` (o el id real de Centro Lido, confirmar nombre
     exacto) → `slug = 'lido'` (o el valor equivalente que decidan, para
     mantener consistencia — puede quedar igual al id si ya es correcto).
3. Buscar en todo el proyecto Supabase (`scrapp-database`) cualquier otra
   tabla o función RPC que referencie `cinema_locations.id` por foreign key
   o por valor hardcodeado de texto (`'candelaria'`), para confirmar que
   nada más se ve afectado por dejar el `id` intacto. Reportar qué se
   encontró (aunque la respuesta sea "nada más lo referencia").
4. No modificar `wbpp_showtimes.location_id` ni ningún otro `id` existente.

## Criterio de aceptación
- La tabla `cinema_locations` tiene la columna `slug` poblada para ambas
  sedes activas.
- Confirmación explícita (en este archivo o en `02-resultado.md`) de que
  ningún otro objeto en la base de datos depende del `id` actual de forma
  que un cambio futuro lo rompería, o listado de lo que sí depende.
- El `id` de ambas sedes permanece sin cambios.

## Fuera de alcance
- No tocar código de `scrapp-webapp-cinema` ni `scrapp-administrative-v2`
  (el endpoint `/api/v1/movies` lo actualiza Claude una vez exista la
  columna).
- No hacer `slug` obligatorio (`NOT NULL`) todavía — primero confirmar que
  el backfill quedó correcto.
