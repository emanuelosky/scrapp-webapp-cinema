# 08 — Corregir el texto del aviso "Lunes Populares"

## Objetivo
Corregir una redundancia en el mensaje del promo banner que se muestra en el sitio, para que se lea como una oferta clara en vez de repetir la misma cifra de dos formas distintas.

## Contexto
El aviso vive en la tabla `wbpp_promos` (filtrada por `location_id`, consultada por el BFF en `GET /api/v1/promos?location_id=<sede>`, campo `PromoBanner.message`). El texto actual, visto en producción:

> Lunes Populares: ¡Aprovecha hoy 50% de descuento a mitad de precio en todas tus boletos! Compra tus boletos ahora.

El problema: "50% de descuento" y "a mitad de precio" dicen exactamente lo mismo (50% de descuento ES mitad de precio) — decir ambos a la vez lee como un error de redacción, no como énfasis.

Del lado del código ya se resolvió por separado que el aviso sea clicable (antes terminaba en "Compra tus boletos ahora" sin llevar a ningún lado) — ese cambio no requiere tocar la base de datos, así que no es parte de este ticket.

## Alcance
1. Localizar la fila en `wbpp_promos` cuyo `message` contiene el texto citado arriba (probablemente `name = 'Lunes Populares'` o similar, pero confirma antes de actualizar — no asumas que hay una sola fila con esa oferta).
2. Actualizar el campo `message`. Sugerencia (el dueño del producto puede pedir otra redacción, esto es solo para no dejar la redundancia):
   > Lunes Populares: ¡Hoy todos tus boletos a mitad de precio! Compra tus boletos ahora.
3. Revisar si `wbpp_promos` tiene otras filas con la misma redundancia u otros errores de redacción evidentes — si encuentras alguna, repórtala en el resultado en vez de corregirla sin avisar (puede ser intencional).

## Criterio de aceptación
- El `message` de la fila de "Lunes Populares" ya no repite la misma cifra de dos formas.
- Confirmar el cambio con una consulta real: `SELECT id, name, message FROM wbpp_promos WHERE message ILIKE '%Lunes Populares%';` (o el filtro que corresponda una vez localizada la fila) antes y después.
- Reportar en `08-resultado.md`: el texto anterior, el texto nuevo, y si se encontraron otras filas con problemas similares de redacción.

## Fuera de alcance
- No tocar código de `scrapp-webapp-cinema` ni `scrapp-administrative-v2` — el botón/link ya está resuelto del lado del código, esto es puramente un dato.
- No cambiar `days_of_week`, `start_time`, `end_time`, `icon`, `bg_color_class` ni `text_color_class` de esta fila — solo el texto.
- No inventar ni asumir el nombre exacto de la fila/promoción sin confirmarlo con una consulta primero.
