<script lang="ts">
	import TrailerBackground from '$lib/components/home/TrailerBackground.svelte';
	import { Button } from '$lib/components/ui/button';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import Play from '@lucide/svelte/icons/play';
	import type { Movie } from '$lib/types';

	let { movie, onSelectMovie }: { movie: Movie; onSelectMovie: (m: Movie) => void } = $props();

	let isMuted = $state(true);
	let hasOwnClip = $state(false);

	function youtubeFallbackUrl(m: Movie): string {
		if (m.trailerYoutubeUrl) return m.trailerYoutubeUrl;
		return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${m.title} tráiler oficial`)}`;
	}
</script>

<!-- Desktop: layout partido, centrado a ancho máximo, banner fusionado con el panel de texto -->
<section class="relative hidden w-full border-b border-zinc-900 bg-black md:block">
	<div class="mx-auto flex w-full max-w-[1600px] flex-row-reverse md:h-[380px] lg:h-[460px]">
		<div class="relative h-full flex-1 overflow-hidden">
			{#key movie.id}
				<TrailerBackground {movie} mode="contain" bind:isMuted bind:hasOwnClip />
			{/key}
			<!-- Fusión: difumina el banner hacia negro en el borde que toca el panel de texto -->
			<div class="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black to-transparent"></div>
		</div>

		<div class="flex flex-col justify-center gap-5 px-10 py-8 md:w-[420px] md:shrink-0 lg:w-[520px] lg:px-14">
			<div class="min-w-0">
				<h2 class="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-white lg:text-5xl">
					{movie.title}
				</h2>
				{#if movie.formats || movie.rating || movie.duration}
					<div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
						{#if movie.rating}<span class="flex size-6 items-center justify-center rounded-sm bg-white text-[11px] font-black text-black">{movie.rating}</span>{/if}
						{#if movie.formats?.video}<span>{movie.formats.video}</span>{/if}
						{#if movie.formats?.language}<span>{movie.formats.language}</span>{/if}
						{#if movie.duration}<span>{movie.duration}</span>{/if}
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				<Button
					onclick={() => onSelectMovie(movie)}
					class="h-12 flex-none rounded-full border border-white/10 bg-white/5 px-8 text-sm font-bold tracking-wide text-white/90 backdrop-blur-md transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white"
				>
					Comprar Boletos
				</Button>

				{#if hasOwnClip}
					<button
						onclick={() => (isMuted = !isMuted)}
						class="flex size-12 shrink-0 items-center justify-center rounded-full border border-zinc-800 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
						aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
					>
						{#if isMuted}<VolumeX class="size-4" />{:else}<Volume2 class="size-4" />{/if}
					</button>
				{:else}
					<a
						href={youtubeFallbackUrl(movie)}
						target="_blank"
						rel="noopener noreferrer"
						class="flex size-12 shrink-0 items-center justify-center rounded-full border border-zinc-800 text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
						aria-label="Ver tráiler"
					>
						<Play class="size-4" />
					</a>
				{/if}
			</div>
		</div>
	</div>
</section>
