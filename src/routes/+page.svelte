<script lang="ts">
	import HeroScrolly from '$lib/components/home/HeroScrolly.svelte';
	import NowPlayingCarousel from '$lib/components/home/NowPlayingCarousel.svelte';
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
</script>

<svelte:head>
	<title>CINEPIC | VIVE LO INIMAGINABLE</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-black font-sans text-zinc-50 overflow-clip w-full relative">
	<SiteHeader nowPlaying={data.nowPlaying} {openMovieDetails} bind:isAnyModalOpen={headerModalOpen} />

	<!-- Banner Section: placeholder para publicidad de red de cines (contenido real pendiente) -->
	<section class="banner-slot relative flex w-full min-h-[50vh] md:min-h-[60vh] items-center justify-center overflow-hidden border-b border-zinc-900">
		<div class="absolute inset-0 z-0">
			<div class="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black z-10"></div>
		</div>

		<div class="relative z-20 flex flex-col items-center text-center px-6">
			<div class="w-32 md:w-40 mb-4">
				<img src="/logo.svg" alt="Cinepic" class="w-full h-auto object-contain" />
			</div>
			<span class="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-zinc-700 border border-zinc-800 rounded-full px-4 py-1.5">
				Espacio publicitario de la red CINEPIC
			</span>
		</div>
	</section>

	<!-- Catálogo combinado de todas las sedes -->
	<section class="w-full mt-12">
		<div class="mb-8 w-full border-b border-zinc-800">
			<div class="pb-4 px-8 md:px-16 lg:px-24">
				<h3 class="font-display text-3xl tracking-wider text-white md:text-4xl">
					PELÍCULAS EN CINEPIC
				</h3>
			</div>
		</div>

		<NowPlayingCarousel movies={data.nowPlaying} {openMovieDetails} isPaused={isAnyModalOpen} />
	</section>
</div>

<HeroScrolly />
<Footer />

<TheatreSelectorDialog bind:open={isTheatreSelectorOpen} {pendingMovieId} />

<style>
	.banner-slot {
		background: radial-gradient(circle at 50% 30%, rgba(180,83,9,0.12) 0%, rgba(0,0,0,1) 55%);
	}
</style>
