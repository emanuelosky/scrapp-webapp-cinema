// Shim TEMPORAL para la demo: empareja películas del catálogo con los clips
// de prueba en static/trailers/hero/ por coincidencia aproximada de título.
// Ver .agents/10-dynamic-content-pipeline.md sección 4 — esto es a propósito
// más frágil que la columna trailer_asset_url en Supabase (no sobrevive
// cambios de título, y puede fallar si dos títulos distintos "contienen" el
// mismo slug). Quitar este archivo y su uso en +page.ts cuando se decida
// pasar a la columna en BD.
const AVAILABLE_HERO_SLUGS = [
	'coyotevsacme',
	'hechizo',
	'elheladero',
	'laguerradelosultimos',
	'lanochedeldemonio',
	'laodisea',
	'mashaylosos',
	'lapatrullacanina',
	'unanochealano',
	'spiderman'
];

function slugify(s: string): string {
	return s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]/g, '');
}

export function matchLocalHeroTrailer(title: string): string | null {
	const titleSlug = slugify(title);
	const match = AVAILABLE_HERO_SLUGS.find((slug) => titleSlug.includes(slug) || slug.includes(titleSlug));
	return match ? `/trailers/hero/${match}.webm` : null;
}
