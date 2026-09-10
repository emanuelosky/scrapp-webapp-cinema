/**
 * Fotos de ambiente por sede.
 *
 * No son publicidad: son fotos de gente en el cine, y en varias aparece la
 * bandeja CINEPIC. Sirven para que una sección de producto no se lea como una
 * lista de precios.
 *
 * Cada sede tiene las suyas y no son intercambiables -- Lido es bar y sala
 * roja, Candelaria es el cine masivo -- así que usar la de una en la otra
 * sería mentir sobre el local.
 *
 * TEMPORAL, como el resto de `$lib/data`. Las fotos de una sede deberían
 * viajar con la sede (`CinemaLocation`) cuando el backend las tenga; hoy
 * `/api/v1/locations` no devuelve ninguna imagen.
 *
 * Originales en `resources-cinema/mas_imagenes_{candelaria,lido}`, convertidas
 * a WebP en `static/img/sedes/`.
 */

import type { ImageVariants } from '$lib/types';

const foto = (nombre: string): ImageVariants => ({
	full: `/img/sedes/${nombre}-full.webp`,
	thumb: `/img/sedes/${nombre}-thumb.webp`
});

/**
 * La primera de cada lista es la que se usa junto a los combos, y por eso son
 * las dos en las que se ve el producto en manos de alguien.
 */
const POR_SEDE: Record<string, ImageVariants[]> = {
	candelaria: [foto('candelaria-3'), foto('candelaria-1'), foto('candelaria-2'), foto('candelaria-4')],
	lido: [foto('lido-3'), foto('lido-2'), foto('lido-1')]
};

/**
 * Foto de ambiente de una sede. `indice` permite pedir la segunda o la
 * tercera; se ajusta al rango en vez de devolver nada, porque el llamador la
 * usa como decoración y un hueco se vería peor que repetir.
 */
export function fotoSede(sede: string | undefined, indice = 0): ImageVariants | null {
	const lista = sede ? POR_SEDE[sede] : undefined;
	if (!lista?.length) return null;
	return lista[indice % lista.length];
}
