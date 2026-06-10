export interface Movie {
	id: string | number;
	title: string;
	poster: string;
	label?: string;
	rating?: string;
	formats?: {
		video: string;
		audio: string;
		language: string;
	};
	showtimes?: string[];
	releaseDate?: string;
	duration?: string;
	synopsis?: string;
	genres?: string;
}
