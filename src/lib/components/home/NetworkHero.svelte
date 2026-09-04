<script lang="ts">
	import TrailerBackground from '$lib/components/home/TrailerBackground.svelte';
	import { Button } from '$lib/components/ui/button';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import Play from '@lucide/svelte/icons/play';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { Movie } from '$lib/types';

	let { movies = [], onSelectMovie }: { movies: Movie[]; onSelectMovie: (m: Movie) => void } = $props();

	let currentIndex = $state(0);
	let activeMovie = $derived(movies.length > 0 ? movies[currentIndex] : null);

	let isMuted = $state(true);
	let hasOwnClip = $state(false);

	function youtubeFallbackUrl(m: Movie): string {
		if (m.trailerYoutubeUrl) return m.trailerYoutubeUrl;
		return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${m.title} tráiler oficial`)}`;
	}

	function next() {
		if (movies.length === 0) return;
		currentIndex = (currentIndex + 1) % movies.length;
	}

	function prev() {
		if (movies.length === 0) return;
		currentIndex = (currentIndex - 1 + movies.length) % movies.length;
	}

	// Auto-rotación cada 6s, pausada mientras haya un clip propio reproduciéndose
	$effect(() => {
		if (movies.length <= 1 || hasOwnClip) return;
		const interval = setInterval(next, 6000);
		return () => clearInterval(interval);
	});
</script>

{#if activeMovie}
	<section class="relative w-full border-b border-zinc-900 bg-black">
		{#key activeMovie.id}
			<TrailerBackground movie={activeMovie} bind:isMuted bind:hasOwnClip />
		{/key}

		<!-- Controles: SIEMPRE debajo del medio, nunca superpuestos -->
		<div class="flex flex-col items-center gap-4 px-6 py-6 text-center md:flex-row md:justify-between md:text-left lg:px-16">
			<div class="min-w-0">
				<h2 class="truncate font-display text-xl font-black uppercase tracking-tight text-white md:text-2xl">
					{activeMovie.title}
				</h2>
			</div>

			<div class="flex shrink-0 items-center gap-3">
				<Button
					onclick={() => onSelectMovie(activeMovie)}
					class="h-11 rounded-full border border-white/10 bg-white/5 px-6 text-xs font-bold tracking-wide text-white/90 backdrop-blur-md transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white md:text-sm"
				>
					Comprar Boletos
				</Button>

				{#if hasOwnClip}
					<button
						onclick={() => (isMuted = !isMuted)}
						class="flex size-11 shrink-0 items-center justify-center rounded-full border border-zinc-800 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
						aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
					>
						{#if isMuted}<VolumeX class="size-4" />{:else}<Volume2 class="size-4" />{/if}
					</button>
				{:else}
					<a
						href={youtubeFallbackUrl(activeMovie)}
						target="_blank"
						rel="noopener noreferrer"
						class="flex size-11 shrink-0 items-center justify-center rounded-full border border-zinc-800 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
						aria-label="Ver tráiler"
					>
						<Play class="size-4" />
					</a>
				{/if}
			</div>
		</div>

		{#if movies.length > 1}
			<!-- Navegación: puntos + flechas -->
			<div class="flex items-center justify-center gap-6 pb-6">
				<button onclick={prev} class="text-zinc-600 transition-colors hover:text-white" aria-label="Anterior">
					<ChevronLeft class="size-5" />
				</button>
				<div class="flex items-center gap-2">
					{#each movies as m, i (m.id)}
						<button
							onclick={() => (currentIndex = i)}
							class="size-1.5 rounded-full transition-all {i === currentIndex ? 'w-5 bg-champagne-500' : 'bg-zinc-700 hover:bg-zinc-500'}"
							aria-label={`Ver ${m.title}`}
						></button>
					{/each}
				</div>
				<button onclick={next} class="text-zinc-600 transition-colors hover:text-white" aria-label="Siguiente">
					<ChevronRight class="size-5" />
				</button>
			</div>
		{/if}
	</section>
{/if}
