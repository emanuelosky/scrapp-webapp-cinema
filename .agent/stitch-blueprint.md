# Stitch MCP: Documento de Diseño y Orquestación

Este documento contiene las descripciones de diseño para ser inyectadas en la herramienta Stitch (MCP). Stitch usará estos "prompts" para generar el sistema de diseño y las pantallas de la plataforma B2C Cinema Webapp en SvelteKit.

---

## 1. Diseño Base (Design System Prompt)

**Prompt para `create_design_system_from_design_md`:**
> "Crea un sistema de diseño para una web de cines premium orientada a la venta de tickets. La estética debe ser minimalista, elegante y profundamente inspirada en las interfaces modernas de Apple (Apple TV+, Apple Store), pero adaptada para un cine. 
> Reglas críticas:
> 1. Soporte perfecto para modos oscuro y claro. El modo oscuro usará fondos negros absolutos (`#000000` o zinc-950) y el claro blancos impecables.
> 2. Usa componentes de Shadcn-Svelte. Las tarjetas, botones y modales deben usar líneas muy sutiles (`border-border`, opacidad baja) en lugar de sombras fuertes o fondos pesados.
> 3. Tipografía limpia (ej. Inter o San Francisco si está disponible), con fuertes contrastes en los encabezados.
> 4. Los botones primarios (ej. 'Comprar Entradas') deben tener un diseño flat o muy ligeramente redondeado, sin gradientes excesivos.
> 5. **Evita estrictamente** colores neón, desenfoques (blurs) excesivos o glassmorphism. Mantén una paleta de colores neutros y pasteles suaves para acentuar sin saturar, preservando un look minimalista, sofisticado y no reciclado."

---

## 2. Pantallas B2C (Screens Prompts)

### Pantalla 1: Home (Cartelera)
**Prompt para `generate_screen_from_text`:**
> "Pantalla principal de inicio. La parte superior debe ser un Hero Banner inmersivo que ocupa el ancho completo, mostrando el arte de fondo (backdrop) de la película principal de la semana en alta resolución, con el título y un botón primario de 'Comprar Tickets' integrados de forma elegante.
> Debajo del Hero Banner, implementa una sección 'En Cartelera' usando un carrusel o grilla de Shadcn-Svelte. Las tarjetas de las películas deben ser rectangulares (proporción poster), sin bordes toscos y con líneas sutiles tipo Apple. En hover, las imágenes pueden tener un sutil escalado. Debe haber espacio para publicidad limpia y banners promocionales que mantengan el minimalismo."

### Pantalla 2: Detalle de Película y Selección de Función
**Prompt para `generate_screen_from_text`:**
> "Pantalla de información detallada de la película. El fondo de la página debe ser un color sólido neutro o un degradado extremadamente sutil, **sin blurs ni efectos sobrecargados**. Un bloque principal limpio contendrá: a la izquierda, el póster oficial; a la derecha, título, metadatos (director, actores, clasificación, duración), una sinopsis extensa y un tráiler embebido con esquinas redondeadas.
> Debajo de la información de la película, una interfaz muy intuitiva para seleccionar la Fecha y la Función (horario). Usa un diseño estilo pastillas (pills) seleccionables (Shadcn Toggle Group o botones sutiles) tanto para los días de la semana como para las horas disponibles."

### Pantalla 3: Mapa de Butacas (Seat Selection)
**Prompt para `generate_screen_from_text`:**
> "Interfaz de selección de butacas inmersiva y de estética premium. En la parte superior del contenedor, una **línea recta fina y sutil** (NO curva) con la etiqueta 'PANTALLA'.
> Debajo, una cuadrícula (grid) que representa los asientos, separados por un pasillo central. Los asientos deben ser rectángulos o cuadrados minimalistas con bordes ligeramente redondeados (`rounded-md`). 
> - Asiento Libre: Gris sutil o transparente con borde claro. Hover interactivo.
> - Asiento Seleccionado: Relleno sólido con el color primario de acento.
> - Asiento Ocupado: Gris muy opaco o con una 'X' sutil, sin interrumpir la estética limpia.
> En la parte inferior, anclado o flotante con fondo sólido opaco (sin glassmorphism), una barra de resumen que muestra las butacas elegidas, el monto total calculado, y un botón grande primario para 'Continuar al Pago'."

### Pantalla 4: Checkout y Cross-Selling
**Prompt para `generate_screen_from_text`:**
> "Página final de confirmación y pago. Divide la pantalla en dos columnas limpias.
> Columna Izquierda: Un flujo vertical que primero muestra recomendaciones sutiles de Dulcería/Combos (Cross-selling) en tarjetas muy limpias con botones 'Agregar'. Debajo, el formulario minimalista para los datos del cliente y los inputs de tarjeta de crédito, estructurados con componentes limpios tipo Shadcn.
> Columna Derecha: Un panel lateral adherido (sticky) que actúa como resumen de compra. Debe mostrar el póster de la película en pequeño, nombre, fecha, hora, butacas seleccionadas, combos agregados y el gran total, desglosando los impuestos. Todo encapsulado con una línea de borde muy sutil, estilo Apple."
