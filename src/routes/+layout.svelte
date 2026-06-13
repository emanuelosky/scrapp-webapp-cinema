<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { bookingState } from '$lib/state/booking.svelte';
	import SessionTimeoutModal from '$lib/components/booking/SessionTimeoutModal.svelte';
	import SessionTimerBar from '$lib/components/booking/SessionTimerBar.svelte';

	let { children } = $props();

	onMount(() => {
		if (browser) {
			const handleVisibilityChange = () => {
				if (document.visibilityState === 'visible') {
					bookingState.syncState();
				}
			};
			document.addEventListener('visibilitychange', handleVisibilityChange);
			window.addEventListener('focus', handleVisibilityChange);

			// Al montar, también sincronizamos por si la pestaña se restauró de un estado suspendido
			bookingState.syncState();

			return () => {
				document.removeEventListener('visibilitychange', handleVisibilityChange);
				window.removeEventListener('focus', handleVisibilityChange);
			};
		}
	});

	// Auto-guardar el estado en localStorage ante cualquier mutación de Svelte
	$effect(() => {
		bookingState.saveToLocalStorage();
	});
</script>

<div class="relative min-h-screen bg-black font-sans text-zinc-50 antialiased">
	<SessionTimerBar />
	<Toaster theme="dark" position="bottom-right" />
	{@render children()}
	<SessionTimeoutModal />
</div>
