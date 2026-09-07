import { error } from '@sveltejs/kit';
import { cinemaState } from '$lib/state/cinema.svelte';
import type { Movie } from '$lib/types';

// Mismo patrón que `cines/[sede]/+page.ts`: verificar el catálogo y traer la
// cartelera arrancan en paralelo, y solo esperamos la verificación (para
// poder devolver 404 en un slug inventado) antes de confiar en la respuesta.
export const load = async ({ fetch, params }) => {
	const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5174';
	const sede = params.sede;

	let nowPlaying: Movie[] = [];
	let comingSoonMovies: Movie[] = [];
	let activeDates: string[] = [];

	const catalogReady = cinemaState.verifyCatalog();
	const moviesReq = fetch(`${API_URL}/api/v1/movies?location_id=${sede}`).catch((e) => {
		console.error('Network error fetching movies:', e);
		return null;
	});

	await catalogReady;
	if (cinemaState.catalogStatus !== 'error' && !cinemaState.isKnownCinema(sede)) {
		error(404, `No encontramos el cine "${sede}".`);
	}

	const res = await moviesReq;
	if (res?.ok) {
		const data = await res.json();
		nowPlaying = data.nowPlaying || [];
		comingSoonMovies = data.comingSoonMovies || [];
		activeDates = data.activeDates || [];
	} else if (res) {
		console.error('Failed to fetch movies:', await res.text());
	}

	return { nowPlaying, comingSoonMovies, activeDates };
};
