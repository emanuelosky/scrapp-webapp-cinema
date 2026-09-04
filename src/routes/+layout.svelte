<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { bookingState } from '$lib/state/booking.svelte';
	import SessionTimeoutModal from '$lib/components/booking/SessionTimeoutModal.svelte';
	import EpikWidget from '$lib/components/chat/EpikWidget.svelte';
	import ScrollToTop from '$lib/components/home/ScrollToTop.svelte';
	import { chatState } from '$lib/state/chat.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

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

	// Navegación y acciones globales disparadas por EPIK Chat
	$effect(() => {
		if (chatState.pendingAction) {
			const action = chatState.pendingAction;
			if (action.type === 'navigate' && action.payload && typeof action.payload === 'object') {
				const payload = action.payload as { section?: string };
				if (payload.section) {
					chatState.clearAction();
					
					let targetId = payload.section;
					if (targetId === 'home') targetId = 'top';
					if (targetId === 'cartelera') targetId = 'peliculas-en-este-cine';

					if ($page.url.pathname !== '/' && !$page.url.pathname.startsWith('/cines/')) {
						// eslint-disable-next-line svelte/no-navigation-without-resolve
						goto('/').then(() => {
							setTimeout(() => {
								document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
							}, 350);
						});
					} else if ($page.url.pathname !== '/' && $page.url.pathname.startsWith('/cines/') && !$page.url.pathname.endsWith($page.params.sede || '')) {
						// If we are in a sede but deeply nested, go to the sede home
						const currentSede = $page.params.sede;
						goto(`/cines/${currentSede}`).then(() => {
							setTimeout(() => {
								document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
							}, 350);
						});
					} else {
						document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
					}
				}
			} else if (action.type === 'booking' && action.payload && typeof action.payload === 'object') {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const payload = action.payload as any;
				if (payload.movieId) {
					chatState.clearAction();
					chatState.close();
					if (payload.showtime && payload.date) {
						// Reserva directa con función preseleccionada
						const movieObj = {
							id: payload.movieId,
							title: payload.movieTitle || 'Película',
							genres: [],
							poster_url: undefined,
							synopsis: undefined
						};
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						bookingState.startBooking(movieObj as any, payload.date, payload.showtime);
					}
					const currentSede = $page.params.sede;
					if (currentSede) {
						// eslint-disable-next-line svelte/no-navigation-without-resolve
						goto(`/cines/${currentSede}/booking/${payload.movieId}`);
					} else {
						// eslint-disable-next-line svelte/no-navigation-without-resolve
						goto(`/booking/${payload.movieId}`);
					}
				}
			} else if (action.type === 'movie_details') {
				if ($page.url.pathname !== '/' && !$page.url.pathname.startsWith('/cines/')) {
					// eslint-disable-next-line svelte/no-navigation-without-resolve
					goto('/');
				} else if ($page.params.sede && $page.url.pathname !== `/cines/${$page.params.sede}`) {
					goto(`/cines/${$page.params.sede}`);
				}
			}
		}
	});
</script>

<div class="relative min-h-screen bg-black font-sans text-zinc-50 antialiased">
	<Toaster theme="dark" position="bottom-right" />
	{@render children()}
	<SessionTimeoutModal />
	<ScrollToTop />
	<EpikWidget />
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
