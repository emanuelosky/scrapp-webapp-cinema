<script lang="ts">
	import HeroScrolly from '$lib/components/home/HeroScrolly.svelte';
	import NowPlayingCarousel from '$lib/components/home/NowPlayingCarousel.svelte';
	import NetworkHero from '$lib/components/home/NetworkHero.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SiteHeader from '$lib/components/navigation/SiteHeader.svelte';
	import TheatreSelectorDialog from '$lib/components/TheatreSelectorDialog.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { cinemaState } from '$lib/state/cinema.svelte';
	import type { Movie } from '$lib/types';

	let { data } = $props();

	let headerModalOpen = $state(false);
	let isTheatreSelectorOpen = $state(false);
	let pendingMovieId = $state<string | undefined>(undefined);

	// Estamos en el home multisede: aquí NO hay sede activa. Sin este reset, el
	// estado se quedaba con la última sede visitada y el header seguía diciendo
	// "Cine: Sambil Candelaria" mientras el usuario ya estaba en `/`.
	$effect(() => {
		cinemaState.syncFromUrl(null);
	});

	// EPIK puede mandar aquí con `?pelicula=<id>` cuando pide reservar sin sede:
	// abrimos el selector de cine con esa película pendiente y limpiamos la URL.
	let handledPendingMovie = $state<string | null>(null);

	$effect(() => {
		const pending = $page.url.searchParams.get('pelicula');
		if (!pending || handledPendingMovie === pending) return;

		handledPendingMovie = pending;
		pendingMovieId = pending;
		isTheatreSelectorOpen = true;

		const cleaned = new URL($page.url);
		cleaned.searchParams.delete('pelicula');
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(cleaned.pathname + cleaned.search, { replaceState: true, noScroll: true, keepFocus: true });
	});

	// Referencia para la sección del carrusel (para activar la animación al scrollear)
	let sectionRef = $state<HTMLElement | null>(null);

	// Al elegir una película sin sede seleccionada, pedimos primero el cine
	// (TheatreSelectorDialog navega directo al booking de esa sede al elegir).
	function openMovieDetails(movie: Movie) {
		pendingMovieId = String(movie.id);
		isTheatreSelectorOpen = true;
	}

	let isAnyModalOpen = $derived(headerModalOpen || isTheatreSelectorOpen);

	// Destacadas para el hero: solo películas con banner (el hero nunca usa el poster),
	// preventas/estrenos primero (ya vienen ordenadas así desde la API), tope de 8.
	let featuredMovies = $derived.by(() => {
		const withBanner = data.nowPlaying.filter((m: Movie) => !!m.banner);
		const priority = withBanner.filter((m: Movie) => m.label === 'PREVENTA' || m.label === 'ESTRENO');
		const rest = withBanner.filter((m: Movie) => m.label !== 'PREVENTA' && m.label !== 'ESTRENO');
		return [...priority, ...rest].slice(0, 8);
	});

	type FilterType = 'hoy' | 'eventos' | 'proximamente';
	let selectedFilter = $state<FilterType>('hoy');
	let showFullButton = $state(true);

	onMount(() => {
		if (!sectionRef) return;
		
		let intervalId: ReturnType<typeof setInterval>;

		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				// Mantenemos el botón abierto 5 segundos al entrar en pantalla
				setTimeout(() => {
					showFullButton = false;
				}, 5000);
				
				// Y luego lo recordamos expandiéndolo 4 segundos cada 20 segundos
				intervalId = setInterval(() => {
					showFullButton = true;
					setTimeout(() => {
						showFullButton = false;
					}, 4000);
				}, 20000);
				
				observer.disconnect();
			}
		}, { threshold: 0.2 });
		observer.observe(sectionRef);
		
		return () => {
			observer.disconnect();
			if (intervalId) clearInterval(intervalId);
		};
	});

	// "Hoy en pantalla": películas con al menos una función HOY (movie.showtimes
	// ya viene resuelto así desde el backend, unido entre todas las sedes en
	// +page.ts) — no solo "no es preventa", que dejaba pasar películas sin
	// ninguna función real hoy.
	let carouselMovies = $derived.by(() => {
		if (selectedFilter === 'hoy') {
			return data.nowPlaying.filter((m: Movie) => (m.showtimes?.length ?? 0) > 0);
		} else if (selectedFilter === 'eventos') {
			// El backend ya resuelve el label 'EVENTO' a partir del género
			// (ver api/v1/movies/+server.ts) — no hace falta re-chequear el
			// género acá. (Antes intentaba `m.genres?.toLowerCase()`, pero
			// genres es un arreglo en runtime, no un string: eso tronaba en
			// cualquier película con géneros reales.)
			return data.nowPlaying.filter((m: Movie) => m.label === 'EVENTO');
		} else if (selectedFilter === 'proximamente') {
			// Los verdaderos "próximos estrenos" (todavía sin función
			// programada) viven en comingSoonMovies, no en nowPlaying — antes
			// se descartaban por completo porque +page.ts nunca los traía.
			// Sumamos también las preventas/estrenos de nowPlaying (ya tienen
			// función en venta, pero siguen siendo "lo próximo" desde la
			// perspectiva del usuario).
			const alreadyOnSale = data.nowPlaying.filter(
				(m: Movie) => m.label === 'PREVENTA' || m.label === 'ESTRENO'
			);
			return [...data.comingSoonMovies, ...alreadyOnSale];
		}
		return data.nowPlaying;
	});
