<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { bookingState } from '$lib/state/booking.svelte';
	import SessionTimeoutModal from '$lib/components/booking/SessionTimeoutModal.svelte';
	import EpikWidget from '$lib/components/chat/EpikWidget.svelte';
	import ScrollToTop from '$lib/components/home/ScrollToTop.svelte';
	import NavigationProgress from '$lib/components/navigation/NavigationProgress.svelte';
	import { chatState } from '$lib/state/chat.svelte';
	import { cinemaState } from '$lib/state/cinema.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';

	let { children } = $props();

	// Protocolo de divergencia del catálogo de sedes.
	//
	// El home arranca con la semilla fija de `cinemasSeed.ts` para no pagar el
	// viaje a Supabase antes de pedir carteleras. Cuando la verificación
	// termina y NO coincide, hay que corregir lo que ya se pintó con la lista
	// vieja — no basta con actualizar el selector.
	//
	// Deliberadamente NO es reactivo: solo debe correr una vez por sesión, y
	// `invalidateAll()` vuelve a disparar el efecto al actualizar `$page`.
	let catalogoYaCorregido = false;

	$effect(() => {
		if (cinemaState.catalogStatus !== 'divergente' || catalogoYaCorregido) return;
		catalogoYaCorregido = true;

		const sedeActual = $page.params.sede;
		if (sedeActual && cinemaState.sedesRetiradas.includes(sedeActual)) {
			// El caso grave: el usuario está parado en una sede que ya no opera.
			// El BFF no valida sedes activas, así que le seguiría entregando
			// funciones comprables de un cine cerrado. Lo sacamos de ahí.
			toast.error('Este cine ya no está disponible.', {
				description: 'Te llevamos a la cartelera general.'
			});
			goto(resolve('/'), { replaceState: true });
			return;
		}

		// Recalcula los load() que declararon `depends('app:cinemas')`, para que
		// el home deje de mostrar funciones de una sede que ya no existe.
		invalidateAll();
	});

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
						goto(resolve(`/cines/${currentSede}`)).then(() => {
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
					const currentSede = $page.params.sede;
					if (!currentSede) {
						// Sin sede no hay funciones ni butacas que mostrar: mandamos al
						// home multisede con la película pendiente para que el usuario
						// elija cine primero. (Antes iba a /booking/<id>, ruta que no
						// existe: el chat terminaba en un 404.)
						// La ruta base va resuelta; el query param se concatena aparte,
						// que es lo que la regla no sabe reconocer.
						// eslint-disable-next-line svelte/no-navigation-without-resolve
						goto(`${resolve('/')}?pelicula=${encodeURIComponent(payload.movieId)}`);
					} else {
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
							bookingState.startBooking(movieObj as any, payload.date, payload.showtime, currentSede);
						}
						goto(resolve(`/cines/${currentSede}/booking/${payload.movieId}`));
					}
				}
			} else if (action.type === 'movie_details') {
				if ($page.url.pathname !== '/' && !$page.url.pathname.startsWith('/cines/')) {
					// eslint-disable-next-line svelte/no-navigation-without-resolve
					goto('/');
				} else if ($page.params.sede && $page.url.pathname !== `/cines/${$page.params.sede}`) {
					goto(resolve(`/cines/${$page.params.sede}`));
				}
			}
		}
	});
</script>

<div class="relative min-h-screen bg-black font-sans text-zinc-50 antialiased">
	<NavigationProgress />
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
