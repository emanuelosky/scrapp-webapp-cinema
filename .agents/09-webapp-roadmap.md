# Roadmap de Desarrollo: WebApp CINEPIC (Fase 2)

Este documento centraliza los objetivos arquitectónicos y funcionales para la siguiente etapa de desarrollo de la webapp, enfocándose en escalabilidad masiva, experiencia móvil, tematización multi-sede y el control avanzado del chatbot.

## 1. Migración a SPA (Single Page Application) masiva
**Objetivo:** Eliminar la dependencia de Node.js en el frontend para poder alojar la webapp en CDNs (Cloudflare Pages / S3) soportando millones de visitas sin caídas.
- **Acciones:**
  - [x] Instalar y configurar `@sveltejs/adapter-static` en `svelte.config.js`.
  - [x] Configurar todas las rutas base con `export const prerender = true` o `export const ssr = false` según corresponda para forzar el modo SPA.
  - [x] Asegurar que todas las llamadas de datos (fetches) se realicen del lado del cliente (`onMount` o `$effect` en Svelte 5) hacia las APIs de `scrapp-administrative-v2`.

## 2. Multi-Sede (Multi-Tenant) y Enrutamiento Dinámico
**Objetivo:** Soportar múltiples sedes (ej. Sambil Candelaria, Recreo, Valencia) donde cada sede tenga su propia URL base, identidad visual (colores) y catálogo.
- **Acciones:**
  - Modificar la ruta raíz (`/`) para que funcione como un "Hub de Selección de Sede" (estilo AMC o Cinehoyts).
  - Implementar un sistema de estado global (Store / Context Svelte 5) que almacene la Sede Seleccionada.
  - El enrutamiento debe reflejar la sede (ej. `/caracas/cartelera`, `/valencia/cartelera`) o manejarse vía subdominios / local storage.
  - Mapear paletas de colores dinámicas usando CSS Variables (`--primary`, `--secondary`) inyectadas desde la configuración de la sede.

## 3. Experiencia Mobile-First y Portabilidad (Híbrida)
**Objetivo:** Garantizar que el diseño se sienta como una app nativa en el teléfono y prepararlo para ser empaquetado en las tiendas de aplicaciones.
- **DECISIÓN ARQUITECTÓNICA (02-Sep-2026):** Se mantendrá el enfoque 100% en la WebApp Híbrida (Capacitor/PWA) para maximizar recursos y mantener una única base de código robusta. Se descarta temporalmente el desarrollo de apps nativas puras (Flutter/Swift) para evitar el doble mantenimiento.
- **Acciones:**
  - Auditar y refactorizar componentes para `Mobile-First` (Bottom navigation bars en móvil, modales tipo Bottom-Sheet usando `vaul-svelte` que ya está instalado).
  - Integrar **CapacitorJS**: Herramienta para tomar la SPA de SvelteKit y compilarla a proyectos nativos de Xcode (iOS) y Android Studio (APK/AAB) reutilizando el 100% del código web.
  - Configurar políticas de PWA (Progressive Web App) con Service Workers para que se pueda "Instalar" desde Chrome/Safari.

## 4. Tematización Inteligente (Modo Claro / Oscuro)
**Objetivo:** Respetar la preferencia de sistema operativo del usuario y permitir forzar modos.
- **Acciones:**
  - Aprovechar `mode-watcher` (ya instalado vía Shadcn/Bits) para detectar `prefers-color-scheme`.
  - Actualizar `app.css` con variables CSS para el bloque `.dark`.
  - Asegurar que la paleta de "CINEPIC" y futuras sedes tengan su contraparte legible en ambos modos (especialmente los degradados y efectos de neon/glassmorphism).

## 5. Super-Poderes para EPIK (Control del DOM)
**Objetivo:** Que el bot pueda "conducir" al usuario por la página de forma visual.
- **Acciones:**
  - Crear nuevas `tools` en el backend para EPIK.
  - En `EpikWidget.svelte`, suscribir la respuesta del bot a acciones complejas:
    - `highlight_element(id)`: Hacer un scroll suave y poner un borde brillante a un elemento (ej. un combo específico).
    - `add_to_cart(item)`: Que EPIK pueda armar el carrito de compras directamente.
    - `open_login()`: Que EPIK pueda desplegar modales de autenticación si el usuario necesita iniciar sesión.

---

### Auditoría Extra (Elementos a sumar a la planificación)

Revisando tu `package.json` actual, tenemos un stack súper robusto (Svelte 5, Tailwind 4, GSAP, Bits UI). Sin embargo, recomiendo sumar estas 2 tareas críticas a la planificación:

1. **Gestión de Estado (Cart & Auth):** Svelte 5 usa Runes (`$state`), necesitamos crear un módulo centralizado (`src/lib/state/cart.svelte.ts` y `user.svelte.ts`) para que EPIK, el Header y el Checkout lean la misma información reactiva de manera segura, especialmente al volverlo SPA.
2. **Animaciones de Transición (View Transitions API):** Al ser un SPA, usar la API de transiciones nativa del navegador hará que navegar entre películas no se sienta como cargar páginas, sino como abrir pantallas en una app nativa (morphing del poster del cine hacia los detalles). GSAP ya está instalado, podemos usarlo para micro-interacciones de altísimo nivel.

---

## Recomendación de Orden de Ejecución (Por dónde empezar)

Dado que todo el ecosistema depende de saber en qué Sede (Cine) está parado el usuario y si los datos provienen de un CDN, sugiero este orden lógico para atacar las tareas:

1. **Gestión de Estado Global (Cart, User, Location):** 
   - *Por qué:* Antes de rediseñar las vistas, necesitamos que el "Cerebro" de la app en el cliente (Svelte 5 Runes) sepa exactamente qué sede está seleccionada y qué tiene el usuario en su carrito. Es el cimiento.
2. **Migración a SPA (adapter-static):** 
   - *Por qué:* Configurar SvelteKit como SPA estático desde el inicio revelará rápidamente qué llamadas a la API o lógicas se rompen al no tener servidor Node. Es mejor romperlo y arreglarlo ahora que cuando la app sea más grande.
3. **Multi-Sede y Enrutamiento Dinámico (Hub Principal):** 
   - *Por qué:* Con el estado global listo y el SPA configurado, ahora sí podemos modificar la ruta raíz `/` para que obligue a elegir el cine y aplique la paleta de colores.
4. **Tematización (Modo Claro/Oscuro):** 
   - *Por qué:* Una vez implementadas las paletas por sede, sumar el *Dark Mode* será simplemente inyectar una capa CSS extra con las variables de Shadcn.
5. **Mobile-First / CapacitorJS & PWA:** 
   - *Por qué:* Con el look and feel terminado y los datos dinámicos fluyendo, podemos empezar a probar la app empaquetada en un simulador de iOS/Android para ajustar flexbox y *Bottom Navigation Bars*.
6. **Super-Poderes para EPIK:** 
   - *Por qué:* Como EPIK va a interactuar con el DOM de la app, es indispensable que el DOM y el Estado Global (Carrito) ya estén construidos de forma definitiva.
