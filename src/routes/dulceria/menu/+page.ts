import { fetchCombos, fetchMenu } from '$lib/api';

// Las dos listas se piden acá y no en un $effect del componente: un load()
// arranca durante la navegación, en paralelo con la descarga del código de la
// página, así el menú se pinta completo desde el primer frame en vez de
// mostrar una carta vacía que se llena después.
//
// En paralelo y no en cadena: el menú no depende de los combos, así que
// esperar uno para pedir el otro solo sumaría un viaje al total.
//
// Van sin sede a propósito: hoy `fetchCombos` y `fetchMenu` la ignoran (la
// confitería todavía sale de la maqueta) y esta ruta no tiene [sede] en la
// URL, así que inventar una acá sería mentirle a la capa de datos. Cuando el
// catálogo real varíe por sede, entra por este mismo parámetro.
export const load = async ({ fetch }) => {
	const [combos, menu] = await Promise.all([
		fetchCombos(undefined, fetch),
		fetchMenu(undefined, fetch)
	]);

	return { combos, menu };
};
