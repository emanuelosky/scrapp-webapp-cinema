<script lang="ts">
	import HeroCarousel from '$lib/components/HeroCarousel.svelte';
	import TrailerBackground from '$lib/components/home/TrailerBackground.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { Movie } from '$lib/types';

	let { movies = [], onSelectMovie }: { movies: Movie[]; onSelectMovie: (m: Movie) => void } = $props();

	let currentIndex = $state(0);
	let activeMovie = $derived(movies.length > 0 ? movies[currentIndex] : null);
</script>

<section class="relative flex w-full min-h-[55vh] md:min-h-[65vh] items-center justify-center overflow-hidden border-b border-zinc-900">
	<!-- Fondo: clip propio si existe, si no backdrop difuminado (nunca el poster) -->
	<TrailerBackground movie={activeMovie} />

	<div class="relative z-10 flex w-full max-w-5xl flex-col items-center px-6 py-12 text-center">
		<div class="mb-6 w-28 md:w-36">
			<img src="/logo.svg" alt="Cinepic" class="h-auto w-full object-contain" />
		</div>

		{#if activeMovie}
			<h2 class="mb-6 max-w-2xl font-display text-3xl font-black uppercase tracking-tight text-white drop-shadow-2xl md:text-5xl">
				{activeMovie.title}
			</h2>
			<Button
				onclick={() => onSelectMovie(activeMovie)}
				class="mb-10 h-12 rounded-full border border-white/10 bg-white/5 px-8 text-sm font-bold tracking-wide text-white/90 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white md:text-base"
			>
				Comprar Boletos
			</Button>
		{:else}
			<span class="mb-10 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700 border border-zinc-800 rounded-full px-4 py-1.5 md:text-xs">
				Espacio publicitario de la red CINEPIC
			</span>
		{/if}

		<!-- Poster: siempre nítido, sin filtros. Se congela la rotación si hay un clip propio reproduciéndose -->
		<HeroCarousel {movies} bind:currentIndex autoRotate={!activeMovie?.trailerAssetUrl} />
	</div>
</section>
