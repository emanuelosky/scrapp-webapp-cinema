import { supabase } from '$lib/supabase';
import type { Movie, ShowtimeDetails } from '$lib/types';
import { getTodayDateString, getCinemaToday } from '$lib/utils/timezone';

interface Showtime {
    id: string;
    movie_id: string;
    show_date: string;
    show_time: string;
    language: string;
    dimension: string;
    pos_show_id: string;
    numero_funcion: string | null;
    numero_sala: string | null;
    room_name: string | null;
}

export async function load() {
    // 1. Fetch all movies (so we can map child entries to active mothers)
    const { data: movies, error: moviesError } = await supabase
        .from('wbpp_movies')
        .select('*');

    if (moviesError || !movies) {
        console.error('Error fetching movies:', moviesError);
        return { nowPlaying: [], comingSoonMovies: [] };
    }

    // Map each child movie to its mother ID
    const childToMother = new Map<string, string>();
    for (const m of movies) {
        if (m.grouped_ids && m.grouped_ids.length > 0) {
            for (const childId of m.grouped_ids) {
                childToMother.set(childId, m.id);
            }
        }
    }

    // 2. Fetch active showtimes (include show_date for filtering by date)
    const { data: showtimes, error: showtimesError } = await supabase
        .from('wbpp_showtimes')
        .select('id, movie_id, show_date, show_time, language, dimension, pos_show_id, numero_funcion, numero_sala, room_name')
        .eq('is_active', true);

    if (showtimesError) {
        console.error('Error fetching showtimes:', showtimesError);
    }

    // Group showtimes by mother ID if child, otherwise movie_id
    const showtimesByMovie: Record<string, Showtime[]> = {};
    if (showtimes) {
        for (const show of showtimes) {
            const effectiveMovieId = childToMother.get(show.movie_id) || show.movie_id;
            if (!showtimesByMovie[effectiveMovieId]) {
                showtimesByMovie[effectiveMovieId] = [];
            }
            showtimesByMovie[effectiveMovieId].push(show as unknown as Showtime);
        }
    }

    const todayStr = getTodayDateString();

    const nowPlaying: Movie[] = [];
    const comingSoonMovies: Movie[] = [];
    const activeDatesSet = new Set<string>();

    // Filter to only display ACTIVE top-level movies (mothers or ungrouped raws)
    const displayMovies = movies.filter(m => !childToMother.has(m.id) && m.status === 'active');

    for (const m of displayMovies) {
        const movieShows = showtimesByMovie[m.id] || [];
        interface LocalShowtimeDetails extends ShowtimeDetails {
            rawTime: string;
        }
        const showsByDateMap: Record<string, LocalShowtimeDetails[]> = {};

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
            
            // Format language & dimension
            let videoStr = '2D';
            let langStr = 'ESP';
            if (s.dimension === '4DX') videoStr = '4DX';
            else if (s.dimension === 'IMAX') videoStr = 'IMAX';
            else if (s.dimension === '3D') videoStr = '3D';
            
            if (s.language === 'SUB') langStr = 'SUBT';
            else if (s.language === 'DUBBED') langStr = 'DOB';
            
            const formatStr = `${langStr} ${videoStr}`;

            const showtimeDetails: LocalShowtimeDetails = {
                id: s.pos_show_id || s.id, // pos_show_id es el id de la función en el POS legacy. Si falla usa el uuid.
                time: timeStr,
                format: formatStr,
                rawTime: s.show_time, // for sorting
                numero_funcion: s.numero_funcion ?? undefined,
                numero_sala: s.numero_sala ?? undefined
            };

            // Avoid duplicates
            const exists = showsByDateMap[s.show_date].find(x => x.id === showtimeDetails.id || (x.time === showtimeDetails.time && x.format === showtimeDetails.format));
            if (!exists) {
                showsByDateMap[s.show_date].push(showtimeDetails);
            }
            activeDatesSet.add(s.show_date);
        }

        for (const date in showsByDateMap) {
            showsByDateMap[date].sort((a, b) => a.rawTime.localeCompare(b.rawTime));
        }

        // --- Compute label ---
        let label: string | undefined;
        
        const releaseDate = m.release_date ? new Date(m.release_date + 'T00:00:00') : null;
        const presaleDate = m.presale_date ? new Date(m.presale_date + 'T00:00:00') : null;
        const hasShowtimes = movieShows.length > 0;
        const today = getCinemaToday();

        if (m.genres && Array.isArray(m.genres) && m.genres.includes('EVENTO')) {
            label = 'EVENTO';
        } else {
            if (releaseDate) {
                const diffTime = releaseDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (hasShowtimes) {
                    if (diffDays > 0) {
                        if (!presaleDate || today >= presaleDate) {
                            label = 'PREVENTA';
                        }
                    } else if (diffDays >= -7) {
                        label = 'ESTRENO';
                    }
                }
            }
        }

        // Parse legacy format for cards (using the first showtime's dimension/lang as primary)
        let primaryVideo = '2D';
        let primaryLang = 'ESPAÑOL';
        if (movieShows.length > 0) {
            const firstShow = movieShows[0];
            if (firstShow.dimension === '4DX') primaryVideo = '4DX';
            else if (firstShow.dimension === 'IMAX') primaryVideo = 'IMAX';
            else if (firstShow.dimension === '3D') primaryVideo = '3D';
            if (firstShow.language === 'SUB') primaryLang = 'SUBTITULADO';
            else if (firstShow.language === 'DUBBED') primaryLang = 'DOBLADA';
        }

        const formattedMovie: Movie = {
            id: m.id,
            title: m.title,
            poster: m.poster_url || '/placeholder.png',
            banner: m.backdrop_url || undefined,
            synopsis: m.synopsis,
            duration: m.duration_mins ? `${Math.floor(m.duration_mins / 60)} HR ${String(m.duration_mins % 60).padStart(2, '0')} MIN` : undefined,
            genres: m.genres,
            rating: m.rating,
            label,
            releaseDate: m.release_date ?? undefined,
            formats: {
                video: primaryVideo,
                audio: 'ESTÁNDAR',
                language: primaryLang
            },
            showtimes: (showsByDateMap[todayStr] || []).map(s => s.time), // Fallback legacy
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

    // Sort comingSoonMovies by releaseDate ascending
    comingSoonMovies.sort((a, b) => {
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
    });

    const activeDates = Array.from(activeDatesSet).sort();

    return { nowPlaying, comingSoonMovies, activeDates };
}
