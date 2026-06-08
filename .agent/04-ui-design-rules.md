# Reglas de Diseño de Interfaz (UI/UX)

El frontend de la plataforma B2C buscará un equilibrio perfecto entre la inmersión cinematográfica y el minimalismo tecnológico (estilo Apple). 

## 1. Estética General
- **Inspiración:** Aplicaciones modernas de AMC Theatres y Cinepic, combinadas con la sofisticación interactiva de Apple VisionOS.
- **Minimalismo 'Liquid Glass':** Uso predominante de una paleta estricta en Negro (`zinc-950` a `#000000`), Blanco y Gris. La interfaz utiliza cristal templado / glassmorphism (`bg-white/[0.02] backdrop-blur-xl border-white/10`) para estructurar la información sin recurrir a bloques de color sólidos invasivos.
- **Color de Acento (Ámbar):** Queda estrictamente reservado como color de acento "Accent" para grandes elementos promocionales (Ej. fondo iluminado del Hero Carousel, avisos de Lunes Populares). Todos los demás botones e interacciones menores deben mantenerse neutrales.
- **Boleto Digital (Movie Cards):** Las tarjetas de la cartelera deben mantener una estructura de ticket: separando de arriba a abajo el Título, Formatos Técnicos y Horarios mediante líneas divisorias muy finas, implementando Scroll Táctil (`Drag-to-Scroll`) nativo.
- **Prohibición de Emojis:** Queda estrictamente prohibido el uso de emojis en la interfaz gráfica (UI), código fuente y documentación técnica. En su lugar, se usarán gráficos SVG de la librería `@lucide/svelte` (como `Ticket`, `MapPin`, `Volume2`).

## 2. Sistema de Componentes (Shadcn Svelte / Bits UI)
Todo el sistema de UI estará fundamentado en **Shadcn Svelte** (y sus primitivas de **Bits UI**) combinado con **Tailwind CSS**.
- **Ventajas:** Componentes accesibles (ARIA compliance), altamente personalizables, no inyectan CSS forzado y se adaptan perfectamente a los temas oscuro/claro mediante variables CSS en `app.css`.
- **Compatibilidad con Svelte 5:** Utilizaremos Svelte 5 con runas (`$state`, `$derived`, `$effect`, `$props`).
- **Componentes Clave a utilizar:**
  - `Carousel` para carteleras (Embla Carousel).
  - `Card` (con bordes muy finos) para las películas.
  - `Dialog` con fondo oscuro/claro sólido para detalles rápidos o trailers.
  - `Button` con variantes minimalistas (outline sutil, ghost, y un color primario elegante para la acción de "Comprar").
  - `Calendar` / `Popover` avanzados y personalizables para el Date Selector de Cartelera, limitados al dominio necesario (ej. solo mostrar la próxima semana).

## 3. Selector de Butacas (Estilo AMC)
La representación gráfica de la sala será altamente inmersiva y técnica:
- **Pantalla Plana:** Línea recta sutil sin curvas artificiales.
- **Gráficos SVG:** Se usarán vectores de alta fidelidad para representar butacas normales y butacas para sillas de ruedas (discapacitados).
- **Pasillos:** Se usarán guiones o líneas muy tenues (`-`) para demarcar físicamente los pasillos, igual que en la lógica del CFD.
- **UX en Móvil (Pinch-to-Zoom):** En pantallas pequeñas, el mapa cargará alejado (zoomed out) para dar un panorama completo. Al tocar una zona, se hará un zoom suave permitiendo arrastrar (pan) y seleccionar butacas con precisión sin *misclicks*.
- **Estados:**
  - *Libre:* Gris sutil con hover dinámico.
  - *Seleccionada:* Color primario (para destacar fuertemente).
  - *Ocupada:* Opacidad reducida, tal vez con una línea cruzada, sin distracciones visuales.

## 4. Flujo de Usuario B2C (Responsive y Localizado)
1. **Home:** Gran Hero Banner + Carrusel minimalista Shadcn de "En Cartelera".
2. **Detalle de Película (Híbrido):** 
   - *En Desktop:* Se abrirá como un **Dialog/Modal** limpio sobre el Home, sin recargar la página.
   - *En Móvil:* Cargará una UI dedicada ultra-simplificada que ocupará la pantalla completa, mostrando únicamente el póster, la sinopsis resumida y el selector de fecha/hora.
3. **Butacas:** Grilla interactiva SVG (Pinch-to-zoom en móviles).
4. **Checkout (Adaptado a Venezuela):** 
   - Diseño "One-Page Checkout".
   - Soporte para **Cédula de Identidad** (Selector V/E/J/G + Teclado numérico).
   - **Pago Móvil (C2P/P2P):** Formulario para Banco, Teléfono y N° de Referencia.
   - **Zelle:** Muestra datos del titular y pide captura de N° de Confirmación.
   - Mostrará explícitamente conversiones duales (USD / VES) si aplica.
