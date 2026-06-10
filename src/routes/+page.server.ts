import { supabase } from '$lib/supabase';
import type { Movie } from '$lib/types';

interface Showtime {
    movie_id: string;
    show_date: string;
    show_time: string;
    language_format: string;
}

export async function load() {
    // 1. Fetch active movies
    const { data: movies, error: moviesError } = await supabase
        .from('wbpp_movies')
        .select('*')
        .eq('is_active', true);

    if (moviesError || !movies) {
        console.error('Error fetching movies:', moviesError);
        return { nowPlaying: [], comingSoonMovies: [] };
    }

    // Map each child movie to its parent ID
    const childToParent = new Map<string, string>();
    for (const m of movies) {
        if (m.parent_id) {
            childToParent.set(m.id, m.parent_id);
        }
    }

    // 2. Fetch active showtimes (include show_date for filtering by date)
    const { data: showtimes, error: showtimesError } = await supabase
        .from('wbpp_showtimes')
        .select('movie_id, show_date, show_time, language_format')
        .eq('is_active', true);

    if (showtimesError) {
        console.error('Error fetching showtimes:', showtimesError);
    }

    // Group showtimes by parent ID if child, otherwise movie_id
    const showtimesByMovie: Record<string, Showtime[]> = {};
    if (showtimes) {
        for (const show of showtimes) {
            const effectiveMovieId = childToParent.get(show.movie_id) || show.movie_id;
            if (!showtimesByMovie[effectiveMovieId]) {
                showtimesByMovie[effectiveMovieId] = [];
            }
            showtimesByMovie[effectiveMovieId].push(show);
        }
    }

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const nowPlaying: Movie[] = [];
    const comingSoonMovies: Movie[] = [];

    // Filter to only display parent movies at top level
    const displayMovies = movies.filter(m => !m.parent_id);

    for (const m of displayMovies) {
        const movieShows = showtimesByMovie[m.id] || [];

        // --- Compute label ---
        let label: string | undefined;

        if (m.status_label && m.status_label !== 'AUTOMATICO') {
            // Manual override from admin
            label = m.status_label === 'NINGUNO' ? undefined : m.status_label;
        } else {
            // Auto logic based on dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const presaleDate = m.presale_date ? new Date(m.presale_date) : null;
            const releaseDate = m.release_date ? new Date(m.release_date) : null;

            if (presaleDate && releaseDate && today >= presaleDate && today < releaseDate) {
                label = 'PREVENTA';
            } else if (releaseDate) {
                const daysSinceRelease = Math.floor((today.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceRelease >= 0 && daysSinceRelease <= 14) {
                    label = 'ESTRENO';
                }
            }
        }

        // --- Collect today's showtimes only for display ---
        const todayShows = movieShows.filter((s: Showtime) => s.show_date === todayStr);
        const displayShows = todayShows.length > 0 ? todayShows : movieShows;

        // Remove duplicate times and format (HH:MM:SS -> HH:MM AM/PM)
        const uniqueTimes = [...new Set(displayShows.map((s: Showtime) => s.show_time))];
        const formattedTimes = uniqueTimes.map((t: string) => {
            const [hStr, mStr] = t.split(':');
            let h = parseInt(hStr, 10);
            const ampm = h >= 12 ? 'P.M.' : 'A.M.';
            h = h % 12;
            if (h === 0) h = 12;
            return `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
        });

        // --- Parse format from POS (first available showtime) ---
        let videoStr = '2D';
        let langStr = 'ESPAÑOL';
        if (movieShows.length > 0) {
            const fmt = movieShows[0].language_format.toUpperCase();
            if (fmt.includes('ATMOS')) videoStr = 'ATMOS';
            else if (fmt.includes('IMAX')) videoStr = 'IMAX';
            else if (fmt.includes('4D')) videoStr = '4DX';
            else if (fmt.includes('3D')) videoStr = '3D';
            if (fmt.includes('SUB')) langStr = 'SUBTITULADO';
            else if (fmt.includes('ESP')) langStr = 'ESPAÑOL';
        }

        const formattedMovie: Movie = {
            id: m.id,
            title: m.title,
            poster: m.poster_url || '/placeholder.png',
            synopsis: m.synopsis,
            duration: m.duration_mins ? `${m.duration_mins} min` : undefined,
            genres: m.genres,
            rating: m.rating,
            label,
            releaseDate: m.release_date ?? undefined,
            formats: {
                video: videoStr,
                audio: 'ESTÁNDAR',
                language: langStr
            },
            showtimes: formattedTimes.sort()
        };

        // Categorize: nowPlaying if has active showtimes, else comingSoon
        if (movieShows.length > 0) {
            nowPlaying.push(formattedMovie);
        } else {
            comingSoonMovies.push(formattedMovie);
        }
    }

    // Sort nowPlaying: PREVENTA first, then ESTRENO, then rest
    const labelRank = (lbl?: string) => {
        if (lbl === 'PREVENTA') return 0;
        if (lbl === 'ESTRENO') return 1;
        return 2;
    };
    nowPlaying.sort((a, b) => labelRank(a.label) - labelRank(b.label));

    return { nowPlaying, comingSoonMovies };
}
