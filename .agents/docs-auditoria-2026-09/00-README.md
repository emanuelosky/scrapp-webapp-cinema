# Auditoría de caché, rendimiento, legalidad y sedes — 2026-09

## Por qué existe esta carpeta

El 2026-09-06 se auditó `scrapp-webapp-cinema` (y de rebote partes de `scrapp-administrative-v2`) para responder tres preguntas concretas del usuario: ¿conviene cachear en el dispositivo?, ¿es legal?, y ¿es buena idea fijar la lista de sedes en el bundle? La auditoría (62 subagentes, verificación adversarial de cada hallazgo contra el código real) contestó esas tres preguntas pero destapó bastante más: un error de facturación activo, PII sin aviso en un kiosco compartido, y una API que no valida sedes activas.

**Contexto de por qué hay tantos hallazgos** (explicación del usuario, no mía, pero correcta y vale la pena que quede escrita aquí): la webapp se construyó priorizando el impacto visual — un mockup/demo — sin desarrollar en paralelo la capa funcional (tasas, pagos, facturación, bloqueo de butacas contra el POS legacy). Eso es exactamente lo que separa los hallazgos de esta auditoría: casi todo lo grave vive en las partes "funcionales" que quedaron pendientes, no en las visuales.

**Plan de trabajo acordado con el usuario:**
1. Terminar de definir la estética en las rutas visuales (home, cartelera, página de sede, selector de butacas).
2. Solo entonces atacar lo funcional: tasas de cambio, pagos, facturación.
3. La integración con el sistema legacy que bloquea butacas es un punto crítico aparte, para más adelante — de ahí sale buena parte de los hallazgos más graves (C1, C3, C4, P10, P11).

## Qué hay en esta carpeta

- **[01-tareas.md](./01-tareas.md)** — el checklist de trabajo, organizado en las fases de arriba. Es el archivo a consultar mientras se repara cada punto; márcalo con `[x]` a medida que se cierra cada tarea.
- **[02-informe-completo.md](./02-informe-completo.md)** — el informe íntegro de la auditoría (42 hallazgos sobrevivientes, con archivo:línea, ganancia/riesgo, y una sección final de "lo que NO hay que hacer" con las trampas ya descartadas). Consúltalo cuando 01-tareas.md necesite más contexto del que cabe en una línea de checklist.

## Qué ya se corrigió antes de escribir esto

Ver commits `0ca77c8`, `8c813a6` y `28378be` en este repo:
- Enrutamiento multisede (la URL como fuente de verdad de la sede activa).
- Semilla fija del catálogo de sedes (`src/lib/config/cinemasSeed.ts`) con protocolo de divergencia completo: la red siempre pisa a la semilla, invalidación del home si diverge, expulsión si el usuario está en una sede retirada, y `npm run check:sedes` como guardarraíl en CI.
- Borrado de `src/routes/api/poster/[id]/+server.ts` (endpoint muerto con posters mock; los posters reales viven en Supabase).

Esas tareas NO están en el checklist de 01-tareas.md porque ya están hechas.

## Cómo se generó

Workflow `audit-cache-perf-cinepic` (run `wf_d4815fcf-376`), 5 dimensiones en paralelo (assets, capa de datos, bundle, privacidad, arranque) → cada hallazgo verificado por un revisor adversarial independiente → síntesis. Transcript completo, si hace falta bajar al detalle agente-por-agente:
`C:\Users\ELITEDESK\.claude\projects\C--ONGOING-PROJECTS\13e1a020-f609-4dc3-a29d-992f5ac2cf21\subagents\workflows\wf_d4815fcf-376\journal.jsonl`
