// Constantes de layout compartidas entre CarteleraChapters (contador
// gigante) y CarteleraChapter (tarjetas), para que ninguno adivine la otra.

/** Franja (px) que asoma de la siguiente tarjeta en reposo, en tablet y
 * escritorio: la señal de "hay más" sin agregar UI. En móvil no aplica. */
export const PEEK = 120;

/** Corte móvil. El mismo que ya usa el home (`HeroMobile` es `sm:hidden`,
 * o sea < 640px). Se evalúa en JS con matchMedia, no con clases ocultas. */
export const MOBILE_QUERY = '(max-width: 639px)';
