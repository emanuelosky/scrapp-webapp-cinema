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

// --- Confitería -----------------------------------------------------------
//
// Hoy estos datos son una maqueta (`$lib/data/*.mock.ts`) que entra por
// `$lib/api`. El catálogo real vive en el POS heredado y todavía no tiene
// tabla propia ni campo de imagen; cuando la tenga, cambia la fuente, no
// estos tipos. Ver `src/lib/api/CONTRATO-BACKEND.md`.

/**
 * Un combo de confitería.
 *
 * `name` es solo el apellido -- "Acción", "Romántico" -- porque la palabra
 * "COMBO" la pone la interfaz. Así el nombre no se repite dentro de la
 * tarjeta, que ya lleva el rótulo.
 *
 * `items` viene como líneas sueltas, tal cual las redacta mercadeo
 * ("1 cotufa grande"), y no como cantidades estructuradas: el POS sí modela
 * el combo como entidad compuesta, pero lo que se le muestra al visitante es
 * el texto comercial, que no siempre coincide con la receta interna.
 */
export interface Combo {
	id: string;
	slug: string;
	name: string;
	items: string[];
	/** Precio de referencia en dólares. Ver `formatRef` en `$lib/utils/price`. */
	price: number;
	/** Extras que el combo admite ("nachos, nuggets, pops y/o tequeños"). */
	addons?: string[];
	image: ImageVariants;
	/** Se destaca en la vitrina del home de sede. */
	featured?: boolean;
}

export interface MenuProduct {
	id: string;
	name: string;
	description?: string;
	price: number;
	/** Tamaños disponibles, si el producto se vende en varios. */
	sizes?: { label: string; price: number }[];
}

export interface MenuCategory {
	id: string;
	name: string;
	tagline?: string;
	products: MenuProduct[];
}

/** Un paso del armador de combos: elegí uno de `options`. */
export interface ComboStep {
	id: string;
	title: string;
	hint?: string;
	/** Sin selección no se puede avanzar. Los pasos opcionales se pueden saltar. */
	required: boolean;
	options: ComboOption[];
}

export interface ComboOption {
	id: string;
	name: string;
	/** Cuánto suma al total. Puede ser 0 (incluido) y nunca es negativo. */
	price: number;
}

/**
 * Promociones y coleccionables comparten página porque en la práctica nunca
 * hay muchos de ninguno de los dos: dos rejillas casi vacías se ven peor que
 * una sola con contenido.
 */
export interface Promocion {
	id: string;
	kind: 'promocion' | 'coleccionable';
	title: string;
	description: string;
	price?: number;
	/** Texto legal o condición, en letra chica. */
	terms?: string;
	/** Mientras no haya arte propio, la tarjeta se resuelve tipográficamente. */
	image?: ImageVariants;
}
