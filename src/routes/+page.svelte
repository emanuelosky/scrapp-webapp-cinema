<script lang="ts">
	import HeroScrolly from '$lib/components/home/HeroScrolly.svelte';
	import NowPlayingCarousel from '$lib/components/home/NowPlayingCarousel.svelte';
	import NetworkHero from '$lib/components/home/NetworkHero.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SiteHeader from '$lib/components/navigation/SiteHeader.svelte';
	import TheatreSelectorDialog from '$lib/components/TheatreSelectorDialog.svelte';
	import type { Movie } from '$lib/types';

	let { data } = $props();

	let headerModalOpen = $state(false);
	let isTheatreSelectorOpen = $state(false);
	let pendingMovieId = $state<string | undefined>(undefined);

	// Al elegir una película sin sede seleccionada, pedimos primero el cine
	// (TheatreSelectorDialog navega directo al booking de esa sede al elegir).
	function openMovieDetails(movie: Movie) {
		pendingMovieId = String(movie.id);
		isTheatreSelectorOpen = true;
	}

	let isAnyModalOpen = $derived(headerModalOpen || isTheatreSelectorOpen);

	// Destacadas para el hero: preventas/estrenos primero (ya vienen ordenadas así desde la API),
	// tope de 8 para no alargar demasiado la rotación.
	let featuredMovies = $derived.by(() => {
		const priority = data.nowPlaying.filter((m: Movie) => m.label === 'PREVENTA' || m.label === 'ESTRENO');
		const rest = data.nowPlaying.filter((m: Movie) => m.label !== 'PREVENTA' && m.label !== 'ESTRENO');
		return [...priority, ...rest].slice(0, 8);
	});
</script>

<svelte:head>
	<title>CINEPIC | VIVE LO INIMAGINABLE</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-black font-sans text-zinc-50 overflow-clip w-full relative">
	<SiteHeader nowPlaying={data.nowPlaying} {openMovieDetails} bind:isAnyModalOpen={headerModalOpen} />

	<NetworkHero movies={featuredMovies} onSelectMovie={openMovieDetails} />

	<!-- Catálogo combinado de todas las sedes -->
	<section class="w-full mt-12">
		<div class="mb-8 w-full border-b border-zinc-800">
			<div class="flex flex-col items-start justify-between gap-4 pb-4 px-8 md:flex-row md:items-center md:px-16 lg:px-24">
				<h3 class="font-display text-3xl tracking-wider text-white md:text-4xl">
					PELÍCULAS EN CINEPIC
				</h3>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a
					href="/cartelera"
					class="shrink-0 rounded-full border border-zinc-700 px-5 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-champagne-500/50 hover:text-white"
				>
					Ver Cartelera
				</a>
			</div>
		</div>

		<NowPlayingCarousel movies={data.nowPlaying} {openMovieDetails} isPaused={isAnyModalOpen} />
	</section>
</div>

<HeroScrolly />
<Footer />

<TheatreSelectorDialog bind:open={isTheatreSelectorOpen} {pendingMovieId} />
