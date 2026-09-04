# Cola de Tareas para Antigravity (Gemini Agent)

Esta carpeta es distinta de `.agents/` (que documenta la arquitectura viva del
proyecto). Aquí viven **prompts autocontenidos** para que el agente de
Antigravity (con acceso directo a los MCP de Supabase y Render que Claude no
tiene en esta sesión) ejecute tareas puntuales sin necesitar el historial de
esta conversación.

## Cuándo un ticket va aquí

Solo tareas que requieran herramientas que Claude no tiene en este entorno:
consultas o mutaciones directas en Supabase (`scrapp-database`), inspección o
configuración de servicios en Render, o cualquier acción que dependa de esos
MCP. Todo lo que sea edición de archivos del repo (componentes Svelte,
assets, refactors) lo hace Claude directamente — no delegar eso aquí.

## Formato de cada ticket

Cada archivo `NN-nombre-tarea.md` debe tener:

1. **Objetivo** — una frase, qué debe quedar resuelto al terminar.
2. **Contexto** — por qué se necesita, qué decisión o trabajo depende de esto.
3. **Alcance** — pasos concretos o preguntas a responder.
4. **Criterio de aceptación** — cómo saber que terminó bien.
5. **Fuera de alcance** — qué NO debe tocar (evita que el agente se desvíe).

## Ciclo de vida

- El agente de Antigravity ejecuta el ticket y reporta resultados (idealmente
  como comentario al final del mismo archivo, o en un archivo `NN-resultado.md`
  hermano).
- Una vez resuelto, el ticket puede archivarse o borrarse — no es
  documentación permanente, es una cola de trabajo.
