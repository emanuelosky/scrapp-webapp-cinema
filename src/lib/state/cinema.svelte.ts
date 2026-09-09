import { browser } from '$app/environment';
import { fetchLocations } from '$lib/api';
import type { CinemaLocation } from '$lib/types';
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

// El tipo vive en $lib/types (la capa de datos lo necesita y no debe
// depender de un módulo de estado). Se reexporta para quienes ya lo importaban
// desde aquí.
export type { CinemaLocation };

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
	 * Nombre corto y curado de la sede activa ("Candelaria" en vez de "Sambil
	 * Candelaria"). Es el que se muestra en móvil, donde el nombre completo
	 * empuja los demás controles a otra fila. Cae al nombre completo si la
	 * sede no tiene uno corto.
	 */
	get selectedCinemaShortName(): string | null {
		if (!this.selectedCinemaId) return null;
		const match = this.selectedCinema;
		if (match) return match.short_name || match.name || null;
		return this.selectedCinemaName;
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

	/**
	 * Sede que se elige sola cuando la URL no trae ninguna (la ruta /cartelera):
	 * la preferida del visitante si sigue existiendo, si no la primera del
	 * catálogo. Vive acá para que el `load()` y el componente resuelvan igual.
	 */
	defaultCinemaId(): string | null {
		const preferred = this.preferredCinemaId;
		if (preferred && this.isKnownCinema(preferred)) return preferred;
		return this.cinemas[0]?.id ?? null;
	}

	isKnownCinema(id: string): boolean {
		return this.cinemas.some((c) => c.id === id);
	}

	/**
	 * Arranca la verificación del catálogo contra Supabase (una sola vez por
	 * sesión) y devuelve la promesa. Quien necesite CERTEZA debe esperarla;
	 * quien solo quiera pintar rápido puede ignorarla y usar la semilla.
	 */
	/**
	 * @param fetchFn El `fetch` del `load()` cuando se llama desde uno. SvelteKit
	 *   avisa por consola si se usa el `fetch` global dentro de un `load()`, y
	 *   con razón: el suyo sabe resolver rutas relativas y evita una petición
	 *   duplicada. Fuera de un `load()` se omite.
	 */
	verifyCatalog(fetchFn?: typeof globalThis.fetch): Promise<void> {
		this.#verifyPromise ??= this.#fetchAndCompare(fetchFn);
		return this.#verifyPromise;
	}

	async #fetchAndCompare(fetchFn?: typeof globalThis.fetch) {
		this.isLoadingCinemas = true;
		try {
			// Vía el backend, no contra la base de datos. Antes el navegador
			// consultaba Supabase directamente con la clave anónima: eso ataba la
			// webapp a una base concreta (que en producción probablemente no
			// exista) y metía el cliente de Supabase en el paquete. Ahora el
			// backend es la única fuente, como para todo lo demás.
			const frescas = await fetchLocations(fetchFn);

			// Guarda contra la forma de la respuesta: si viene vacía nos quedamos
			// con la semilla en vez de borrar el selector de sedes.
			if (frescas.length === 0) {
				this.catalogStatus = 'error';
				console.error('[catalogo] No se pudieron verificar las sedes; seguimos con la semilla.');
				return;
			}

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
