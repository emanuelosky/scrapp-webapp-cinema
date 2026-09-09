export interface ShowtimeDetails {
	id: string;              // pos_show_id (id_funcion para ventaTemporal)
	time: string;            // "14:30 P.M."
	format: string;          // "SUBT 3D", "ESP 2D"
	rawTime?: string;        // "14:30:00"
	numero_funcion?: string; // Número de función en el POS (derivado de /apicomplejo/funciones)
	numero_sala?: string;    // Número de sala en el POS (derivado de /apicomplejo/funciones)
}

/**
 * Tamaños de una misma imagen (póster o banner).
 *
 * Solo `full` es obligatorio. Los otros dos son una OPTIMIZACIÓN que el
 * backend puede o no ofrecer, y la webapp tiene que funcionar igual sin ellos
 * -- ver `src/lib/api/CONTRATO-BACKEND.md`. Un backend como Vista
 * probablemente entregue una sola imagen, en el formato y la calidad que él
 * decida; en ese caso se pierde el destape progresivo, no la página.
 */
export interface ImageVariants {
	/** ~160 px de ancho. Relleno desenfocado mientras baja la grande, y fuente
	 *  de los fondos decorativos (que se pintan con blur y no necesitan más). */
	thumb?: string;
	/** ~400 px. Tarjetas y carruseles. */
	card?: string;
	/** La buena, a resolución completa. Lo único que el backend DEBE dar. */
	full: string;
}

export interface Movie {
	id: string | number;
	title: string;
	poster: string;
	banner?: string;
	/** Tamaños alternativos del póster, si el backend los provee. Ver ImageVariants. */
	posterSizes?: ImageVariants;
	/** Tamaños alternativos del banner, si el backend los provee. */
	bannerSizes?: ImageVariants;
	trailerAssetUrl?: string;   // Clip propio auto-alojado (vertical, silencioso, loop) — cuando exista
	trailerYoutubeUrl?: string; // Enlace del tráiler oficial en YouTube (fallback, se abre en pestaña nueva)
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
	genres?: string[];
}

export interface PromoBanner {
	id: string;
	name: string;
	message: string;
	bg_color_class: string;
	text_color_class: string;
	icon: string;
	is_active: boolean;
	days_of_week: number[];
	start_time: string;
	end_time: string;
}

/**
 * Una sede. `timezone` es identificador IANA (ej. 'America/Caracas'): todas
 * las sedes de hoy están en Venezuela, pero "hoy" / "esta función ya pasó"
 * debe resolverse contra la hora de PARED de la sede, no la del navegador del
 * visitante ni una constante global -- así una sede en otro país no hereda el
 * huso de otra.
 */
export interface CinemaLocation {
	id: string;
	name: string;
	short_name: string | null;
	city: string | null;
	latitude: number | null;
	longitude: number | null;
	is_active: boolean;
	timezone: string;
}
