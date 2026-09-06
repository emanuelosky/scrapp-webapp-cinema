import { error } from '@sveltejs/kit';
import { cinemaState } from '$lib/state/cinema.svelte';
import type { Movie } from '$lib/types';

export const load = async ({ fetch, params }) => {
    const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5174';
    const sede = params.sede;

    let nowPlaying: Movie[] = [];
    let comingSoonMovies: Movie[] = [];
    let activeDates: string[] = [];

    // Las dos peticiones arrancan a la vez: validar el slug contra el catálogo
    // de sedes y traer la cartelera son independientes. Encadenarlas sumaba el
    // viaje a Supabase al de la API antes de pintar nada.
    const catalogReady = cinemaState.init();
    const moviesReq = fetch(`${API_URL}/api/v1/movies?location_id=${sede}`).catch((e) => {
        console.error('Network error fetching movies:', e);
        return null;
    });

    // Un slug inventado (/cines/loquesea) devolvía catálogo vacío y además
    // escribía "Loquesea" como sede activa en el header global. Cortamos acá.
    // Solo validamos si el catálogo cargó: si Supabase no respondió preferimos
    // seguir y mostrar la sede vacía antes que un 404 falso por caída de red.
    await catalogReady;
    if (cinemaState.cinemas.length > 0 && !cinemaState.isKnownCinema(sede)) {
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
}
