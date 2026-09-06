import { cinemaState } from '$lib/state/cinema.svelte';
import type { Movie } from '$lib/types';

// Catálogo combinado: trae las películas en cartelera de todas las sedes activas
// y las une en un solo listado (sin duplicar), para el carrusel "Películas en Cinepic" del home.
export const load = async ({ fetch }) => {
	const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5174';

	await cinemaState.init();
	const activeCinemas = cinemaState.cinemas;

	const perCinemaData = await Promise.all(
		activeCinemas.map(async (cinema) => {
			try {
				const res = await fetch(`${API_URL}/api/v1/movies?location_id=${cinema.id}`);
				if (!res.ok) return { nowPlaying: [] as Movie[], comingSoonMovies: [] as Movie[] };
				const data = await res.json();
				return {
					nowPlaying: (data.nowPlaying || []) as Movie[],
					comingSoonMovies: (data.comingSoonMovies || []) as Movie[]
				};
			} catch (e) {
				console.error(`Error fetching movies for ${cinema.id}:`, e);
				return { nowPlaying: [] as Movie[], comingSoonMovies: [] as Movie[] };
			}
		})
	);

	// Combina un mismo movie.id visto en varias sedes: en vez de quedarse solo
	// con la copia de la primera sede que lo trajo (lo que hacía perder sus
	// funciones si esa sede en particular no lo pasaba hoy), une las
	// funciones de "hoy" (`showtimes`) y de todas las fechas
	// (`showtimesByDate`) de cada sede que sí lo tenga. No recalculamos
	// "hoy" nosotros mismos (evita desalinearnos del día de cartelera real,
	// que ya viene resuelto correctamente desde el backend con su propio
	// huso horario) — solo unimos lo que cada sede ya trae resuelto.
	function mergeMovies(lists: Movie[][]): Movie[] {
		const merged = new Map<string, Movie>();
		for (const movies of lists) {
			for (const movie of movies) {
				const key = String(movie.id);
				const existing = merged.get(key);
				// La API real siempre manda `showtimes` como string[] (horas ya
				// formateadas, ver api/v1/movies/+server.ts) -- el otro miembro
				// del union (ShowtimeDetails[]) es "legacy/fallback", no algo que
				// esta ruta reciba hoy.
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

	const nowPlaying = mergeMovies(perCinemaData.map((d) => d.nowPlaying));
	const comingSoonMovies = mergeMovies(perCinemaData.map((d) => d.comingSoonMovies));

	return { nowPlaying, comingSoonMovies };
};
