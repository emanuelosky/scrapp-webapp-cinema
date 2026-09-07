import { supabase } from '$lib/supabase';
import { browser } from '$app/environment';
import { SEED_CINEMAS, catalogSignature } from '$lib/config/cinemasSeed';

// Preferencia de sede recordada entre visitas. Solo se usa para destacar
// "tu último cine" en el selector: nunca redirige por su cuenta, porque la URL
// es la única fuente de verdad sobre en qué sede está parado el usuario.
const PREFERRED_CINEMA_KEY = 'scrapp_preferred_cinema';

// Helper: Fórmula de Haversine para calcular distancia en km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371; // Radio de la Tierra en km
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLon = (lon2 - lon1) * Math.PI / 180;
	const a =
		Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLon/2) * Math.sin(dLon/2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	return R * c;
}

export interface CinemaLocation {
	id: string;
	name: string;
	short_name: string | null;
	city: string | null;
	latitude: number | null;
	longitude: number | null;
	is_active: boolean;
	// Identificador IANA (ej. 'America/Caracas'). Todas las sedes de hoy están
	// en Venezuela, pero "hoy"/"ya pasó esta función" debe resolverse contra
	// la hora de PARED de la sede, no la del navegador del visitante ni una
	// constante global — así una sede en otro país no hereda el huso de otra.
	timezone: string;
}

// Fallback SOLO para cuando todavía no se conoce la sede (semilla sin cargar,
// verificación fallida, o una fila vieja de la BD sin esta columna todavía).
// Nunca se debe asumir como la zona horaria "real" de ninguna sede en
// particular — cada `CinemaLocation.timezone` es la fuente de verdad.
const FALLBACK_TIMEZONE = 'America/Caracas';

/**
 * - `semilla`: todavía usamos la copia del bundle; nadie ha confirmado nada.
 * - `confirmado`: Supabase respondió y coincide con la semilla.
 * - `divergente`: Supabase respondió y NO coincide. Hay que redesplegar.
 * - `error`: no se pudo verificar (sin red, key rotada...). Seguimos con la
 *   semilla porque es mejor que un home vacío, pero no damos nada por cierto.
 */
export type CatalogStatus = 'semilla' | 'confirmado' | 'divergente' | 'error';

export class CinemaState {
	// Slug de la sede en la que está el usuario AHORA MISMO. Espeja el
	// parámetro [sede] de la URL (que coincide con `cinema_locations.id`) y
	// vale null en el home multisede `/`. Solo `syncFromUrl` lo escribe.
	selectedCinemaId = $state<string | null>(null);

	// Última sede que el usuario eligió a propósito. Sobrevive recargas.
	preferredCinemaId = $state<string | null>(null);

	// Arranque optimista con la semilla: el home puede pedir carteleras en el
	// primer tick, sin esperar el viaje a Supabase. La verificación de abajo
	// lo corrige si hace falta.
	cinemas = $state<CinemaLocation[]>([...SEED_CINEMAS]);
	catalogStatus = $state<CatalogStatus>('semilla');

	// Sedes que la semilla anunciaba y la base de datos ya no tiene activas.
	// Es el caso peligroso: si el usuario está parado en una de ellas hay que
	// sacarlo, porque el BFF le seguiría vendiendo funciones (no valida si la
	// sede está activa).
	sedesRetiradas = $state<string[]>([]);

	isLoadingLocation = $state(false);
	isLoadingCinemas = $state(false);

	// Una sola verificación por arranque, compartida por todos los que la
	// esperen. No se libera al terminar: reintentar en cada navegación
	// devolvería el catálogo a "no verificado" a mitad de sesión.
	#verifyPromise: Promise<void> | null = null;

	constructor() {
		if (browser) {
			try {
				this.preferredCinemaId = localStorage.getItem(PREFERRED_CINEMA_KEY);
			} catch {
				// localStorage puede lanzar en modo privado o con cookies bloqueadas.
			}
		}
	}

	/** La sede activa resuelta contra el catálogo, o null si estamos en `/`. */
	get selectedCinema(): CinemaLocation | null {
		if (!this.selectedCinemaId) return null;
		return this.cinemas.find((c) => c.id === this.selectedCinemaId) ?? null;
	}

	/** Nombre para mostrar de la sede activa. Null en el home multisede. */
	get selectedCinemaName(): string | null {
		if (!this.selectedCinemaId) return null;
		const match = this.selectedCinema;
		if (match) return match.name || match.short_name || null;
		return this.selectedCinemaId.charAt(0).toUpperCase() + this.selectedCinemaId.slice(1);
	}

	/**
	 * Zona horaria (IANA) que debe regir todo cálculo de "hoy" o "ya pasó esta
	 * función" en la pantalla actual. Es la de la sede activa; en el home
	 * multisede o mientras el catálogo no ha cargado, cae al fallback — nunca
	 * a la del navegador del visitante, que no tiene relación con dónde está
	 * físicamente la sala de cine.
	 */
	get activeTimezone(): string {
		return this.selectedCinema?.timezone ?? FALLBACK_TIMEZONE;
	}

	isKnownCinema(id: string): boolean {
		return this.cinemas.some((c) => c.id === id);
	}

	/**
	 * Arranca la verificación del catálogo contra Supabase (una sola vez por
	 * sesión) y devuelve la promesa. Quien necesite CERTEZA debe esperarla;
	 * quien solo quiera pintar rápido puede ignorarla y usar la semilla.
	 */
	verifyCatalog(): Promise<void> {
		this.#verifyPromise ??= this.#fetchAndCompare();
		return this.#verifyPromise;
	}

