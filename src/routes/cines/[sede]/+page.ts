import { error } from '@sveltejs/kit';
import { fetchCartelera, fetchCombos } from '$lib/api';
import { cinemaState } from '$lib/state/cinema.svelte';

export const load = async ({ fetch, params }) => {
    const sede = params.sede;

    // Las dos peticiones arrancan a la vez: verificar el catálogo de sedes y
    // traer la cartelera son independientes. Encadenarlas sumaba el viaje a
    // Supabase al de la API antes de pintar nada.
    const catalogReady = cinemaState.verifyCatalog(fetch);
    const carteleraReq = fetchCartelera(sede, fetch);
    // Los combos no dependen de nada de lo anterior; que arranquen ya.
    const combosReq = fetchCombos(sede, fetch);

    // Un slug inventado (/cines/loquesea) devolvía catálogo vacío y además
    // escribía "Loquesea" como sede activa en el header global. Cortamos acá.
    // ESPERAMOS la verificación a propósito: soltar un 404 contra la semilla
    // del bundle rechazaría el link de una sede nueva que sí existe en la base
    // pero todavía no está en el último deploy.
    await catalogReady;
    if (cinemaState.catalogStatus !== 'error' && !cinemaState.isKnownCinema(sede)) {
        error(404, `No encontramos el cine "${sede}".`);
    }

    const { nowPlaying, comingSoonMovies, activeDates } = await carteleraReq;
    const combos = await combosReq;

    return { nowPlaying, comingSoonMovies, activeDates, combos };
}
