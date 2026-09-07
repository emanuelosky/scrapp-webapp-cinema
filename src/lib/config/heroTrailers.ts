// Interruptor manual para la descarga de clips de tráiler del hero.
// En false: el hero siempre muestra el banner estático, sin pedir ningún
// video al bucket de Supabase (ahorra la cuota de egress mientras se
// trabaja en otras partes del home). Volver a true cuando se retome el
// trabajo sobre esta funcionalidad específica.
export const HERO_TRAILERS_ENABLED = true;

// Cuánto tiempo se muestra el banner estático antes de pasar al clip de
// video (si ya está disponible) — evita el "flash" de pasar directo al
// video apenas carga, dándole al banner una duración mínima consistente
// en todas las películas.
export const HERO_BANNER_MIN_MS = 2500;
