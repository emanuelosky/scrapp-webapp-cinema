# Propuestas de Scrollytelling Funcional para Cines

Este documento recopila las ideas planteadas para evolucionar el bloque actual de **Scrollytelling** del prototipo hacia un flujo altamente funcional y orientado a la conversión (ventas y retención) para el cine.

## El Problema Actual
El prototipo actual utiliza un scrollytelling narrativo genérico ("¿Qué historia te gustaría crear con nosotros?"). Aunque es visualmente impresionante, en un entorno real de cine (donde el usuario busca comprar boletos o comida rápidamente), este valioso espacio interactivo podría aprovecharse mejor para destacar los beneficios y servicios especiales.

## Propuesta: Scrollytelling de Promociones y Experiencia

La idea central es utilizar la misma mecánica de scroll anclado e imágenes cambiantes, pero enfocada en mostrar los "Súper Poderes" o "Beneficios VIP" del cine. A medida que el usuario hace scroll, la imagen central o el fondo cambia dinámicamente y el texto a los lados revela promociones clave con "Call To Actions" (CTAs) directos.

### Etapas Sugeridas (3 a 4 pasos)

#### Etapa 1: Promociones Estrella (El Gancho Fuerte)
- **Concepto:** Lunes a mitad de precio o martes populares.
- **Visualización:** Un ticket dorado gigante, o un tazón de cotufas (palomitas) rebosante que cae desde arriba.
- **Copy:** *"Lunes Populares: Todo a mitad de precio"*
- **Acción:** Botón de "Ver funciones en promoción".

#### Etapa 2: Planes Familiares
- **Concepto:** Descuento para los más pequeños.
- **Visualización:** Elementos mágicos, un ticket para niños, o personajes infantiles asomándose (dependiendo de las películas en cartelera).
- **Copy:** *"Los pequeños gigantes del cine. Niños hasta 12 años pagan la mitad antes de las 5:00 PM."*
- **Acción:** Botón de "Ver películas infantiles".

#### Etapa 3: Experiencia VIP / Confort Tecnológico
- **Concepto:** Vender la experiencia, no solo la película.
- **Visualización:** Un modelo 3D de una butaca reclinable de lujo encendiéndose, o una representación visual de ondas de sonido para Dolby Atmos.
- **Copy:** *"No es solo ver una película, es vivirla en su máxima expresión con Dolby Atmos y asientos VIP."*
- **Acción:** Botón de "Conoce nuestras salas".

#### Etapa 4: Loyalty Program (Club Cinepic)
- **Concepto:** Retención de usuarios y creación de cuentas.
- **Visualización:** Una tarjeta de membresía digital brillando o una medalla.
- **Copy:** *"¿Ya eres parte del Club Cinepic? Suma puntos en cada combo y gana entradas gratis."*
- **Acción:** Botón de "Unirme gratis" (Lleva al registro).

## Consideraciones Técnicas
- **Imágenes Optimizadas:** Reemplazar los textos abstractos por imágenes PNG o WEBP con transparencia, o incluso modelos 3D usando `@threlte/core` si el presupuesto lo permite.
- **Lógica de Estado:** Mantener el uso de `inview` de Svelte (actualmente implementado en `+page.svelte`) para disparar eventos `activeEvent` que cambien la opacidad/posición de las imágenes centrales.
- **Accesibilidad:** Proveer un botón de "Saltar promociones" para aquellos usuarios que deseen ir directamente al pie de página o a comprar sin hacer todo el recorrido del scroll.
