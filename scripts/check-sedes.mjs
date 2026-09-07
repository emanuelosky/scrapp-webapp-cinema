/**
 * Verifica que la semilla de sedes del bundle (src/lib/config/cinemasSeed.ts)
 * siga coincidiendo con `cinema_locations_public` (la vista pública; la tabla
 * base ya no es legible con la anon key, ver .agent-tasks/06-resultado.md).
 *
 * Por qué existe: el home arranca con esa lista fija para ahorrarse el viaje a
 * Supabase, y el BFF NO valida si una sede está activa (comprobado: pedirle la
 * cartelera de una sede inexistente devuelve películas reales). Si la semilla
 * se queda vieja, la app puede llegar a ofrecer funciones comprables de un cine
 * cerrado. La app se defiende en runtime (ver el protocolo de divergencia en
 * cinema.svelte.ts), pero eso es la red de seguridad; esto es el guardarraíl:
 * falla el build ANTES de que llegue a un cliente.
 *
 *   npm run check:sedes
 *
 * Requiere PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY (del entorno o de .env).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

function leerEnv() {
	const env = { ...process.env };
	try {
		for (const linea of readFileSync(join(raiz, '.env'), 'utf8').split('\n')) {
			const i = linea.indexOf('=');
			if (i < 1 || linea.trimStart().startsWith('#')) continue;
			const clave = linea.slice(0, i).trim();
			if (!env[clave]) env[clave] = linea.slice(i + 1).trim();
		}
	} catch {
		// Sin .env: nos quedamos solo con las variables del entorno (caso CI).
	}
	return env;
}

async function main() {
	const env = leerEnv();
	const url = env.PUBLIC_SUPABASE_URL;
	const key = env.PUBLIC_SUPABASE_ANON_KEY;
	const enCI = env.CI === 'true' || env.CI === '1';

	if (!url || !key) {
		const msg =
			'[check:sedes] Faltan PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY; no se pudo verificar la semilla.';
		if (enCI) {
			console.error(msg + ' En CI esto es un error: configura las variables.');
			return 1;
		}
		console.warn(msg + ' (fuera de CI solo avisamos)');
		return 0;
	}

	const { SEED_CINEMAS, catalogSignature } = await import('../src/lib/config/cinemasSeed.ts');

	let res;
	try {
		// La anon key ya no puede leer la tabla base `cinema_locations` (guarda
		// credenciales de POS/taquilla/dulcería): se bloqueó tras confirmar que
		// cualquiera podía leerlas desde el bundle del cliente. Este script usa
		// la misma anon key pública que el navegador, así que consulta la vista
		// `cinema_locations_public` — es la misma fuente que ve el cliente real.
		res = await fetch(
			`${url}/rest/v1/cinema_locations_public?select=id,name,short_name,city,latitude,longitude,is_active,timezone&is_active=eq.true&order=sort_order.asc`,
			{ headers: { apikey: key, Authorization: `Bearer ${key}` } }
		);
	} catch (e) {
		console.error('[check:sedes] No se pudo contactar Supabase:', e.message);
		// Fuera de CI no bloqueamos por estar sin red; en CI sí, porque ahí
		// "no pude comprobar" no puede pasar por "está bien".
		return enCI ? 1 : 0;
	}

	if (!res.ok) {
		console.error(`[check:sedes] Supabase respondió ${res.status}. No se pudo verificar.`);
		return enCI ? 1 : 0;
	}

	const frescas = await res.json();

	if (!Array.isArray(frescas)) {
		console.error('[check:sedes] Respuesta inesperada de Supabase:', frescas);
		return 1;
	}

	if (catalogSignature(frescas) === catalogSignature(SEED_CINEMAS)) {
		console.log(
			`[check:sedes] OK — la semilla coincide con Supabase (${frescas.length} sedes activas).`
		);
		return 0;
	}

	const idsSemilla = new Set(SEED_CINEMAS.map((c) => c.id));
	const idsFrescos = new Set(frescas.map((c) => c.id));
	const retiradas = SEED_CINEMAS.filter((c) => !idsFrescos.has(c.id)).map((c) => c.id);
	const nuevas = frescas.filter((c) => !idsSemilla.has(c.id)).map((c) => c.id);

	console.error('\n[check:sedes] LA SEMILLA DE SEDES ESTÁ DESACTUALIZADA.\n');
	console.error('  Actualiza src/lib/config/cinemasSeed.ts con estos datos y vuelve a desplegar:\n');
	console.error(JSON.stringify(frescas, null, 2).replace(/^/gm, '  '));

	if (retiradas.length) {
		console.error(
			`\n  ⚠️  Sedes que la semilla anuncia y ya NO están activas: ${retiradas.join(', ')}` +
				'\n     Esto es lo grave: el BFF les seguiría entregando funciones comprables.'
		);
	}
	if (nuevas.length) {
		console.error(`\n  Sedes nuevas que faltan en la semilla: ${nuevas.join(', ')}`);
	}
	if (!retiradas.length && !nuevas.length) {
		console.error('\n  Los ids coinciden, pero cambió algún dato (nombre, ciudad o coordenadas).');
	}

	console.error('');
	return 1;
}

// exitCode en vez de process.exit(): salir a la fuerza tras trabajo async
// dispara una aserción de libuv en Windows y ensucia la salida de CI.
process.exitCode = await main();
