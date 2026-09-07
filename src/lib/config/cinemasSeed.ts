import type { CinemaLocation } from '$lib/state/cinema.svelte';

/**
 * SEMILLA DEL CATÁLOGO DE SEDES — copia fija de `cinema_locations`.
 *
 * Existe solo para que el home pueda pedir carteleras SIN esperar el viaje a
 * Supabase (ahorra ~300ms del arranque en frío). No es la fuente de verdad:
 * en cada arranque se verifica contra Supabase y el resultado de red SIEMPRE
 * pisa a esta lista, nunca al revés.
 *
 * ⚠️ Si editas esto, corre `npm run check:sedes` para confirmar que coincide
 * con la base de datos. Ese script también corre en CI y falla el build si
 * divergen, para que la semilla no se pudra en silencio.
 *
 * El riesgo real de que se desactualice NO es cosmético: el BFF no valida si
 * una sede está activa (verificado: pedirle la cartelera de una sede
 * inexistente devuelve películas reales), así que una sede cerrada que siga
 * aquí mostraría funciones comprables. Por eso el protocolo de divergencia de
 * `cinema.svelte.ts` es obligatorio, no opcional.
 */
export const SEED_CINEMAS: CinemaLocation[] = [
	{
		id: 'candelaria',
		name: 'Sambil Candelaria',
		short_name: 'Candelaria',
		city: 'Caracas',
		latitude: 10.505293,
		longitude: -66.900959,
		is_active: true,
		timezone: 'America/Caracas'
	},
	{
		id: 'lido',
		name: 'Cines Lido',
		short_name: 'Lido',
		city: 'Caracas',
		latitude: 10.493921,
		longitude: -66.858711,
		is_active: true,
		timezone: 'America/Caracas'
	}
];

/**
 * Firma canónica de un catálogo, para comparar semilla contra base de datos.
 * Incluye `timezone`: un cambio ahí es tan grave como una sede que desaparece
 * — mal huso horario significa vender (o esconder) funciones que no tocan.
 */
export function catalogSignature(cinemas: CinemaLocation[]): string {
	return cinemas
		.map((c) => `${c.id}|${c.name}|${c.short_name ?? ''}|${c.city ?? ''}|${c.latitude ?? ''}|${c.longitude ?? ''}|${c.timezone ?? ''}`)
		.sort()
		.join('\n');
}
