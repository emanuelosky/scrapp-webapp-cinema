export class CinemaState {
	selectedCinema = $state<string | null>(null);
	isLoadingLocation = $state(false);

	async findNearestCinema() {
		// Si ya está cargando o ya se seleccionó uno, no hacemos nada (a menos que quieras forzar re-check)
		if (this.isLoadingLocation) return;
		
		this.isLoadingLocation = true;
		
		try {
			// Simular un retraso para darle peso a la acción de búsqueda
			await new Promise(resolve => setTimeout(resolve, 800));

			// Solicitar geolocalización real (el navegador lanzará el prompt de permisos)
			await new Promise<GeolocationPosition>((resolve, reject) => {
				if (!navigator.geolocation) {
					reject(new Error('Geolocation is not supported'));
				} else {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						timeout: 10000, // 10 segundos máximo para responder
						maximumAge: 0
					});
				}
			});

			// Animación extra después de dar permisos
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Al ser la única sede, "calculamos" que es la más cercana
			this.selectedCinema = 'Sambil Candelaria';
		} catch (error) {
			console.error('Error getting location', error);
			// Fallback: si el usuario rechaza los permisos o falla, de todas formas lo enviamos al único cine
			this.selectedCinema = 'Sambil Candelaria';
		} finally {
			this.isLoadingLocation = false;
		}
	}
}

export const cinemaState = new CinemaState();
