import type { Movie } from '$lib/types';

export const load = async ({ fetch, params }) => {
    const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5174';
    const sede = params.sede;
    
    let nowPlaying: Movie[] = [];
    let comingSoonMovies: Movie[] = [];
    let activeDates: string[] = [];

    try {
        const res = await fetch(`${API_URL}/api/v1/movies?location_id=${sede}`);
        if (res.ok) {
            const data = await res.json();
            nowPlaying = data.nowPlaying || [];
            comingSoonMovies = data.comingSoonMovies || [];
            activeDates = data.activeDates || [];
        } else {
            console.error('Failed to fetch movies:', await res.text());
        }
    } catch (e) {
        console.error('Network error fetching movies:', e);
    }

    return { nowPlaying, comingSoonMovies, activeDates };
}
