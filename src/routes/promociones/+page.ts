import { fetchPromociones } from '$lib/api';

// La lista se pide en el load() y no en un $effect del componente: así viaja
// durante la navegación, en paralelo con la descarga del código de la página, y
// los dos bloques se pintan completos desde el primer frame en vez de aparecer
// vacíos y llenarse un instante después.
//
// Va sin sede a propósito: esta ruta no lleva [sede] en la URL y hoy la capa de
// datos ignora el parámetro, así que inventar una acá sería mentirle. Cuando
// las promociones varíen por sede, entran por este mismo argumento.
export const load = async ({ fetch }) => {
	const promociones = await fetchPromociones(undefined, fetch);

	return { promociones };
};
