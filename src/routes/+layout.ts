import { fetchPromo, fetchCartelera } from '$lib/api';
import { cinemaState } from '$lib/state/cinema.svelte';
import type { PromoBanner, Movie } from '$lib/types';

// Deshabilita el renderizado del lado del servidor.
// Todo el frontend operará como Single Page Application (SPA).
export const ssr = false;

// Función para combinar carteleras de múltiples sedes
function mergeMovies(lists: Movie[][]): Movie[] {
	const merged = new Map<string, Movie>();
	for (const movies of lists) {
		for (const movie of movies) {
			const key = String(movie.id);
			const existing = merged.get(key);
			const todayTimes = (movie.showtimes || []) as string[];
			if (!existing) {
				merged.set(key, {
					...movie,
					showtimes: [...todayTimes],
					showtimesByDate: { ...(movie.showtimesByDate || {}) }
				});
				continue;
			}
			existing.showtimes = [...((existing.showtimes || []) as string[]), ...todayTimes];
			const existingDates = existing.showtimesByDate || {};
			const incomingDates = movie.showtimesByDate || {};
			for (const date of Object.keys(incomingDates)) {
				existingDates[date] = [...(existingDates[date] || []), ...incomingDates[date]];
			}
			existing.showtimesByDate = existingDates;
		}
	}
	return Array.from(merged.values());
}

export const load = async ({ fetch, params, depends }) => {
	depends('app:cinemas');

	// Disparamos la verificación de sedes activas
	cinemaState.verifyCatalog(fetch);
	const activeCinemas = cinemaState.cinemas;

	// Promesa para la promoción (depende de si hay sede)
	const sede = params.sede;
	const promoPromise = sede ? fetchPromo(sede, fetch) : Promise.resolve(null);

	// Promesa para la cartelera global (todas las sedes)
	const carteleraPromises = Promise.all(
		activeCinemas.map((cinema) => fetchCartelera(cinema.id, fetch))
	);

	// Esperamos ambas operaciones en paralelo para no penalizar el tiempo de carga
	const [activePromo, perCinemaData] = await Promise.all([promoPromise, carteleraPromises]);

	const nowPlaying = mergeMovies(perCinemaData.map((d) => d.nowPlaying));
	const comingSoonMovies = mergeMovies(perCinemaData.map((d) => d.comingSoonMovies));

	return {
		activePromo,
		nowPlaying,
		comingSoonMovies
	};
};
