# 04-resultado: Optimización Local de Tráilers (Demo Estática)

Dado que decidimos no usar Supabase por ahora para ahorrar ancho de banda, aprovecharemos los videos fuentes en alta calidad procesándolos localmente. Serviremos estos clips optimizados estáticamente desde la webapp.

## 1. Identificación de Áreas Estratégicas para Animación
Se implementarán animaciones de video en tres áreas clave de la webapp:

1. **Hero Banner Principal (`cines/[sede]/+page.svelte`):**
   - **Formato:** Horizontal (16:9), 10 a 15 segundos, comprimido fuertemente (target: ~3-5 MB).
   - **Comportamiento:** Autoplay, en bucle (loop), silenciado. Funciona como fondo inmersivo apenas entras al cine.
2. **Tarjetas de Películas (`MovieGlassCard.svelte`):**
   - **Formato:** Recorte Vertical/Cuadrado, de solo 3 a 5 segundos, súper comprimido (target: < 1 MB).
   - **Comportamiento:** Muteado. En **Desktop**, se reproduce *solo* cuando el usuario hace hover (pasa el ratón) sobre el póster. En **Móviles**, mostraremos solo el póster estático para no consumir batería/datos ni recargar el DOM.
3. **Ficha de Selección de Horarios (`MovieDetailsDialog.svelte`):**
   - **Formato:** Horizontal o Cuadrado, loop corto.
   - **Comportamiento:** Fondo sutil animado al abrir la ficha de horarios.

## 2. Script Automatizado (`scripts_y_pruebas/process_trailers.mjs`)
Se creó y ejecutó un script en Node.js que itera sobre la carpeta `resources-cinema/trailers`. Utilizando `ffmpeg`, este script:
- Extrae un segmento de pura acción (saltándose los primeros 5 segundos).
- Remueve el audio, reduce la escala (480p) y lo comprime en formato `.webm`.
- Los resultados optimizados se guardan en `static/trailers/hero/` y `static/trailers/posters/`.

## 3. Código a Implementar (Solo Documentación)
A petición del equipo, no se modificó el código fuente de Svelte. Cuando se desee activar estos videos en producción, se deben aplicar los siguientes ajustes:

### A. En `HeroDesktop.svelte`
Envolver la imagen estática (`<img src={activeMovie.banner...`) para sobreponer el video con un fallback:
```svelte
<!-- Fallback Image -->
<img src={activeMovie.banner || activeMovie.poster} class="absolute inset-0 w-full h-full object-cover blur-2xl opacity-70 scale-110 transition-opacity duration-1000 animate-in fade-in" alt=""/>

<!-- Video Player -->
<video 
	src={`/trailers/hero/${activeMovie.title.toLowerCase().replace(/[^a-z0-9]/g, '')}.webm`}
	class="absolute inset-0 w-full h-full object-cover blur-sm opacity-60 scale-105 transition-opacity duration-1000 animate-in fade-in mix-blend-screen"
	autoplay loop muted playsinline
	onerror="this.style.display='none'"
></video>
```
*Nota:* Usamos `onerror` nativo de HTML para ocultar el video si el archivo no existe, dejando ver la imagen original de TMDB que está debajo.

### B. En `MovieGlassCard.svelte` (Pósters)
Para reproducir el póster solo al hacer hover en Desktop, sin bloquear móviles:
```svelte
<script>
  let isHovered = $state(false);
</script>

<!-- En el div contenedor principal del póster agregamos los eventos: -->
<div 
  onmouseenter={() => isHovered = true} 
  onmouseleave={() => isHovered = false}
  class="relative aspect-[2/3] w-full..."
>
  <img src={movie.poster} class="w-full h-full object-cover..." />
  
  <!-- Solo renderizamos el video si está en hover para ahorrar RAM -->
  {#if isHovered}
    <video 
      src={`/trailers/posters/${movie.title.toLowerCase().replace(/[^a-z0-9]/g, '')}.webm`}
      autoplay loop muted playsinline
      class="absolute inset-0 w-full h-full object-cover z-10"
      onerror="this.style.display='none'"
    ></video>
  {/if}
</div>
```
