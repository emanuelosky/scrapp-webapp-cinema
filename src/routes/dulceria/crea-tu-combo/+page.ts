import { fetchArmador } from '$lib/api';

// Los pasos se piden acá y no en un $effect del componente: un load() arranca
// durante la navegación, en paralelo con la descarga del código de la página,
// así el armador se pinta completo desde el primer frame y nunca se ve la
// lista de pasos vacía.
//
// Va sin sede a propósito: hoy `fetchArmador` la ignora (la confitería todavía
// sale de la maqueta) y esta ruta no tiene [sede] en la URL, así que inventar
// una acá sería mentirle a la capa de datos. Cuando el catálogo real varíe por
// sede, entra por este mismo parámetro.
export const load = async ({ fetch }) => {
	const pasos = await fetchArmador(undefined, fetch);
	return { pasos };
};
