import { error } from '@sveltejs/kit';
import { fetchCartelera } from '$lib/api';
import { cinemaState } from '$lib/state/cinema.svelte';

// Mismo patrón que `cines/[sede]/+page.ts`: verificar el catálogo y traer la
// cartelera arrancan en paralelo, y solo esperamos la verificación (para
// poder devolver 404 en un slug inventado) antes de confiar en la respuesta.
export const load = async ({ fetch, params }) => {
	const sede = params.sede;

	const catalogReady = cinemaState.verifyCatalog(fetch);
	const carteleraReq = fetchCartelera(sede, fetch);

	await catalogReady;
	if (cinemaState.catalogStatus !== 'error' && !cinemaState.isKnownCinema(sede)) {
		error(404, `No encontramos el cine "${sede}".`);
	}

	const { nowPlaying, comingSoonMovies, activeDates } = await carteleraReq;

	return { nowPlaying, comingSoonMovies, activeDates };
};
