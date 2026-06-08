# Arquitectura de Componentes

Para mantener el código escalable, libre de deuda técnica y evitar los monolitos, el proyecto `scrapp-webapp-cinema` sigue una estricta filosofía de **Orquestación en Rutas** y **Aislamiento en Componentes**.

## 1. Regla de Oro del Orquestador (`+page.svelte`)
Los archivos `+page.svelte` (las vistas principales) actúan **exclusivamente como orquestadores**.
- **No deben contener lógicas complejas de UI:** El marcado HTML debe limitarse al esqueleto principal (Header, Footer, envoltorios semánticos).
- **Gestión de Estado Global:** Son los encargados de manejar estados compartidos (ej. un modal híbrido, qué película está seleccionada) y pasarlos hacia abajo mediante *props* o interceptar sus eventos (closures/callbacks).
- **Inyección de Datos:** Ellos consumen los datos (`load` functions de SvelteKit o importaciones locales estáticas) y los distribuyen a sus componentes hijos.

## 2. Organización de la Carpeta `src/lib/components/`

Los componentes se dividen en 3 categorías:
1. **Primitivos (UI):** Componentes base sin estado de negocio (Botones, Inputs, Calendarios). Generalmente generados por Shadcn Svelte / Bits UI y alojados en `src/lib/components/ui/`.
2. **Globales:** Componentes que se repiten en diferentes vistas de la aplicación (ej. `Footer.svelte`, `MovieDetailsDialog.svelte`, `AuroraBackground.svelte`). Alojados en la raíz de `components/`.
3. **Específicos de Dominio (Domain-Specific):** Partes complejas de una vista en particular. Se agrupan en subcarpetas con el nombre de su dominio o vista. Por ejemplo: `src/lib/components/home/`.

## 3. Ejemplo: Estructura del Dominio `home`

Durante la construcción del Landing Page B2C, la UI fue dividida para aislar responsabilidades:

- **`PromoBanner.svelte`:** Banner superior completamente estático.
- **`HeroScrolly.svelte`:** Aisla de forma completa la compleja lógica del evento interactivo de Scrollytelling, manejando su propio estado `scrollY` para no re-renderizar el orquestador principal en cada pixel movido.
- **`DateSelector.svelte`:** Maneja internamente los tabs ("Hoy", "Mañana") y el componente dinámico avanzado de `Calendar` (Bits UI) con su propio Popover.
- **`NowPlayingCarousel.svelte` / `UpcomingCarousel.svelte`:** Agrupan la instanciación de la UI del carrusel, permitiendo inyectar una lista de películas genérica como prop (`movies`).
- **`ScrollToTop.svelte`:** Micro-componente con un binding a la ventana para aparecer únicamente después de un umbral de scroll.

## 4. Gestión de Datos Estáticos o Simulados
Toda data estática (como catálogos de prueba o variables constantes pesadas) debe aislarse en el directorio `src/lib/data/` (ej. `mockData.ts`). Jamás deben ensuciar los scripts principales.

*Siguiendo estas reglas, garantizamos un proyecto 100% modular, con tiempos de compilación Svelte óptimos e Inmersión UI impecable.*
