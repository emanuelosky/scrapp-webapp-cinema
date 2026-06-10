import { supabase } from '$lib/supabase';
import type { Movie } from '$lib/types';

interface Showtime {
    movie_id: string;
    show_date: string;
    show_time: string;
    language_format: string;
}

export async function load() {
    // 1. Fetch all movies (so we can map inactive children to active parents)
    const { data: movies, error: moviesError } = await supabase
        .from('wbpp_movies')
        .select('*');

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
    const activeDatesSet = new Set<string>();

    // Filter to only display ACTIVE parent movies at top level
    const displayMovies = movies.filter(m => !m.parent_id && m.is_active);

    for (const m of displayMovies) {
        const movieShows = showtimesByMovie[m.id] || [];
        const showsByDateMap: Record<string, string[]> = {};

        // Populate showsByDateMap and activeDatesSet
        for (const s of movieShows) {
            if (!showsByDateMap[s.show_date]) {
                showsByDateMap[s.show_date] = [];
            }
            // Format time
            const [hStr, mStr] = s.show_time.split(':');
            let h = parseInt(hStr, 10);
            const ampm = h >= 12 ? 'P.M.' : 'A.M.';
            h = h % 12;
            if (h === 0) h = 12;
            const timeStr = `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
            
            if (!showsByDateMap[s.show_date].includes(timeStr)) {
                showsByDateMap[s.show_date].push(timeStr);
            }
            activeDatesSet.add(s.show_date);
        }

        for (const date in showsByDateMap) {
            showsByDateMap[date].sort();
        }

        // --- Compute label ---
        let label: string | undefined;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const presaleDate = m.presale_date ? new Date(m.presale_date) : null;
        const releaseDate = m.release_date ? new Date(m.release_date) : null;

        if (m.status_label && m.status_label !== 'AUTOMATICO') {
            // Manual override from admin
            label = m.status_label === 'NINGUNO' ? undefined : m.status_label;
        } else {
            // Auto logic based on dates
            if (presaleDate && releaseDate && today >= presaleDate && today < releaseDate) {
                label = 'PREVENTA';
            } else if (releaseDate) {
                const daysSinceRelease = Math.floor((today.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceRelease >= 0 && daysSinceRelease <= 14) {
                    label = 'ESTRENO';
                }
            }
        }

        // --- Collect today's showtimes only for fallback/default display ---
        const todayShows = showsByDateMap[todayStr] || [];
        const formattedTimes = todayShows.length > 0 ? todayShows : (Object.values(showsByDateMap)[0] || []);

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
            duration: m.duration_mins ? `${Math.floor(m.duration_mins / 60)} HR ${String(m.duration_mins % 60).padStart(2, '0')} MIN` : undefined,
            genres: m.genres,
            rating: m.rating,
            label,
            releaseDate: m.release_date ?? undefined,
            formats: {
                video: videoStr,
                audio: 'ESTÁNDAR',
                language: langStr
            },
            showtimes: formattedTimes,
            showtimesByDate: showsByDateMap
        };

        // Categorize: nowPlaying if has active showtimes or is already released, comingSoon if future release
        const isFutureRelease = releaseDate && releaseDate > today;
        const isPresale = label === 'PREVENTA';

        if (movieShows.length > 0) {
            nowPlaying.push(formattedMovie);
        } else if (isPresale || isFutureRelease) {
            comingSoonMovies.push(formattedMovie);
        } else {
            nowPlaying.push(formattedMovie);
        }
    }

    // Sort nowPlaying: PREVENTA first, then ESTRENO, then rest
    const labelRank = (lbl?: string) => {
        if (lbl === 'PREVENTA') return 0;
        if (lbl === 'ESTRENO') return 1;
        return 2;
    };
    nowPlaying.sort((a, b) => labelRank(a.label) - labelRank(b.label));

    const activeDates = Array.from(activeDatesSet).sort();

    return { nowPlaying, comingSoonMovies, activeDates };
}
