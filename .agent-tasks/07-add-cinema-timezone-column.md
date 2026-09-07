# 07 — Agregar columna `timezone` a `cinema_locations`

## Objetivo
Que cada sede tenga su propia zona horaria (identificador IANA) en la base de datos, para dejar de asumir `America/Caracas` como una constante global válida para todo el sistema.

## Contexto
El usuario (dueño del proyecto) va a expandir el negocio a sedes fuera de Venezuela. Hoy, tanto `scrapp-webapp-cinema` como `scrapp-administrative-v2` calculan "qué día es hoy" y "ya pasó esta función" usando una constante global `APP_TIMEZONE = 'America/Caracas'`, duplicada en ambos repos — no hay ninguna noción de "la zona horaria de ESTA sede en particular". En cuanto exista una sede en otro país, todos esos cálculos quedarán desalineados con la hora real de esa sede (funciones que parecen ya pasadas cuando no lo están, o viceversa — un problema de correctitud de venta, no cosmético).

Ya se corrigió el código de ambos repos para leer una zona horaria por sede (`cinema_locations.timezone`) en vez de la constante global — con fallback seguro mientras esta columna no exista, así que nada se rompe con este ticket pendiente. Lo que falta es la columna en sí.

**Nota importante sobre `show_date`/`show_time` en `wbpp_showtimes`:** esas columnas NO se tocan en este ticket y no hace falta migrarlas. Ya guardan fecha y hora local de pared (el patrón correcto para horarios de función futuros atados a un lugar físico) — lo único que faltaba era saber A QUÉ zona horaria corresponde esa hora de pared, y eso es justamente lo que esta columna resuelve.

## Alcance

1. **Agregar la columna** a `cinema_locations`:
   ```sql
   ALTER TABLE cinema_locations ADD COLUMN timezone text;
   ```

2. **Backfill de las sedes existentes.** Verificar primero cuántas filas hay y confirmar que ambas (`candelaria`, `lido`) son de Venezuela antes de aplicar:
   ```sql
   UPDATE cinema_locations SET timezone = 'America/Caracas' WHERE timezone IS NULL;
   ```

3. **Forzar `NOT NULL` sin `DEFAULT`:**
   ```sql
   ALTER TABLE cinema_locations ALTER COLUMN timezone SET NOT NULL;
   ```
   Es intencional que NO quede un `DEFAULT`. La razón: si alguien agrega una sede nueva (probablemente en otro país, que es justo el caso que motiva este ticket) y el campo tuviera un default a `'America/Caracas'`, un olvido humano insertaría silenciosamente la zona horaria equivocada — exactamente el bug que se está corrigiendo. Sin default, un `INSERT` que no especifique `timezone` falla de inmediato con un error claro, en vez de guardar un dato incorrecto que nadie nota hasta que un cliente compra una entrada con el horario mal calculado.

4. **Regenerar la vista `cinema_locations_public`** (creada en el ticket 06) para incluir la nueva columna — no es sensible, es el mismo nivel que `city`/`latitude`/`longitude`, que ya están expuestas ahí:
   ```sql
   CREATE OR REPLACE VIEW cinema_locations_public AS
   SELECT id, name, short_name, city, address, is_active, sort_order, latitude, longitude,
          timezone,
          webapp_theme_id, webapp_allowed_tariffs, webapp_default_tariffs, webapp_kiosk_retention,
          created_at, updated_at
   FROM cinema_locations;
   ```
   (Ajustar si la definición real de la vista quedó con un orden o alcance de columnas distinto al de este ejemplo — lo importante es que el resultado final incluya `timezone` junto a las demás columnas ya expuestas, sin tocar el bloqueo de columnas sensibles que ya se resolvió en el ticket 06.)

5. **Verificar el resultado tú mismo:**
   - `SELECT id, timezone FROM cinema_locations;` → ambas filas deben mostrar `America/Caracas`.
   - Confirmar que `cinema_locations_public` (consultada con la anon key pública, igual que en el ticket 06) devuelve la columna `timezone` con el valor correcto.
   - Confirmar que un `INSERT` de prueba sin `timezone` falla (para comprobar que el `NOT NULL` sin default realmente está activo) — puedes hacerlo dentro de una transacción y hacer `ROLLBACK`, no dejar filas de prueba.

## Criterio de aceptación
- `cinema_locations.timezone` existe, es `NOT NULL`, sin `DEFAULT`, y ambas filas actuales tienen `'America/Caracas'`.
- `cinema_locations_public` expone `timezone`.
- Un intento de insertar una sede sin especificar `timezone` falla con error (verificado y revertido, no una fila de prueba dejada en la tabla).
- Reportar en `07-resultado.md`: confirmación de los tres puntos anteriores, y si la definición real de la vista difirió de la propuesta en el paso 4, cuál quedó.

## Fuera de alcance
- No editar código de `scrapp-webapp-cinema` ni de `scrapp-administrative-v2` — ya está listo del lado del código, solo falta esto en la base de datos.
- No tocar `wbpp_showtimes.show_date`/`show_time` — esas columnas ya están bien como están (ver Contexto).
- No regenerar `src/lib/database.types.ts` / `src/lib/types/database.types.ts` de `scrapp-administrative-v2` — Claude ya los parchó a mano de forma temporal (imitando el formato exacto que genera `supabase gen types`) para que el proyecto compile mientras esta migración no existía. **Si tienes forma de regenerarlos de verdad contra el esquema real después de aplicar esta migración, hazlo y avisa** — es más confiable que el parche a mano, pero no es bloqueante para este ticket.
