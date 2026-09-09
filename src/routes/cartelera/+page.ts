import { fetchCartelera } from '$lib/api';
import { cinemaState } from '$lib/state/cinema.svelte';

// Punto de entrada a la cartelera sin sede elegida todavía. No agrega el
// catálogo de TODAS las sedes en una sola lista -- se quitó: mezclar horarios
// de dos cines en la misma tarjeta es un riesgo real (alguien lee rápido,
// compra en Lido, se presenta en Candelaria). Se comporta como
// /cines/[sede]/cartelera con una sede elegida automáticamente.
//
// La cartelera se pide ACÁ y no en un $effect del componente. Antes vivía allá
// y eso encadenaba: navegar -> bajar el JS -> montar -> recién ahí empezar la
// petición. Un `load()` arranca durante la navegación, en paralelo con la
// descarga del código de la página, y además permite que
// `data-sveltekit-preload-data="hover"` la adelante cuando el visitante pasa
// el mouse por el enlace. Era el motivo de que /cartelera tardara bastante más
// en abrir que /cines/[sede]/cartelera, que sí tenía load().
export const load = async ({ fetch, depends }) => {
	depends('app:cinemas');

	// Sin await a propósito: la semilla del bundle ya alcanza para resolver la
	// sede, y la verificación contra el backend corre en paralelo.
	cinemaState.verifyCatalog(fetch);

	const sedeId = cinemaState.defaultCinemaId();
	if (!sedeId) {
		return { sedeId: null, nowPlaying: [], comingSoonMovies: [], activeDates: [] };
	}

	return { sedeId, ...(await fetchCartelera(sedeId, fetch)) };
};
