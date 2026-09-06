import { supabase } from '$lib/supabase';
import { browser } from '$app/environment';

// Preferencia de sede recordada entre visitas. Solo se usa para destacar
// "tu cine" en el selector: nunca redirige por su cuenta, porque la URL es la
// única fuente de verdad sobre en qué sede está parado el usuario.
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
}

export class CinemaState {
	// Slug de la sede en la que está el usuario AHORA MISMO. Espeja el
	// parámetro [sede] de la URL (que coincide con `cinema_locations.id`) y
	// vale null en el home multisede `/`. Solo `syncFromUrl` lo escribe: un
	// click en el selector navega, y es la navegación la que actualiza esto.
	// Así el header nunca puede decir "Sambil Candelaria" mientras estás en `/`.
	selectedCinemaId = $state<string | null>(null);

	// Última sede que el usuario eligió a propósito. Sobrevive recargas.
	preferredCinemaId = $state<string | null>(null);

	isLoadingLocation = $state(false);
	cinemas = $state<CinemaLocation[]>([]);
	isLoadingCinemas = $state(false);

	// Deduplica las llamadas concurrentes a init(): SiteHeader, +page.ts y el
	// selector la disparaban a la vez en el primer render, lanzando 3 queries
	// idénticas a Supabase (la guarda `cinemas.length > 0` solo servía después
	// de que la primera terminara).
	#initPromise: Promise<void> | null = null;

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
		// El catálogo aún no cargó: mostramos el slug capitalizado en vez de un
		// hueco vacío, y el nombre real entra solo cuando `cinemas` se llene.
		return this.selectedCinemaId.charAt(0).toUpperCase() + this.selectedCinemaId.slice(1);
	}

	/** True si el slug existe en el catálogo (solo confiable ya cargado). */
	isKnownCinema(id: string): boolean {
		return this.cinemas.some((c) => c.id === id);
	}

	async init() {
		if (this.cinemas.length > 0) return;
		this.#initPromise ??= this.#fetchCinemas().finally(() => {
			// Liberamos el slot para permitir reintentos si la query falló.
			this.#initPromise = null;
		});
		await this.#initPromise;
	}

	async #fetchCinemas() {
		this.isLoadingCinemas = true;
		try {
			const { data, error } = await supabase
				.from('cinema_locations')
				.select('id, name, short_name, city, latitude, longitude, is_active')
				.eq('is_active', true)
				.order('sort_order', { ascending: true });
			if (!error && data) {
				this.cinemas = data;
			}
		} catch(e) {
			console.error(e);
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
	 * Devuelve la sede más cercana al usuario. No toca `selectedCinemaId`: quien
	 * llama decide si navegar (y es esa navegación la que cambia la sede activa).
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

			// Fetch active cinemas from database if not loaded
			await this.init();

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
