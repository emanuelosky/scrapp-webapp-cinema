/**
 * LA ÚNICA PUERTA entre la webapp y el sistema que le da los datos.
 * ================================================================
 *
 * Ningún componente, página ni módulo de estado debe llamar a `fetch()`
 * contra el backend por su cuenta, ni construir una URL de API a mano. Todo
 * pasa por acá.
 *
 * El motivo es concreto: el backend de producción todavía no está decidido
 * (Vista, una conexión al sistema legacy, o este mismo intermediario llevado a
 * producción). Cuando se decida, adaptarse debe ser reescribir ESTE archivo, no
 * catorce sitios repartidos por el código. Antes de esta capa había tres formas
 * distintas de resolver la dirección base y tres valores por defecto que no
 * coincidían entre sí, uno de ellos apuntando a la infraestructura de
 * desarrollo del equipo.
 *
 * Las funciones se llaman por lo que significan en el negocio
 * (`fetchCartelera`, `fetchSeatMap`), no por la ruta HTTP que hoy resuelven.
 * Esa es justamente la parte que va a cambiar.
 *
 * Sobre `fetchFn`: las funciones `load()` de SvelteKit reciben su propio
 * `fetch` y hay que usarlo, no el global. Por eso casi todas lo aceptan como
 * último parámetro; fuera de un `load()` se omite.
 */

import type {
	CinemaLocation,
	Combo,
	ComboStep,
	MenuCategory,
	Movie,
	PromoBanner,
	Promocion
} from '$lib/types';

// --- Dirección base -------------------------------------------------------

const CONFIGURED = import.meta.env.VITE_ADMIN_API_URL as string | undefined;
const DEV_FALLBACK = 'http://localhost:5174';

/**
 * Nunca hay un valor por defecto apuntando a un servidor real. Antes, uno de
 * los tres puntos de configuración caía a la URL de desarrollo en Render, así
 * que una compilación sin la variable definida salía publicada hablándole a la
 * infraestructura del equipo -- y funcionaba lo suficiente como para que nadie
 * lo notara. En desarrollo cae a localhost; en una compilación de producción
 * sin variable, esto revienta a propósito (y `scripts/check-build-env.js` lo
 * detiene antes, al compilar).
 */
export const API_BASE: string = (() => {
	if (CONFIGURED) return CONFIGURED.replace(/\/+$/, '');
	if (import.meta.env.DEV) return DEV_FALLBACK;
	throw new Error(
		'VITE_ADMIN_API_URL no está definida. Una compilación de producción no puede ' +
			'quedar apuntando a un servidor por defecto: define la variable en el entorno de build.'
	);
})();

type Fetch = typeof globalThis.fetch;
const pick = (f?: Fetch): Fetch => f ?? globalThis.fetch;

/** GET que devuelve `fallback` ante cualquier problema, sin tumbar la página. */
async function getJson<T>(path: string, fallback: T, fetchFn?: Fetch): Promise<T> {
	try {
		const res = await pick(fetchFn)(`${API_BASE}${path}`);
		if (!res.ok) {
			console.error(`[api] ${path} respondió ${res.status}`);
			return fallback;
		}
		const contentType = res.headers.get('content-type') ?? '';
		if (!contentType.includes('application/json')) {
			console.error(`[api] ${path} no devolvió JSON (${contentType})`);
			return fallback;
		}
		return (await res.json()) as T;
	} catch (e) {
		console.error(`[api] ${path} falló:`, e);
		return fallback;
	}
}

// --- Catálogo de sedes ----------------------------------------------------

/**
 * Sedes activas. Antes el navegador consultaba la vista
 * `cinema_locations_public` directamente contra Supabase con la clave anónima,
 * lo que ataba la webapp a una base de datos concreta y metía el cliente de
 * Supabase (~52 KB) en el paquete. Ahora es una llamada más al backend, como
 * todo lo demás.
 */
export async function fetchLocations(fetchFn?: Fetch): Promise<CinemaLocation[]> {
	const { locations } = await getJson<{ locations: CinemaLocation[] }>(
		'/api/v1/locations',
		{ locations: [] },
		fetchFn
	);
	return Array.isArray(locations) ? locations : [];
}

// --- Cartelera ------------------------------------------------------------

export type Cartelera = {
	nowPlaying: Movie[];
	comingSoonMovies: Movie[];
	activeDates: string[];
};

const EMPTY_CARTELERA: Cartelera = { nowPlaying: [], comingSoonMovies: [], activeDates: [] };

export async function fetchCartelera(locationId: string, fetchFn?: Fetch): Promise<Cartelera> {
	const data = await getJson<Partial<Cartelera>>(
		`/api/v1/movies?location_id=${encodeURIComponent(locationId)}`,
		EMPTY_CARTELERA,
		fetchFn
	);
	return {
		nowPlaying: data.nowPlaying ?? [],
		comingSoonMovies: data.comingSoonMovies ?? [],
		activeDates: data.activeDates ?? []
	};
}

/** Promoción vigente de una sede. Sin sede no hay promo: son por `location_id`. */
export async function fetchPromo(
	locationId: string | undefined,
	fetchFn?: Fetch
): Promise<PromoBanner | null> {
	if (!locationId) return null;
	const { activePromo } = await getJson<{ activePromo: PromoBanner | null }>(
		`/api/v1/promos?location_id=${encodeURIComponent(locationId)}`,
		{ activePromo: null },
		fetchFn
	);
	return activePromo ?? null;
}