	async #fetchAndCompare() {
		this.isLoadingCinemas = true;
		try {
			// La tabla base `cinema_locations` guarda credenciales del POS/taquilla/
			// dulcería junto a los datos de sede, y ya no es legible con la anon key
			// pública (bloqueado tras encontrar que cualquiera podía leerlas desde
			// el bundle del cliente). `cinema_locations_public` es la vista sin esas
			// columnas — es la única fuente que el cliente debe consultar.
			const { data, error } = await supabase
				.from('cinema_locations_public')
				.select('id, name, short_name, city, latitude, longitude, is_active, timezone')
				.eq('is_active', true)
				.order('sort_order', { ascending: true });

			// Guarda contra la forma del error: si esto devuelve algo que no es
			// un arreglo, nos quedamos con la semilla en vez de romper los
			// .map()/.filter() de los load() y del selector.
			if (error || !Array.isArray(data)) {
				this.catalogStatus = 'error';
				console.error('[catalogo] No se pudo verificar cinema_locations_public; seguimos con la semilla.', error);
				return;
			}

			const frescas = data as CinemaLocation[];
			const iguales = catalogSignature(frescas) === catalogSignature(SEED_CINEMAS);

			// La red SIEMPRE pisa a la semilla, nunca al revés.
			this.cinemas = frescas;

			if (iguales) {
				this.catalogStatus = 'confirmado';
				this.sedesRetiradas = [];
				return;
			}

			const idsFrescos = frescas.map((c) => c.id);
			this.sedesRetiradas = SEED_CINEMAS.filter((c) => !idsFrescos.includes(c.id)).map((c) => c.id);
			this.catalogStatus = 'divergente';

			console.warn(
				'[catalogo] La semilla de sedes NO coincide con Supabase. Hay que actualizar ' +
					'src/lib/config/cinemasSeed.ts y redesplegar.\n' +
					'  semilla:  ' + SEED_CINEMAS.map((c) => c.id).join(', ') + '\n' +
					'  supabase: ' + frescas.map((c) => c.id).join(', ') +
					(this.sedesRetiradas.length ? '\n  retiradas: ' + this.sedesRetiradas.join(', ') : '')
			);

			// TODO (pendiente de infraestructura): esto debería levantar una
			// alerta hacia nosotros, no solo un console.warn que nadie mira.
			// Cuando exista un canal (Sentry, un webhook a Slack, o una tabla
			// `deploy_alerts` en Supabase), reportar aquí:
			//   { evento: 'catalogo_desactualizado', semilla, supabase, retiradas }
			// Mientras tanto el guardarraíl real es `npm run check:sedes`, que
			// corre en CI y falla el build antes de que esto llegue a un cliente.
		} catch (e) {
			this.catalogStatus = 'error';
			console.error('[catalogo] Error verificando cinema_locations_public; seguimos con la semilla.', e);
		} finally {
			this.isLoadingCinemas = false;
		}
	}

	/**
	 * Espeja el parámetro [sede] de la ruta actual. Se llama desde la página de
	 * sede (con su slug) y desde el home (con null, para limpiar).
	 */
	syncFromUrl(sede: string | null | undefined) {
		const next = sede ?? null;
		if (this.selectedCinemaId !== next) {
			this.selectedCinemaId = next;
		}
	}

	/** Recuerda la sede que el usuario eligió a propósito. */
	rememberPreference(id: string) {
		this.preferredCinemaId = id;
		if (browser) {
			try {
				localStorage.setItem(PREFERRED_CINEMA_KEY, id);
			} catch {
				// Sin persistencia disponible: la preferencia solo dura la sesión.
			}
		}
	}

	/**
	 * Devuelve la sede más cercana al usuario. Espera la verificación del
	 * catálogo a propósito: mandar a alguien al "cine más cercano" según una
	 * lista del bundle que quizá ya no es válida sería peor que tardar 300ms.
	 */
	async findNearestCinema(): Promise<CinemaLocation | null> {
		if (this.isLoadingLocation) return null;

		this.isLoadingLocation = true;

		try {
			// Simular un retraso para UX
			await new Promise(resolve => setTimeout(resolve, 800));

			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				if (!navigator.geolocation) {
					reject(new Error('Geolocation is not supported'));
				} else {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						timeout: 10000,
						maximumAge: 0
					});
				}
			});

			// Animación extra
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Aquí sí exigimos catálogo verificado.
			await this.verifyCatalog();

			if (this.cinemas.length === 0) {
				throw new Error('No cinemas found');
			}

			const userLat = position.coords.latitude;
			const userLng = position.coords.longitude;

			let closestCinema = this.cinemas[0];
			let minDistance = Infinity;

			for (const cinema of this.cinemas) {
				if (cinema.latitude != null && cinema.longitude != null) {
					const distance = calculateDistance(userLat, userLng, cinema.latitude, cinema.longitude);
					if (distance < minDistance) {
						minDistance = distance;
						closestCinema = cinema;
					}
				}
			}

			return closestCinema;
		} catch (error) {
			console.error('Error getting location or finding cinema', error);
			// Sin permiso o sin red: no inventamos una sede. Quien llama deja el
			// selector abierto para que el usuario elija a mano.
			return null;
		} finally {
			this.isLoadingLocation = false;
		}
	}
}

export const cinemaState = new CinemaState();
