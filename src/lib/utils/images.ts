import type { ImageVariants } from '$lib/types';

/**
 * Resolución de imágenes con degradación.
 * =======================================
 *
 * La webapp necesita, idealmente, tres tamaños de cada póster y cada banner:
 * una miniatura, uno de tarjeta y el grande. Con los tres puede mostrar el
 * relleno desenfocado mientras baja la imagen buena, y puede pedir solo la
 * miniatura para los fondos decorativos (que igual se pintan con desenfoque).
 *
 * Pero **el backend de producción no está decidido**, y no todos pueden dar
 * eso. Este módulo resuelve tres escenarios, de mejor a peor, sin que ningún
 * componente tenga que saber cuál está activo:
 *
 *  1. **El backend entrega los tamaños.** Es lo que se le va a pedir (ver
 *     `src/lib/api/CONTRATO-BACKEND.md`). Se usan tal cual.
 *
 *  2. **La URL es de TMDB.** Situación de HOY, y transitoria: TMDB sirve la
 *     misma imagen en varios tamaños cambiando un segmento de la ruta, así que
 *     los tamaños se derivan. Cuando las imágenes se muden al almacenamiento
 *     propio, esta rama deja de aplicar sola, sin romper nada.
 *
 *  3. **Una sola URL, de origen desconocido.** El caso a asumir si el cliente
 *     adopta Vista: una imagen, en el formato y calidad que ellos decidan. Se
 *     muestra esa y punto. Se pierde el destape progresivo; no se pierde la
 *     página.
 */

const TMDB_SIZED = /^(https:\/\/image\.tmdb\.org\/t\/p\/)([^/]+)(\/.+)$/;

/**
 * Cambia el tamaño de una URL de TMDB (`/t/p/original/x.jpg` →
 * `/t/p/w185/x.jpg`). Devuelve la URL sin tocar si no es de TMDB.
 *
 * Transitoria: solo sirve mientras el catálogo guarde URLs de TMDB. No la
 * llames desde un componente -- usa `imageVariants` o `blurSource`, que ya
 * contemplan los tres escenarios.
 */
export function tmdbSize(url: string | undefined | null, size: string): string | undefined {
	if (!url) return undefined;
	const m = url.match(TMDB_SIZED);
	if (!m) return url;
	return `${m[1]}${size}${m[3]}`;
}

/**
 * Los tamaños disponibles para una imagen, resolviendo los tres escenarios.
 *
 * @param url       La imagen tal como la guarda el catálogo (el tamaño grande).
 * @param provided  Los tamaños que dio el backend, si dio alguno.
 * @param tmdbHint  Qué tamaño de TMDB usar como miniatura mientras siga siendo
 *                  TMDB. `w185` va bien para pósters; para banners, `w300`.
 */
export function imageVariants(
	url: string | undefined | null,
	provided?: ImageVariants,
	tmdbHint = 'w185'
): ImageVariants | null {
	if (provided?.full) {
		return { full: provided.full, card: provided.card ?? provided.full, thumb: provided.thumb };
	}
	if (!url) return null;

	const isTmdb = TMDB_SIZED.test(url);
	if (isTmdb) {
		return { full: url, card: tmdbSize(url, 'w500'), thumb: tmdbSize(url, tmdbHint) };
	}
	// Escenario 3: una sola imagen. Sin `thumb`, quien la use sabe que no hay
	// relleno progresivo que mostrar.
	return { full: url };
}

/**
 * Miniatura para el destape progresivo. `undefined` significa "no hay", y el
 * componente debe comportarse como una imagen normal.
 */
export function imageThumb(
	url: string | undefined | null,
	provided?: ImageVariants,
	tmdbHint = 'w185'
): string | undefined {
	return imageVariants(url, provided, tmdbHint)?.thumb;
}

/**
 * Fuente para un fondo DECORATIVO (los que ya se pintan con `blur-2xl` y
 * similares). Prefiere la miniatura -- nadie nota la resolución de una imagen
 * desenfocada, y evita bajar varios MB para borronearlos -- pero cae a la
 * imagen completa si no hay miniatura, porque acá sí hace falta pintar algo.
 */
export function blurSource(
	url: string | undefined | null,
	provided?: ImageVariants,
	tmdbHint = 'w185'
): string | undefined {
	const v = imageVariants(url, provided, tmdbHint);
	return v?.thumb ?? v?.full;
}
