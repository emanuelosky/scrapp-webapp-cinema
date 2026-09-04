# 02 — CANCELADO: Agregar columna `slug` a `cinema_locations`

> **Estado: cancelado (2026-09-04).** Si estás leyendo esto y aún no empezaste,
> no hace falta que lo hagas — detente aquí. Si ya hiciste algún cambio en
> Supabase para este ticket, no pasa nada, es no-destructivo (una columna
> nueva no rompe nada), pero ya no es necesario continuarlo.

## Por qué se canceló
La URL pública de la sede de Candelaria se queda como `/cines/candelaria`
(no se renombra a `/cines/sambil-candelaria`). En su lugar, para mostrar el
nombre completo de la sede (ej. en el título de la pestaña o el header),
usamos directamente la columna `name` que ya existe en `cinema_locations`
("Sambil Candelaria"), sin necesidad de una columna `slug` nueva ni de tocar
el `id` interno.

Motivo: mantener la URL corta (`/candelaria`) era más simple y suficiente
para el objetivo original — no había necesidad real de desacoplar el slug
público del `id` interno todavía.

## Contenido original del ticket (referencia, ya no aplica)
Ver historial de git de este archivo si hace falta recuperar el contexto
completo de la propuesta original.
