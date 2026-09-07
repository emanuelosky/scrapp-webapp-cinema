<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	import MovieDetailsDialog from '$lib/components/MovieDetailsDialog.svelte';

	import Footer from '$lib/components/Footer.svelte';

	// Home Components
	import DateSelector from '$lib/components/home/DateSelector.svelte';
	import NowPlayingCarousel from '$lib/components/home/NowPlayingCarousel.svelte';
	import UpcomingCarousel from '$lib/components/home/UpcomingCarousel.svelte';
	import HeroDesktop from '$lib/components/home/HeroDesktop.svelte';
	import HeroMobile from '$lib/components/home/HeroMobile.svelte';
	import HeroScrolly from '$lib/components/home/HeroScrolly.svelte';
	import SiteHeader from '$lib/components/navigation/SiteHeader.svelte';
	import { chatState } from '$lib/state/chat.svelte';

	import { cinemaState } from '$lib/state/cinema.svelte';

	let { data } = $props();
	let comingSoonMovies = $derived(data.comingSoonMovies);
	let activeDates = $derived(data.activeDates || []);
	import type { Movie } from '$lib/types';

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { today, now, type DateValue } from '@internationalized/date';
	import { APP_TIMEZONE } from '$lib/utils/timezone';

	// La URL manda: el slug [sede] ES el `cinema_locations.id`, así que la sede
	// activa se espeja desde la ruta en vez de adivinarse con un match difuso
	// de nombres. cinemaState resuelve el nombre bonito cuando el catálogo carga.
	$effect(() => {
		cinemaState.syncFromUrl($page.params.sede);
	});

	let sedeDisplayName = $derived(cinemaState.selectedCinemaName ?? '');

	onMount(() => {
		cinemaState.verifyCatalog();
	});

	// Estado
	let isDialogOpen = $state(false);
	let headerModalOpen = $state(false);
	let selectedMovie: Movie | null = $state(null);

	// Filtros de fecha
	let selectedDateTab = $state<'hoy' | 'manana' | 'custom'>('hoy');
	let customDate = $state<DateValue | undefined>();

	let selectedDateStr = $derived.by(() => {
		const tz = APP_TIMEZONE;
		if (selectedDateTab === 'hoy') return today(tz).toString();
		if (selectedDateTab === 'manana') return today(tz).add({ days: 1 }).toString();
		if (customDate) return customDate.toString();
		return today(tz).toString();
	});

	const todayPhrases = [
		"VIVE LO INIMAGINABLE, HOY EN PANTALLA",
		"HOY EN CINEPIC",
		"PELÍCULAS EN ESTE CINE"
	];
	let randomTodayPhrase = $state(todayPhrases[0]);

	let nowPlaying = $derived.by(() => {
		const tzNow = now(APP_TIMEZONE);
		const currentStr = `${tzNow.hour.toString().padStart(2, '0')}:${tzNow.minute.toString().padStart(2, '0')}:00`;
		const todayStr = today(APP_TIMEZONE).toString();

		return data.nowPlaying
			.map(movie => {
				const rawDayShowtimes = movie.showtimesByDate?.[selectedDateStr] || [];
				// Si estamos viendo la fecha de "hoy", filtramos las funciones que ya pasaron
				const dayShowtimes = rawDayShowtimes.filter(s => {
					if (selectedDateStr === todayStr && s.rawTime) {
						return s.rawTime >= currentStr;
					}
					return true;
				});

				return {
					...movie,
					showtimes: dayShowtimes
				};
			})
			.filter(movie => movie.showtimes.length > 0);
	});

	let isAnyModalOpen = $derived(isDialogOpen || headerModalOpen);

	$effect(() => {
		// Auto-switch to tomorrow if today has no upcoming showtimes
		if (selectedDateTab === 'hoy' && nowPlaying.length === 0) {
			// Check if 'hoy' originally had some showtimes that all passed, or if it was truly empty
			// Actually, just checking if nowPlaying is empty on 'hoy' is enough to trigger the switch to 'manana'
			// so the user sees something.
			selectedDateTab = 'manana';
		}
	});

	$effect(() => {
		// Pick a random phrase on client side to avoid hydration mismatch
		randomTodayPhrase = todayPhrases[Math.floor(Math.random() * todayPhrases.length)];
	});


	$effect(() => {
		// Copilot Action Listener
		if (chatState.pendingAction) {
			const action = chatState.pendingAction;
			if (action.type === 'open_movie' && action.payload && typeof action.payload === 'object') {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const payload = action.payload as any;
				let found: Movie | undefined;
				if (payload.query) {
					const clean = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
					const qClean = clean(payload.query);
					found = nowPlaying.find(m => {
						const tClean = clean(m.title);
						return tClean.includes(qClean) || qClean.includes(tClean);
					}) || comingSoonMovies.find(m => {
						const tClean = clean(m.title);
						return tClean.includes(qClean) || qClean.includes(tClean);
					});
				}
				if (found) {
					console.log('🎬 [Page] Abriendo modal para:', found.title);
					openMovieDetails(found);
				} else {
					console.log('⚠️ [Page] No se encontró la película con ID:', payload.movieId, 'o título:', payload.movieTitle);
				}
			} else if (action.type === 'start_booking' && action.payload && typeof action.payload === 'object') {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const payload = action.payload as any;
				if (payload.query && payload.time) {
					const clean = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
					const qClean = clean(payload.query);
					const found = nowPlaying.find(m => {
						const tClean = clean(m.title);
						return tClean.includes(qClean) || qClean.includes(tClean);
					});

					if (found && found.showtimesByDate) {
						const firstDate = Object.keys(found.showtimesByDate)[0];
						if (firstDate) {
							const showtime = found.showtimesByDate[firstDate].find(s => s.time === payload.time || s.time.includes(payload.time));
							if (showtime) {
								console.log('🎟️ [Page] Iniciando booking directo para:', found.title, showtime.time);
								const sede = $page.params.sede;
								import('$lib/state/booking.svelte').then(({ bookingState }) => {
									bookingState.startBooking(found, firstDate, showtime, sede);
									// Estamos DENTRO de una sede: el destino siempre es
									// /cines/<sede>/booking/... (antes iba a /booking/<id>,
									// que no existe como ruta y daba 404).
									goto(resolve(`/cines/${sede}/booking/${found.id}`));
								});
							} else {
								console.log('⚠️ [Page] No se encontró el horario:', payload.time);
							}
						}
					}
				}
			}
			chatState.clearAction();
		}
	});

	$effect(() => {
		// Update chat context cache
		if (nowPlaying && nowPlaying.length > 0) {
			chatState.contextData = nowPlaying.map(m => {
				let text = `[ID: ${m.id}] ${m.title}`;
				if (m.rating) text += ` (Clasif: ${m.rating})`;
				if (m.showtimesByDate) {
					const firstDate = Object.keys(m.showtimesByDate)[0];
					if (firstDate && m.showtimesByDate[firstDate]) {
						const times = m.showtimesByDate[firstDate].map(s => s.time).join(', ');
						text += ` (Hoy: ${times})`;
					}
				}
				return text;
			}).join(' | ');
		}
	});

	if (browser) {
		// @ts-expect-error - Exposing for debugging
		window.__EPIK_TEST = (movieId: string, movieTitle: string) => {
			console.log('🧪 [Test] Simulando señal EPIK para:', movieTitle);
			chatState.triggerAction('movie_details', { movieId, movieTitle });
		};
	}

	function openMovieDetails(movie: Movie) {
		selectedMovie = movie;
		isDialogOpen = true;
	}

	// El home multisede manda aquí con `?pelicula=<id>` cuando el usuario eligió
	// una película antes que la sede. Abrimos su ficha (donde ya hay funciones
	// reales de ESTA sede) y limpiamos el query param para que un refresh o un
	// "atrás" no la reabran.
	let handledPendingMovie = $state<string | null>(null);

	$effect(() => {
		const pending = $page.url.searchParams.get('pelicula');
		if (!pending || handledPendingMovie === pending) return;

		const found =
			data.nowPlaying.find((m: Movie) => String(m.id) === pending) ||
			comingSoonMovies.find((m: Movie) => String(m.id) === pending);

		handledPendingMovie = pending;
		if (found) {
			openMovieDetails(found);
		} else {
			// El home junta la cartelera de TODAS las sedes, así que la película
			// elegida puede no proyectarse en el cine que el usuario escogió.
			// Sin este aviso aterrizaba en la sede sin explicación de por qué su
			// película "desapareció".
			toast.info('Esa película no está en cartelera en este cine.', {
				description: 'Te dejamos la programación completa de esta sede.'
			});
		}

		const cleaned = new URL($page.url);
		cleaned.searchParams.delete('pelicula');
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(cleaned.pathname + cleaned.search, { replaceState: true, noScroll: true, keepFocus: true });
	});
