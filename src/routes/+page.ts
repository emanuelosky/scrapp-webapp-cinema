import { cinemaState } from '$lib/state/cinema.svelte';
import { matchLocalHeroTrailer } from '$lib/utils/localTrailers';
import type { Movie } from '$lib/types';

// Catálogo combinado: trae las películas en cartelera de todas las sedes activas
// y las une en un solo listado (sin duplicar), para el carrusel "Películas en Cinepic" del home.
export const load = async ({ fetch }) => {
	const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5174';

	await cinemaState.init();
	const activeCinemas = cinemaState.cinemas;

	const perCinemaMovies = await Promise.all(
		activeCinemas.map(async (cinema) => {
			try {
				const res = await fetch(`${API_URL}/api/v1/movies?location_id=${cinema.id}`);
				if (!res.ok) return [] as Movie[];
				const data = await res.json();
				return (data.nowPlaying || []) as Movie[];
			} catch (e) {
				console.error(`Error fetching movies for ${cinema.id}:`, e);
				return [] as Movie[];
			}
		})
	);

	const merged = new Map<string, Movie>();
	for (const movies of perCinemaMovies) {
		for (const movie of movies) {
			const key = String(movie.id);
			if (!merged.has(key)) merged.set(key, movie);
		}
	}

	// TEMPORAL: prueba local de clips de tráiler (ver localTrailers.ts).
	// No pisa trailerAssetUrl si ya viene poblado desde la BD.
	const nowPlaying = Array.from(merged.values()).map((movie) => {
		if (movie.trailerAssetUrl) return movie;
		const local = matchLocalHeroTrailer(movie.title);
		return local ? { ...movie, trailerAssetUrl: local } : movie;
	});

	return { nowPlaying };
};
