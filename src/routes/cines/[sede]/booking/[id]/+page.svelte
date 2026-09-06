<script lang="ts">
	import { bookingState } from '$lib/state/booking.svelte';
	import { API_BASE } from '$lib/utils/api';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
	import BookingHeader from '$lib/components/booking/BookingHeader.svelte';
	import BookingFooter from '$lib/components/booking/BookingFooter.svelte';
	import SeatMapViewer from '$lib/components/booking/SeatMapViewer.svelte';
	import DisabledSeatPrompt from '$lib/components/booking/DisabledSeatPrompt.svelte';

	onMount(() => {
		if (!bookingState.movie) {
			bookingState.loadFromLocalStorage();
		}

		const currentSede = $page.params.sede;
		const sedeHome = currentSede ? resolve(`/cines/${currentSede}`) : resolve('/');

		// Sin película en curso no hay nada que reservar: se llegó por URL directa
		// o tras vencer el estado guardado.
		if (!bookingState.movie) {
			goto(sedeHome);
			return;
		}

		// La reserva rehidratada puede venir de OTRA sede (el estado vive en
		// localStorage y no distinguía cines): sus funciones y su mapa de sala no
		// aplican aquí, así que devolvemos al usuario a la home de esta sede.
		if (bookingState.bookingSede && bookingState.bookingSede !== currentSede) {
			console.warn(
				`[booking] Reserva de la sede "${bookingState.bookingSede}" abierta en "${currentSede}"; se descarta.`
			);
			goto(sedeHome);
			return;
		}

		bookingState.loadSeats();

		fetch(`${API_BASE}/api/kiosk/ghost-pool/warmup`, { method: 'POST' })
			.then(() => bookingState.fetchGhostStatus())
			.catch(console.error);
			
		const ghostInterval = setInterval(() => {
			if (!bookingState.ghostStatusCode) {
				bookingState.fetchGhostStatus();
			}
		}, 30000);

		const handlePageHide = () => {
			const ghostSession = sessionStorage.getItem('scrapp_ghost_session');
			if (ghostSession) {
				try {
					const { ghostUsername } = JSON.parse(ghostSession);
					if (ghostUsername) {
						navigator.sendBeacon(
							`${API_BASE}/api/kiosk/ghost-pool/release`,
							JSON.stringify({ username: ghostUsername })
						);
						sessionStorage.removeItem('scrapp_ghost_session');
					}
				} catch { /* ignored */ }
			}
		};

		window.addEventListener('pagehide', handlePageHide);
		window.addEventListener('beforeunload', handlePageHide);

		return () => {
			window.removeEventListener('pagehide', handlePageHide);
			window.removeEventListener('beforeunload', handlePageHide);
			clearInterval(ghostInterval);
		};
	});

	let id = $derived($page.params.id);

	let showDisabledPrompt = $state(false);
	let pendingDisabledSeatId = $state<string | null>(null);

	function handleSeatWheelchair(seatId: string) {
		pendingDisabledSeatId = seatId;
		showDisabledPrompt = true;
	}
</script>

<DisabledSeatPrompt 
	show={showDisabledPrompt} 
	pendingSeatId={pendingDisabledSeatId} 
	onCancel={() => { showDisabledPrompt = false; pendingDisabledSeatId = null; }} 
/>

<div class="h-[100dvh] w-full overflow-hidden bg-[#0a0a0a] text-white flex flex-col font-sans relative">
	<BookingHeader />
	
	<SeatMapViewer onSeatWheelchair={handleSeatWheelchair} />

	<BookingFooter {id} />
</div>
