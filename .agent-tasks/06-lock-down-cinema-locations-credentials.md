# 06 — Bloquear acceso público a credenciales en `cinema_locations`

## Objetivo
Impedir que la anon key de Supabase (embebida a propósito en el bundle público del webapp) pueda leer las columnas de credenciales de `cinema_locations`, sin afectar el acceso que ya tiene el BFF (`scrapp-administrative-v2`, que usa `SUPABASE_SERVICE_ROLE_KEY` y por tanto ignora RLS).

## Contexto
Auditando `cinema_locations` con la anon key pública (la misma que usa `scrapp-webapp-cinema/src/lib/supabase.ts` del lado del cliente) se confirmó que devuelve, sin ninguna restricción, estas columnas pobladas para las dos sedes activas: `pos_password`, `pos_token`, `pos_username`, `boleteria_password`, `boleteria_username`, `boleteria_cookie`, `candy_password`, `candy_username`, `candy_cookie`.

Cualquiera que abra las herramientas de desarrollador en el webapp, copie la anon key pública y haga una consulta directa a la API REST de Supabase obtiene esas credenciales en texto plano — no hace falta ningún exploit, es una consulta HTTP normal contra `cinema_locations`.

El usuario (dueño del proyecto) confirmó que estas credenciales concretas son de un servidor legacy de pruebas y que hoy solo él tiene acceso al webapp (estamos en desarrollo, sin usuarios reales todavía), así que el riesgo inmediato es bajo. Aun así, quiere corregirlo como buena práctica antes de que haya usuarios reales, y prefiere la solución de menor alcance: **RLS + una vista pública**, no mover las columnas a otra tabla (más trabajo, mismo resultado de seguridad).

Ya se verificó (no hace falta repetirlo) que `scrapp-administrative-v2` nunca depende de RLS para leer esta tabla — `hooks.server.ts`, `b2cInvoicingManager.ts` y `uptime.ts` usan `SUPABASE_SERVICE_ROLE_KEY`, que bypassa RLS por completo. Bloquear el rol `anon` no debería romper nada del panel administrativo.

## Alcance

1. **Auditar el estado actual antes de tocar nada.** Confirmar si RLS ya está habilitado en `cinema_locations` y qué política (o qué `GRANT` a nivel de rol) es la que hoy permite que `anon` lea la tabla completa. Reportar esto en el resultado — importa saber si el mecanismo actual es "RLS deshabilitado" o "RLS habilitado con una policy demasiado permisiva", porque cambia cómo se revierte si algo sale mal.

2. **Crear una vista pública** con el nombre `cinema_locations_public` (usar exactamente este nombre — el código del webapp se actualizará para consumirlo, ver "Fuera de alcance") que exponga **solo** estas columnas, confirmadas seguras porque son las que el webapp ya consume hoy o son metadatos de tematización sin valor de credencial:
   - `id`, `name`, `short_name`, `city`, `address`, `is_active`, `sort_order`, `latitude`, `longitude`
   - `webapp_theme_id`, `webapp_allowed_tariffs`, `webapp_default_tariffs`, `webapp_kiosk_retention`
   - `created_at`, `updated_at`

   **Nunca incluir en la vista** (lista de exclusión, por si el nombre de alguna columna cambió o hay otras que no se listaron arriba): cualquier columna que empiece con `pos_`, `boleteria_`, o `candy_`. Si al inspeccionar el esquema real aparecen columnas de credenciales no listadas aquí, exclúyelas también aunque no estén en esta lista explícita — el criterio es "nada que sea usuario/contraseña/cookie/token de un sistema externo".

3. **Otorgar `SELECT`** sobre `cinema_locations_public` al rol `anon` (y `authenticated` si aplica en este proyecto).

4. **Bloquear el acceso de `anon` a la tabla base `cinema_locations`.** Según lo que se encuentre en el paso 1: si RLS está deshabilitado, habilitarlo y no crear ninguna policy para `anon`/`authenticated` (deny por defecto); si ya hay una policy permisiva para esos roles, reemplazarla o eliminarla. El objetivo final verificable: una consulta a `cinema_locations` (no a la vista) usando la anon key pública debe devolver 0 filas o un error de permisos, nunca datos.

5. **Verificar el resultado tú mismo** antes de reportar: hacer una consulta de prueba a `cinema_locations` con la anon key pública (la misma que está en `scrapp-webapp-cinema/.env` como `PUBLIC_SUPABASE_ANON_KEY`) y confirmar que ya no devuelve las columnas de credenciales (ni ninguna fila, según el mecanismo elegido). Y una consulta a `cinema_locations_public` con esa misma key, confirmando que sí devuelve las sedes con las columnas seguras.

## Criterio de aceptación
- `cinema_locations_public` existe con exactamente las columnas listadas en el paso 2 (o un superset seguro, si se decide incluir alguna más — pero nunca las de credenciales).
- Una consulta autenticada con la anon key pública a `cinema_locations` (tabla base) ya NO devuelve columnas de credenciales ni, idealmente, ninguna fila.
- Una consulta con esa misma key a `cinema_locations_public` sí devuelve las sedes activas correctamente.
- El panel administrativo (`scrapp-administrative-v2`) sigue funcionando igual — no debería requerir ningún cambio, porque usa `SUPABASE_SERVICE_ROLE_KEY`, pero vale la pena confirmarlo si es rápido.
- Reportar en `06-resultado.md`: el nombre final de la vista (si se cambió), las columnas exactas que quedaron expuestas, y qué mecanismo se usó para bloquear la tabla base (RLS nueva vs. policy reemplazada vs. revoke de grants).

## Fuera de alcance
- **No editar ningún archivo de `scrapp-webapp-cinema` ni de `scrapp-administrative-v2`.** El cambio de código que hará que el webapp consulte `cinema_locations_public` en vez de `cinema_locations` lo hace Claude directamente en cuanto se confirme que la vista existe con ese nombre — es edición de repo, no de Supabase, y ya está identificado en `scrapp-webapp-cinema/src/lib/state/cinema.svelte.ts`.
- No rotar las credenciales expuestas (`pos_password`, `boleteria_password`, `candy_password`, `pos_token`, etc.) — eso lo decide el usuario por separado, con quien administre esos sistemas externos.
- No tocar ninguna otra tabla del proyecto — el alcance es únicamente `cinema_locations`.
