import type { Movie } from '$lib/types';

const PREMIUM_FORMAT_HINTS = ['VIP', '4DX', 'IMAX', 'PREMIUM', 'RECLINER'];

/**
 * El campo `formats` que devuelve el BFF es solo el de la PRIMERA función que
 * encontró para esa sede/fecha, no la lista real de formatos en los que se
 * proyecta la película (confirmado en la investigación previa a este
 * componente). La lista real se arma del lado del cliente a partir de cada
 * entrada de `showtimesByDate` — no requiere ningún cambio de backend.
 */
export function deriveFormats(movie: Movie): string[] {
	const set = new Set<string>();
	const byDate = movie.showtimesByDate || {};
	for (const entries of Object.values(byDate)) {
		for (const entry of entries) {
			if (entry.format) set.add(entry.format);
		}
	}
	if (set.size === 0 && movie.formats?.video) set.add(movie.formats.video);
	return Array.from(set);
}

export function isPremiumFormat(format: string | undefined): boolean {
	if (!format) return false;
	const upper = format.toUpperCase();
	return PREMIUM_FORMAT_HINTS.some((hint) => upper.includes(hint));
}

/** El formato a destacar en la tarjeta: el premium si existe alguno, si no el primero. */
export function primaryFormatBadge(movie: Movie): string | undefined {
	const formats = deriveFormats(movie);
	if (formats.length === 0) return undefined;
	return formats.find((f) => isPremiumFormat(f)) || formats[0];
}
