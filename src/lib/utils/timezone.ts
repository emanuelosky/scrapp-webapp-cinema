/**
 * Utilidades para centralizar la zona horaria a America/Caracas.
 * Garantiza que la hora y el "día de hoy" se calculen correctamente,
 * sin importar la zona horaria del servidor o del navegador.
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
