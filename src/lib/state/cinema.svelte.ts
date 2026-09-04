import { supabase } from '$lib/supabase';

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
	selectedCinema = $state<string | null>(null);
	isLoadingLocation = $state(false);
	cinemas = $state<CinemaLocation[]>([]);
	isLoadingCinemas = $state(false);

	async init() {
		if (this.cinemas.length > 0) return;
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

			this.selectedCinema = closestCinema.name || closestCinema.short_name || 'Sambil Candelaria';
			return closestCinema;
		} catch (error) {
			console.error('Error getting location or finding cinema', error);
			// Fallback if permission denied or fetch fails
			this.selectedCinema = 'Sambil Candelaria';
			return null;
		} finally {
			this.isLoadingLocation = false;
		}
	}
}

export const cinemaState = new CinemaState();
