<script lang="ts">
	import TrailerBackground from '$lib/components/home/TrailerBackground.svelte';
	import { Button } from '$lib/components/ui/button';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import Play from '@lucide/svelte/icons/play';
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

	// Auto-rotación, pausada mientras haya un clip propio reproduciéndose
	$effect(() => {
		if (movies.length <= 1 || hasOwnClip) return;
		const interval = setInterval(() => {
			currentIndex = (currentIndex + 1) % movies.length;
		}, 12000);
		return () => clearInterval(interval);
	});
</script>

{#if activeMovie}
	<section class="relative flex w-full flex-col border-b border-zinc-900 bg-black md:flex-row-reverse md:h-[340px] lg:h-[420px]">
		<!-- Imagen: en su propia columna, siempre completa, nunca tapada ni recortada -->
		<div class="h-[200px] sm:h-[260px] md:h-full md:flex-1">
			{#key activeMovie.id}
				<TrailerBackground movie={activeMovie} bind:isMuted bind:hasOwnClip />
			{/key}
		</div>

		<!-- Info: columna aparte, nunca superpuesta a la imagen -->
		<div class="flex flex-col justify-center gap-4 px-6 py-6 text-center md:w-[380px] md:shrink-0 md:px-10 md:text-left lg:w-[440px]">
			<div class="min-w-0">
				<h2 class="font-display text-2xl font-black uppercase leading-tight tracking-tight text-white md:text-3xl lg:text-4xl">
					{activeMovie.title}
				</h2>
				{#if activeMovie.formats || activeMovie.rating || activeMovie.duration}
					<div class="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 md:justify-start">
						{#if activeMovie.rating}<span class="flex size-5 items-center justify-center rounded-sm bg-white text-[10px] font-black text-black">{activeMovie.rating}</span>{/if}
						{#if activeMovie.formats?.video}<span>{activeMovie.formats.video}</span>{/if}
						{#if activeMovie.formats?.language}<span>{activeMovie.formats.language}</span>{/if}
						{#if activeMovie.duration}<span>{activeMovie.duration}</span>{/if}
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-center gap-3 md:justify-start">
				<Button
					onclick={() => onSelectMovie(activeMovie)}
					class="h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-6 text-xs font-bold tracking-wide text-white/90 backdrop-blur-md transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white md:flex-none md:text-sm"
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
	</section>
{/if}
