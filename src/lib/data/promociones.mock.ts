/**
 * Maqueta de promociones y coleccionables.
 *
 * TEMPORAL. Sin arte propio todavía: las tarjetas se resuelven
 * tipográficamente y el tipo `Promocion` deja `image` opcional justamente
 * para que eso no sea un caso especial cuando lleguen las fotos.
 */

import type { Promocion } from '$lib/types';

export const PROMOCIONES_MOCK: Promocion[] = [
	{
		id: 'martes',
		kind: 'promocion',
		title: 'Martes de dos por uno',
		description:
			'Dos entradas al precio de una, todos los martes, en todas las funciones de la sede.',
		terms: 'No acumulable con otras promociones. No aplica en días feriados ni preestrenos.'
	},
	{
		id: 'combo-cumple',
		kind: 'promocion',
		title: 'Tu cumpleaños es cotufa gratis',
		description:
			'Muestra tu cédula el día de tu cumpleaños y la cotufa mediana va por cuenta de la casa.',
		terms: 'Una por persona. Solo el día exacto, no la semana.'
	},
	{
		id: 'matine',
		kind: 'promocion',
		title: 'Matiné',
		description: 'Todas las funciones antes de las 3:00 p.m. a precio reducido.',
		price: 4.99,
		terms: 'Aplica de lunes a viernes.'
	},
	{
		id: 'vaso-coleccion',
		kind: 'coleccionable',
		title: 'Vaso de colección',
		description:
			'Vaso rígido CINEPIC del estreno del mes. Mientras dure la existencia, y nunca dura.',
		price: 12.99
	},
	{
		id: 'balde-edicion',
		kind: 'coleccionable',
		title: 'Balde edición especial',
		description: 'El balde grande con el arte de la película. Rellenos a mitad de precio, siempre.',
		price: 15.99
	}
];
