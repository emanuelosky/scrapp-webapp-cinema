<script lang="ts">
	import NetworkHeroMobile from '$lib/components/home/NetworkHeroMobile.svelte';
	import NetworkHeroDesktop from '$lib/components/home/NetworkHeroDesktop.svelte';
	import type { Movie } from '$lib/types';

	let { movies = [], onSelectMovie }: { movies: Movie[]; onSelectMovie: (m: Movie) => void } = $props();

	let currentIndex = $state(0);
	let activeMovie = $derived(movies.length > 0 ? movies[currentIndex] : null);

	function goTo(i: number) {
		currentIndex = ((i % movies.length) + movies.length) % movies.length;
	}
	function next() {
		goTo(currentIndex + 1);
	}
	function prev() {
		goTo(currentIndex - 1);
	}

	// Auto-rotación cada 12s. NetworkHeroMobile/Desktop manejan su propio
	// clip/mute internamente, así que aquí no se pausa por eso todavía —
	// pendiente si algún día importa (hoy no hay clips propios reales).
	$effect(() => {
		if (movies.length <= 1) return;
		const interval = setInterval(next, 12000);
		return () => clearInterval(interval);
	});
</script>

{#if activeMovie}
	<NetworkHeroMobile movie={activeMovie} {onSelectMovie} />
	<NetworkHeroDesktop
		movie={activeMovie}
		{onSelectMovie}
		total={movies.length}
		{currentIndex}
		onNext={next}
		onPrev={prev}
		onGoTo={goTo}
	/>
{/if}
