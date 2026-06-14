<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { bookingState } from '$lib/state/booking.svelte';
	import SessionTimeoutModal from '$lib/components/booking/SessionTimeoutModal.svelte';

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
	<Toaster theme="dark" position="bottom-right" />
	{@render children()}
	<SessionTimeoutModal />
	{#if bookingState.ghostSession}
		<div class="fixed bottom-1 right-1 text-[9px] md:text-[10px] text-zinc-700 font-mono tracking-tighter select-text z-[100] pointer-events-none" title="Sesión Ghost Activa">
			G:{bookingState.ghostSession.ventaTemporalId}
		</div>
	{:else if bookingState.ghostAvailableCount !== null}
		<div class="fixed bottom-1 right-1 text-[9px] md:text-[10px] text-zinc-700 font-mono tracking-tighter select-none pointer-events-none z-[100]" title="Ghost Users Disponibles">
			G({bookingState.ghostAvailableCount})
		</div>
	{/if}
</div>