</script>

<svelte:head>
	<title>CINEPIC | {sedeDisplayName.toUpperCase()}</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-black pb-20 font-sans text-zinc-50 overflow-clip w-full relative">
	<SiteHeader {nowPlaying} {comingSoonMovies} {openMovieDetails} bind:isAnyModalOpen={headerModalOpen} />

	<!-- Hero Section -->
	<section class="hero-banner relative flex w-full items-center overflow-hidden py-4 lg:py-6">
		<div class="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-1/2 z-20" style="background: radial-gradient(circle at 100% 0%, rgba(0,0,0,0.9) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(0,0,0,0.9) 0%, transparent 50%);"></div>

		<HeroDesktop {nowPlaying} />
		<HeroMobile />
	</section>

	<section id="peliculas-en-este-cine" class="w-full mt-12">
		<div class="mb-8 w-full border-b border-zinc-800">
			<div class="flex flex-col items-start justify-between pb-4 md:flex-row md:items-center px-8 md:px-16 lg:px-24">
			<h3 class="mb-4 font-display text-3xl tracking-wider text-white md:mb-0 md:text-4xl">
				{#if selectedDateTab === 'hoy'}
					{randomTodayPhrase}
				{:else if selectedDateTab === 'manana'}
					Programación de Mañana
				{:else}
					Programación para el {customDate ? `${customDate.day}/${customDate.month}` : ''}
				{/if}
			</h3>
			<DateSelector bind:selectedDateTab bind:customDate {activeDates} />
            </div>
        </div>

		<NowPlayingCarousel movies={nowPlaying} {openMovieDetails} isPaused={isAnyModalOpen} />
	</section>
</div>

<UpcomingCarousel movies={comingSoonMovies} isPaused={isAnyModalOpen} />
<Footer />
<MovieDetailsDialog bind:open={isDialogOpen} movie={selectedMovie} />

<style>
	.hero-banner {
		background: radial-gradient(circle at 75% 55%, rgba(180,83,9,0.15) 0%, rgba(0,0,0,1) 40%);
	}

	@media (max-width: 1024px) {
		.hero-banner {
			background: radial-gradient(circle at 50% 50%, rgba(180,83,9,0.1) 0%, rgba(0,0,0,1) 50%);
		}
	}
</style>
