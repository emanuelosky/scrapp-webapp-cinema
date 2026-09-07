/**
 * ATENCIÓN: `APP_TIMEZONE` es solo el fallback para cuando todavía no se
 * conoce la sede (home multisede, catálogo sin cargar, error de red) — NO es
 * "la" zona horaria de la app. Cada sede tiene la suya en
 * `cinema_locations.timezone`, expuesta como `cinemaState.activeTimezone`.
 * Usar esta constante directamente para filtrar horarios de una sede
 * específica es el bug que causó esta refactorización: asumía que todo cine
 * está en Caracas, lo cual deja de ser cierto en cuanto haya una sede en otro
 * país. Antes de importar esto, pregúntate si en realidad quieres
 * `cinemaState.activeTimezone`.
 */

export const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || 'America/Caracas';

/**
 * Retorna la fecha actual de Venezuela en formato YYYY-MM-DD.
 */
export function getTodayDateString(): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(new Date());
}

/**
 * Retorna un objeto Date local que representa la media noche (00:00:00) 
 * del día actual en Venezuela.
 */
export function getCinemaToday(): Date {
    const str = getTodayDateString();
    return new Date(`${str}T00:00:00`);
}
