import { cinemaState } from '$lib/state/cinema.svelte';

// Punto de entrada a la cartelera sin sede elegida todavía. Antes agregaba el
// catálogo de TODAS las sedes en una sola lista -- se quitó: mezclar
// horarios de dos cines en la misma tarjeta es un riesgo real (alguien lee
// rápido, compra en Lido, se presenta en Candelaria). Ahora se comporta
// como /cines/[sede]/cartelera con una sede elegida automáticamente
// (preferida o la primera), y el fetch de películas vive en el componente
// porque la sede activa puede cambiar sin navegar.
export const load = async ({ depends }) => {
	depends('app:cinemas');
	cinemaState.verifyCatalog();
	return {};
};
