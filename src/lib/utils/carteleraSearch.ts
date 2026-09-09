import type { Movie } from '$lib/types';

// Insensible a mayúsculas y acentos: títulos en español ("Depredador",
// "Los 4 Fantásticos") no deberían fallar por escribir sin tilde. Mismo
// truco de normalización que ya usa EpikWidget.svelte para emparejar
// títulos que menciona el usuario.
function normalize(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '');
}

/**
 * También compara contra los géneros (no solo el título): sin chips de
 * género visibles, escribir "terror" o "comedia" igual encuentra algo,
 * en vez de exigirle al usuario el nombre exacto de la película.
 */
export function matchesSearch(movie: Movie, query: string): boolean {
	const trimmed = query.trim();
	if (!trimmed) return true;
	const haystack = normalize([movie.title, ...(movie.genres || [])].join(' '));
	return haystack.includes(normalize(trimmed));
}