</script>

<svelte:head>
	<title>CINEPIC | VIVE LO INIMAGINABLE</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-black font-sans text-zinc-50 overflow-clip w-full relative">
	<SiteHeader nowPlaying={data.nowPlaying} {openMovieDetails} bind:isAnyModalOpen={headerModalOpen} />

	<NetworkHero movies={featuredMovies} onSelectMovie={openMovieDetails} />

	<!-- Catálogo combinado de todas las sedes -->
	<section class="w-full mt-12" bind:this={sectionRef}>
		<div class="mb-8 w-full border-b border-zinc-800">
			<div class="flex flex-col items-start justify-between gap-4 pb-4 px-8 md:flex-row md:items-center md:px-16 lg:px-24">
				<h3 class="font-display text-3xl tracking-wider text-white md:text-4xl shrink-0" style="transform: scaleY(1.1); transform-origin: left bottom;">
					PELÍCULAS EN CINEPIC
				</h3>
				
				<div class="flex items-center gap-6 overflow-x-auto w-full md:w-auto scrollbar-hide py-1">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a
						href="/cartelera"
						class="shrink-0 flex items-center justify-center rounded-full bg-zinc-200 text-black shadow-xl transition-all duration-500 hover:bg-white overflow-hidden h-9 {showFullButton ? 'w-[160px] px-5' : 'w-9 px-0'}"
						title="Ver Cartelera"
					>
						{#if showFullButton}
							<span class="whitespace-nowrap font-bold tracking-wider text-[11px] leading-none mt-[1px]" style="transform: scaleY(1.2); transform-origin: center;">VER CARTELERA</span>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
								<polyline points="17 2 12 7 7 2"></polyline>
							</svg>
						{/if}
					</a>

					<div class="hidden md:block w-px h-6 bg-zinc-800 ml-2"></div>

					<div class="flex items-center gap-4 text-sm font-bold tracking-wider text-zinc-500">
						<button 
							onclick={() => selectedFilter = 'hoy'}
							class="relative uppercase transition-colors whitespace-nowrap {selectedFilter === 'hoy' ? 'text-white' : 'hover:text-white'}"
							style="transform: scaleY(1.2);"
						>
							Hoy en pantalla
							{#if selectedFilter === 'hoy'}
								<div class="absolute -bottom-2 left-0 w-full h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] rounded-full"></div>
							{/if}
						</button>
						
						<div class="w-px h-3 bg-zinc-700"></div>

						<button 
							onclick={() => selectedFilter = 'eventos'}
							class="relative uppercase transition-colors whitespace-nowrap {selectedFilter === 'eventos' ? 'text-white' : 'hover:text-white'}"
							style="transform: scaleY(1.2);"
						>
							Eventos
							{#if selectedFilter === 'eventos'}
								<div class="absolute -bottom-2 left-0 w-full h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] rounded-full"></div>
							{/if}
						</button>

						<div class="w-px h-3 bg-zinc-700"></div>

						<button 
							onclick={() => selectedFilter = 'proximamente'}
							class="relative uppercase transition-colors whitespace-nowrap {selectedFilter === 'proximamente' ? 'text-white' : 'hover:text-white'}"
							style="transform: scaleY(1.2);"
						>
							Próximamente
							{#if selectedFilter === 'proximamente'}
								<div class="absolute -bottom-2 left-0 w-full h-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] rounded-full"></div>
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>

		<NowPlayingCarousel movies={carouselMovies} {openMovieDetails} isPaused={isAnyModalOpen} />
	</section>
</div>

<HeroScrolly />
<Footer />

<TheatreSelectorDialog bind:open={isTheatreSelectorOpen} {pendingMovieId} />
