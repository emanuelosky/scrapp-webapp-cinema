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

		if (!bookingState.movie) {
			goto(resolve('/'));
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
