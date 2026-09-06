<script lang="ts">
	import NetworkHeroMobile from '$lib/components/home/NetworkHeroMobile.svelte';
	import NetworkHeroDesktop from '$lib/components/home/NetworkHeroDesktop.svelte';
	import type { Movie } from '$lib/types';

	let { movies = [], onSelectMovie }: { movies: Movie[]; onSelectMovie: (m: Movie) => void } = $props();

	let currentIndex = $state(0);
	let activeMovie = $derived(movies.length > 0 ? movies[currentIndex] : null);

	// true mientras la película activa tiene un clip propio reproduciéndose
	// (lo reporta la variante mobile o desktop, la que esté visible). Se
	// resetea al cambiar de película para no arrastrar el estado anterior.
	let activeHasClip = $state(false);
	let lightboxOpen = $state(false);
	$effect(() => {
		void activeMovie?.id;
		activeHasClip = false;
	});

	function goTo(i: number) {
		currentIndex = ((i % movies.length) + movies.length) % movies.length;
	}
	function next() {
		goTo(currentIndex + 1);
	}
	function prev() {
		goTo(currentIndex - 1);
	}

	// Auto-rotación cada 12s, solo para banners sin clip propio — con clip,
	// el avance lo dispara onClipEnded al terminar el tráiler (o el usuario
	// con las flechas), para no cortarlo a la mitad.
	$effect(() => {
		if (movies.length <= 1 || activeHasClip || lightboxOpen) return;
		const interval = setInterval(next, 12000);
		return () => clearInterval(interval);
	});
</script>

{#if activeMovie}
	<NetworkHeroMobile
		movie={activeMovie}
		{onSelectMovie}
		onClipStateChange={(v) => (activeHasClip = v)}
		onClipEnded={next}
		onNext={next}
		onPrev={prev}
		bind:lightboxOpen
	/>
	<NetworkHeroDesktop
		movie={activeMovie}
		{onSelectMovie}
		total={movies.length}
		{currentIndex}
		onNext={next}
		onPrev={prev}
		onGoTo={goTo}
		onClipStateChange={(v) => (activeHasClip = v)}
		onClipEnded={next}
		bind:lightboxOpen
	/>
{/if}
