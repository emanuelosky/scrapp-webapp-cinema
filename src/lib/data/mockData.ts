import type { Movie } from '$lib/types';
import dune2Poster from '$lib/assets/posters/dune2.jpg';
import deadpoolPoster from '$lib/assets/posters/deadpool.jpg';
import insideOut2Poster from '$lib/assets/posters/insideout2.jpg';
import oppenheimerPoster from '$lib/assets/posters/oppenheimer.jpg';
import alienPoster from '$lib/assets/posters/alien.png';
import gladiatorPoster from '$lib/assets/posters/gladiator.png';
import wickedPoster from '$lib/assets/posters/wicked.png';
import moanaPoster from '$lib/assets/posters/moana.png';
import kravenPoster from '$lib/assets/posters/kraven.png';
import mufasaPoster from '$lib/assets/posters/mufasa.png';
import sonicPoster from '$lib/assets/posters/sonic.png';
import capitanPoster from '$lib/assets/posters/capitan.png';
import thunderboltsPoster from '$lib/assets/posters/thunderbolts.png';

export const comingSoonMovies: Movie[] = [
	{ id: 11, title: 'Kraven el Cazador', poster: kravenPoster, releaseDate: 'AGO 30' },
	{ id: 12, title: 'Mufasa: El Rey León', poster: mufasaPoster, releaseDate: 'SEP 15' },
	{ id: 13, title: 'Sonic 3: La Película', poster: sonicPoster, releaseDate: 'OCT 20' },
	{ id: 14, title: 'Capitán América', poster: capitanPoster, releaseDate: 'NOV 05' },
	{ id: 15, title: 'Thunderbolts*', poster: thunderboltsPoster, releaseDate: 'DIC 10' }
];

export const nowPlaying: Movie[] = [
	{ 
		id: 1, title: 'Dune: Part Two', poster: dune2Poster, 
		rating: 'B', 
		formats: { video: '2D', audio: 'ATMOS', language: 'SUBTITULADO' },
		showtimes: ['03:15 P.M.', '06:45 P.M.', '09:30 P.M.']
	},
	{ 
		id: 2, title: 'Deadpool & Wolverine', poster: deadpoolPoster, 
		label: 'ESTRENO',
		rating: 'C', 
		formats: { video: '3D', audio: 'DOLBY 7.1', language: 'ESPAÑOL' },
		showtimes: ['02:25 P.M.', '04:35 P.M.', '07:15 P.M.']
	},
	{ 
		id: 3, title: 'Inside Out 2', poster: insideOut2Poster, 
		rating: 'AA', 
		formats: { video: '2D', audio: 'DOLBY 7.1', language: 'ESPAÑOL' },
		showtimes: ['01:00 P.M.', '03:15 P.M.', '05:30 P.M.']
	},
	{ 
		id: 4, title: 'Alien: Romulus', poster: alienPoster, 
		label: 'PREVENTA',
		rating: 'D', 
		formats: { video: '2D', audio: 'ATMOS', language: 'SUBTITULADO' },
		showtimes: ['08:00 P.M.', '10:30 P.M.']
	},
	{ 
		id: 5, title: 'Oppenheimer', poster: oppenheimerPoster, 
		rating: 'B', 
		formats: { video: '2D', audio: 'DOLBY 7.1', language: 'SUBTITULADO' },
		showtimes: ['04:00 P.M.', '08:15 P.M.']
	},
	{ 
		id: 6, title: 'Gladiator II', poster: gladiatorPoster, 
		rating: 'C', 
		formats: { video: '2D', audio: 'ATMOS', language: 'SUBTITULADO' },
		showtimes: ['01:00 P.M.', '02:30 P.M.', '04:15 P.M.', '05:00 P.M.', '06:00 P.M.', '07:30 P.M.', '08:30 P.M.', '10:45 P.M.']
	},
	{ 
		id: 7, title: 'Wicked', poster: wickedPoster, 
		rating: 'AA', 
		formats: { video: '3D', audio: 'DOLBY 7.1', language: 'ESPAÑOL' },
		showtimes: ['11:00 A.M.', '02:00 P.M.', '05:00 P.M.']
	},
	{ 
		id: 8, title: 'Moana 2: Aventura sin límites por el mar de la vida', poster: moanaPoster, 
		rating: 'A', 
		formats: { video: '2D', audio: 'DOLBY 7.1', language: 'ESPAÑOL' },
		showtimes: ['10:30 A.M.', '01:15 P.M.', '03:45 P.M.', '06:15 P.M.', '08:45 P.M.']
	}
].sort((a, b) => {
	const rank = (label?: string) => {
		if (label === 'PREVENTA') return 1;
		if (label === 'ESTRENO') return 2;
		return 3;
	};
	return rank(a.label) - rank(b.label);
});