// --- Compra de boletos ----------------------------------------------------
// Estos endpoints hablan con la taquilla real (POS). Son los que más van a
// cambiar si el cliente adopta Vista: su Connect API modela la compra como una
// orden con artículos, no como un mapa de butacas más tarifas sueltas.

export type TariffsResponse = {
	success?: boolean;
	allowedTariffs?: string[];
	defaultTariffs?: string[];
	posTariffs?: Record<string, unknown>[];
};

/** El mapa de butacas llega con la forma que da el POS; la webapp lo pinta tal
 *  cual, así que `matrix` no se tipa aquí. */
export type SeatMapResponse = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	matrix?: any;
	tariffsData?: TariffsResponse;
};

export async function fetchKioskSettings(
	fetchFn?: Fetch
): Promise<{ retention_time_minutes?: number } | null> {
	const { settings } = await getJson<{ settings: { retention_time_minutes?: number } | null }>(
		'/api/kiosk/settings',
		{ settings: null },
		fetchFn
	);
	return settings;
}

/** Mapa de butacas de una función. Puede traer las tarifas incrustadas. */
export async function fetchSeatMap(showtimeId: string, fetchFn?: Fetch): Promise<SeatMapResponse | null> {
	return getJson<SeatMapResponse | null>(
		`/api/pos/fetch-seats/${encodeURIComponent(showtimeId)}`,
		null,
		fetchFn
	);
}

/** Tarifas de una función, para cuando el mapa de butacas no las trajo. */
export async function fetchTariffs(showtimeId: string, fetchFn?: Fetch): Promise<TariffsResponse | null> {
	return getJson<TariffsResponse | null>(
		`/api/tarifas?showtimeId=${encodeURIComponent(showtimeId)}`,
		null,
		fetchFn
	);
}

// --- Sesiones "ghost" (reserva temporal en la taquilla) --------------------

export async function fetchGhostPoolStatus(
	fetchFn?: Fetch
): Promise<{ success?: boolean; availablePreHeated?: number }> {
	return getJson('/api/kiosk/ghost-pool/status', {}, fetchFn);
}

export async function warmupGhostPool(): Promise<void> {
	try {
		await fetch(`${API_BASE}/api/kiosk/ghost-pool/warmup`, { method: 'POST' });
	} catch {
		// Es un empujón preventivo: si falla, la compra sigue funcionando.
	}
}

export async function extendGhostSession(username: string): Promise<boolean> {
	try {
		const res = await fetch(`${API_BASE}/api/kiosk/ghost-pool/extend`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username })
		});
		return res.ok;
	} catch (e) {
		console.error('[api] No se pudo extender la sesión:', e);
		return false;
	}
}

/**
 * Libera la sesión al cerrar la pestaña. Es el único caso que no puede usar
 * `fetch`: al descargarse la página el navegador la cancelaría. `sendBeacon`
 * necesita la URL suelta, así que acá se expone en vez de la llamada hecha.
 */
export function ghostReleaseUrl(): string {
	return `${API_BASE}/api/kiosk/ghost-pool/release`;
}

// --- Chat EPIK ------------------------------------------------------------
// El SDK de chat gestiona su propio transporte, así que necesita la URL y las
// cabeceras, no una función que llame por él.

export function chatEndpoint(): string {
	return `${API_BASE}/api/chat`;
}

export function chatHeaders(): Record<string, string> {
	return { 'x-epik-secret': import.meta.env.VITE_EPIK_SECRET || 'scrapp_epik_secret_2026_dev' };
}

// --- Confitería -----------------------------------------------------------
//
// Estas cuatro funciones todavía no hablan con nadie: devuelven la maqueta de
// `$lib/data`. Están acá igual, y no importadas directamente desde las
// páginas, para que enchufar el backend sea cambiar el cuerpo de la función y
// nada más -- que es exactamente la razón de existir de este archivo.
//
// El catálogo real vive en el POS heredado. El intermediario lo cachea como
// JSON crudo (`legacy_catalog_cache`), sin campo de imagen, sin precio por
// sede y sin endpoint público. Lo que hace falta del lado del backend está
// escrito en `CONTRATO-BACKEND.md`, sección "Confitería".
//
// Son `async` a propósito aunque hoy resuelvan de inmediato: así el día que
// haya red, ninguna página que las llame tiene que cambiar.
//
// La importación es dinámica para que los datos de maqueta no viajen en el
// paquete de las páginas que no los usan (la cartelera, el checkout).

/** Combos armados. `sede` se ignora hoy; el catálogo real sí varía por sede. */
export async function fetchCombos(sede?: string, fetchFn?: Fetch): Promise<Combo[]> {
	void sede;
	void fetchFn;
	const { COMBOS_MOCK } = await import('$lib/data/combos.mock');
	return COMBOS_MOCK;
}

/** El menú completo, por categorías. */
export async function fetchMenu(sede?: string, fetchFn?: Fetch): Promise<MenuCategory[]> {
	void sede;
	void fetchFn;
	const { MENU_MOCK } = await import('$lib/data/menu.mock');
	return MENU_MOCK;
}

/** Los pasos del armador de combos, en orden. */
export async function fetchArmador(sede?: string, fetchFn?: Fetch): Promise<ComboStep[]> {
	void sede;
	void fetchFn;
	const { ARMADOR_MOCK } = await import('$lib/data/menu.mock');
	return ARMADOR_MOCK;
}

/** Promociones y coleccionables vigentes, mezclados. */
export async function fetchPromociones(sede?: string, fetchFn?: Fetch): Promise<Promocion[]> {
	void sede;
	void fetchFn;
	const { PROMOCIONES_MOCK } = await import('$lib/data/promociones.mock');
	return PROMOCIONES_MOCK;
}
