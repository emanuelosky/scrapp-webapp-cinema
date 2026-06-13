export interface ShowtimeDetails {
	id: string;              // pos_show_id (id_funcion para ventaTemporal)
	time: string;            // "14:30 P.M."
	format: string;          // "SUBT 3D", "ESP 2D"
	rawTime?: string;        // "14:30:00"
	numero_funcion?: string; // Número de función en el POS (derivado de /apicomplejo/funciones)
	numero_sala?: string;    // Número de sala en el POS (derivado de /apicomplejo/funciones)
}

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
	showtimes?: string[] | ShowtimeDetails[]; // Legacy/fallback or mapped
	showtimesByDate?: Record<string, ShowtimeDetails[]>;
	releaseDate?: string;
	duration?: string;
	synopsis?: string;
	genres?: string;
}
