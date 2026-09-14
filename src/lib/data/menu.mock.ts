/**
 * Maqueta del menú de confitería y del armador de combos.
 *
 * TEMPORAL, igual que `combos.mock.ts`: los precios de acá son inventados
 * para poder maquetar. Los reales viven dentro de `productos_json` en el
 * caché del POS y todavía no hay endpoint que los entregue con imagen ni
 * precio por sede. Nada fuera de `$lib/api` debe leer este archivo.
 */

import type { ComboStep, MenuCategory } from '$lib/types';

export const MENU_MOCK: MenuCategory[] = [
	{
		id: 'cotufas',
		name: 'Cotufas',
		tagline: 'Recién hechas, todo el día',
		products: [
			{
				id: 'cotufa-mantequilla',
				name: 'Cotufa con mantequilla',
				description: 'La de siempre. La que hace que la película empiece.',
				price: 5.99,
				sizes: [
					{ label: 'Mediana', price: 5.99 },
					{ label: 'Grande', price: 7.49 },
					{ label: 'Extra grande', price: 8.99 }
				]
			},
			{
				id: 'cotufa-caramelo',
				name: 'Cotufa acaramelada',
				description: 'Dulce, crocante y peligrosamente fácil de terminar.',
				price: 6.99,
				sizes: [
					{ label: 'Mediana', price: 6.99 },
					{ label: 'Grande', price: 8.49 }
				]
			},
			{
				id: 'cotufa-queso',
				name: 'Cotufa con queso',
				price: 6.99,
				sizes: [
					{ label: 'Mediana', price: 6.99 },
					{ label: 'Grande', price: 8.49 }
				]
			}
		]
	},
	{
		id: 'bebidas',
		name: 'Bebidas',
		tagline: 'Frías de verdad',
		products: [
			{
				id: 'refresco',
				name: 'Refresco',
				description: 'Coca-Cola y toda su familia.',
				price: 3.49,
				sizes: [
					{ label: 'Mediano', price: 3.49 },
					{ label: 'Grande', price: 4.49 }
				]
			},
			{ id: 'agua', name: 'Agua mineral', price: 2.49 },
			{ id: 'te-frio', name: 'Té frío', price: 3.49 },
			{ id: 'cafe', name: 'Café', price: 2.99 }
		]
	},
	{
		id: 'para-picar',
		name: 'Para picar',
		tagline: 'Lo que convierte la función en plan',
		products: [
			{
				id: 'tequenos',
				name: 'Tequeños',
				description: 'Ración de seis, con su salsa.',
				price: 5.49
			},
			{ id: 'nuggets', name: 'Nuggets de pollo', price: 5.49 },
			{ id: 'pops-pollo', name: 'Pops de pollo', price: 5.49 },
			{ id: 'dedos-queso', name: 'Dedos de queso', price: 5.99 },
			{
				id: 'nachos',
				name: 'Nachos con queso',
				description: 'Con jalapeños, si te atreves.',
				price: 4.99
			},
			{ id: 'perro-caliente', name: 'Perro caliente', price: 4.49 }
		]
	},
	{
		id: 'dulces',
		name: 'Dulcería',
		products: [
			{ id: 'chocolate', name: 'Chocolates', price: 2.49 },
			{ id: 'gomitas', name: 'Gomitas', price: 2.49 },
			{ id: 'helado', name: 'Helado', price: 3.99 }
		]
	}
];

/**
 * Pasos del armador.
 *
 * Los dos primeros son obligatorios porque un combo sin cotufa ni bebida no
 * es un combo, es un pedido suelto -- y para eso está el menú. Los otros dos
 * son opcionales y por eso arrancan sin nada elegido: el precio que se ve al
 * entrar debe ser el mínimo real, no uno que ya incluya extras.
 */
export const ARMADOR_MOCK: ComboStep[] = [
	{
		id: 'cotufa',
		title: 'Cotufas',
		hint: 'Recién hechas, crujientes y en la porción ideal.',
		required: true,
		options: [
			{ id: 'cotufa-mediana', name: 'Mediana', price: 5.99 },
			{ id: 'cotufa-grande', name: 'Grande', price: 7.49 },
			{ id: 'cotufa-extra', name: 'Extra grande', price: 8.99 },
			{ id: 'cotufa-caramelo', name: 'Acaramelada, grande', price: 8.49 }
		]
	},
	{
		id: 'bebida',
		title: 'Bebidas',
		hint: 'Bien frías, individuales o para compartir.',
		required: true,
		options: [
			{ id: 'bebida-1m', name: '1 refresco mediano', price: 3.49 },
			{ id: 'bebida-2m', name: '2 refrescos medianos', price: 5.99 },
			{ id: 'bebida-2g', name: '2 refrescos grandes', price: 7.49 },
			{ id: 'bebida-agua', name: '1 refresco grande + 1 agua', price: 6.49 }
		]
	},
	{
		id: 'picar',
		title: 'Snacks',
		hint: 'Tequeños, nuggets, nachos con queso y bocados calientes.',
		required: false,
		options: [
			{ id: 'picar-tequenos', name: 'Tequeños', price: 5.49 },
			{ id: 'picar-nuggets', name: 'Nuggets', price: 5.49 },
			{ id: 'picar-pops', name: 'Pops de pollo', price: 5.49 },
			{ id: 'picar-dedos', name: 'Dedos de queso', price: 5.99 },
			{ id: 'picar-nachos', name: 'Nachos con queso', price: 4.99 }
		]
	},
	{
		id: 'dulce',
		title: 'Dulces',
		hint: 'Chocolates, gomitas y helados para complementar tu función.',
		required: false,
		options: [
			{ id: 'dulce-chocolate', name: 'Chocolates', price: 2.49 },
			{ id: 'dulce-gomitas', name: 'Gomitas', price: 2.49 },
			{ id: 'dulce-helado', name: 'Helado', price: 3.99 }
		]
	}
];
