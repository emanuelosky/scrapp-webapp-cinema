/**
 * Maqueta del catálogo de combos.
 *
 * Estos datos salieron del arte de señalética que entrega mercadeo (los JPEG
 * en `resources-cinema/images_combo`, 1920x1080, pensados para las pantallas
 * sobre la confitería). Ahí el nombre, el contenido y el precio venían
 * quemados en la imagen; acá son texto, que es lo que permite corregir una
 * errata o un precio sin volver a pasar por diseño.
 *
 * Las fotos se sacaron de ese mismo arte con `scripts/procesar-combos.py`,
 * que recorta la mitad del producto y rellena los títulos que invadían la
 * foto. Viven en `static/img/combos/`.
 *
 * TEMPORAL. El catálogo real vive en el POS heredado y llega al intermediario
 * como JSON crudo (`legacy_catalog_cache.combos_json`), sin campo de imagen y
 * sin precio por sede. Cuando exista la tabla propia, esto se borra y
 * `fetchCombos` deja de importarlo. Nada fuera de `$lib/api` debe leer este
 * archivo.
 */

import type { Combo } from '$lib/types';

const img = (slug: string) => ({
	full: `/img/combos/${slug}-full.webp`,
	card: `/img/combos/${slug}-card.webp`,
	thumb: `/img/combos/${slug}-thumb.webp`
});

/** El texto de extras es idéntico en los cuatro combos que lo ofrecen. */
const EXTRAS = ['nachos', 'nuggets', 'pops', 'tequeños'];

/**
 * El orden es de presentación, no alfabético ni por precio: abre con los más
 * completos, que son los que mejor explican qué es un combo, y cierra con los
 * de entrada.
 */
export const COMBOS_MOCK: Combo[] = [
	{
		id: 'fantasia',
		slug: 'fantasia',
		name: 'Fantasía',
		items: ['1 cotufa mediana', '2 perros calientes', '2 refrescos medianos'],
		price: 20.99,
		image: img('fantasia'),
		featured: true
	},
	{
		id: 'accion',
		slug: 'accion',
		name: 'Acción',
		items: ['1 cotufa grande', '2 refrescos medianos', 'Ración de nuggets'],
		price: 18.99,
		image: img('accion'),
		featured: true
	},
	{
		id: 'romantico',
		slug: 'romantico',
		name: 'Romántico',
		items: ['1 cotufa grande', '2 refrescos medianos', 'Ración de tequeños'],
		price: 18.99,
		image: img('romantico'),
		featured: true
	},
	{
		id: 'protagonico',
		slug: 'protagonico',
		name: 'Protagónico',
		// El arte original dice "1 dedos de queso", que es una errata de
		// concordancia. Corregida acá; en la imagen no se podía.
		items: ['1 cotufa grande', '1 ración de dedos de queso', '2 refrescos medianos'],
		price: 18.99,
		image: img('protagonico'),
		featured: true
	},
	{
		id: 'animado',
		slug: 'animado',
		name: 'Animado',
		items: ['1 cotufa grande', '2 refrescos medianos', 'Ración de pops de pollo'],
		price: 18.99,
		image: img('animado'),
		featured: true
	},
	{
		id: 'suspenso',
		slug: 'suspenso',
		name: 'Suspenso',
		items: ['1 cotufa extra grande', '2 refrescos grandes'],
		price: 17.99,
		addons: EXTRAS,
		image: img('suspenso'),
		featured: true
	},
	{
		id: 'futurista',
		slug: 'futurista',
		name: 'Futurista',
		items: ['1 cotufa grande', '2 refrescos grandes'],
		price: 14.99,
		addons: EXTRAS,
		image: img('futurista')
	},
	{
		id: 'comedia',
		slug: 'comedia',
		name: 'Comedia',
		items: ['1 cotufa mediana', '2 refrescos medianos'],
		price: 11.49,
		addons: EXTRAS,
		image: img('comedia')
	},
	{
		id: 'drama',
		slug: 'drama',
		name: 'Drama',
		items: ['1 cotufa mediana', '1 refresco grande', '1 agua'],
		price: 10.99,
		image: img('drama')
	},
	{
		id: 'historico',
		slug: 'historico',
		name: 'Histórico',
		items: ['1 cotufa mediana', '1 refresco mediano'],
		price: 8.99,
		addons: EXTRAS,
		image: img('historico')
	}
];
