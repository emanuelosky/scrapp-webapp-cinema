# EPIK Chatbot - Handoff & Architecture Status

## Resumen del Proyecto Actual (Bot EPIK)
EPIK es el Concierge VIP de CINEPIC. Su función es asistir a los usuarios de la aplicación web de cine (`scrapp-webapp-cinema`) conectándose a través del backend administrativo (`scrapp-administrative-v2`).

### 1. Frontend (`scrapp-webapp-cinema`)
- **Archivo Principal**: `src/lib/components/chat/EpikWidget.svelte`
- **Tecnología**: Vercel AI SDK (`@ai-sdk/svelte` v3.4), Svelte 5.
- **Estado Actual**:
  - Interfaz dinámica con burbujas de bienvenida y botón flotante.
  - El SDK maneja el stream de la conversación mediante `useChat`.
  - **Tool Handling**: El frontend detecta cuando el bot llama a una herramienta (e.g., `navigate_to`, `open_movie_modal`, `start_booking`) e interactúa con el estado de la UI (modal de película, carrito de compras).
  - **Manejo de Errores**: Se incorporó una función `retryMessage()` que usa `chat.sendMessage` inyectando `data: { useFallback: 'true' }` para reintentar errores graves de red.

### 2. Backend (`scrapp-administrative-v2`)
- **Archivo Principal**: `src/routes/api/chat/+server.ts`
- **Tecnología**: Vercel AI SDK (`@ai-sdk/openai`, `@ai-sdk/google`).
- **Proveedores**: 
  - Primario: Google Gemini (`gemini-3.5-flash`). (Limitado a capa gratuita 15 RPM, 20 RPD)
  - Secundario (Fallback): OpenRouter (`google/gemini-1.5-flash`).
- **Arquitectura de Resiliencia (Circuit Breaker)**:
  - Se implementó un **Token Bucket global** (`globalGoogleRequests`) que redirige proactivamente a OpenRouter si se superan las 14 peticiones por minuto.
  - Se implementó un **Proxy Wrapper (`aiModel`)** sobre `LanguageModelV1` que intercepta `doStream` y `doGenerate`. Si Google devuelve un error de cuota (429), el proxy atrapa la excepción en silencio, bloquea a Google permanentemente para el ciclo de vida actual (`googleBlockedUntil = -1`) e instantáneamente devuelve el stream generado por OpenRouter. Esto evita que el cliente reciba un error fatal a mitad de respuesta.

### 3. Prompting y Reglas de Negocio
El prompt del sistema está inyectado directamente en la llamada a `streamText` en el backend, incluyendo:
- Información en tiempo real (fecha, hora en Caracas, películas en cartelera y carrito de compras).
- **Muro Anti-Alucinaciones**: Instrucciones estrictas para no inventar precios ni reglas.
- **Muro Off-Topic**: Prohibición explícita de responder preguntas matemáticas, de política, historia o programación que no tengan que ver con el ecosistema de CINEPIC.

### Próximos Pasos (Next Steps)
- Continuar desarrollando la webapp y la integración del chat con la interfaz de usuario general.
- Implementar el sistema **RAG / Base de Conocimiento**: Extraer las políticas, precios y manuales largos del prompt fijo hacia una base de datos vectorial o sistema de inyección dinámica según contexto.
- Refinar la personalidad de EPIK si es necesario para adaptarla mejor a las promociones.
