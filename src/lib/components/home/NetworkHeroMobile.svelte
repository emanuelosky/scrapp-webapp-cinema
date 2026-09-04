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

<!-- Mobile: banner como fondo ambiental, póster + info superpuestos -->
<section class="relative h-[440px] w-full overflow-hidden border-b border-zinc-900 bg-black md:hidden">
	{#key movie.id}
		<div class="absolute inset-0">
			<TrailerBackground {movie} mode="cover" bind:isMuted bind:hasOwnClip />
			<div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10"></div>
		</div>
	{/key}

	<div class="relative z-10 flex h-full flex-col justify-end gap-4 p-5">
		<div class="flex items-end gap-4">
			<img
				src={movie.poster}
				alt={movie.title}
				class="aspect-[2/3] w-20 shrink-0 rounded-sm object-cover shadow-2xl"
			/>
			<div class="min-w-0 flex-1">
				<h2 class="font-display text-2xl font-black uppercase leading-tight tracking-tight text-white drop-shadow-lg">
					{movie.title}
				</h2>
				{#if movie.formats || movie.rating || movie.duration}
					<div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-300">
						{#if movie.rating}<span class="flex size-4 items-center justify-center rounded-sm bg-white text-[9px] font-black text-black">{movie.rating}</span>{/if}
						{#if movie.formats?.video}<span>{movie.formats.video}</span>{/if}
						{#if movie.duration}<span>{movie.duration}</span>{/if}
					</div>
				{/if}
			</div>
		</div>

		<div class="flex items-center gap-3">
			<Button
				onclick={() => onSelectMovie(movie)}
				class="h-11 flex-1 rounded-full border border-white/10 bg-white/10 text-xs font-bold tracking-wide text-white backdrop-blur-md transition-all hover:bg-white/20"
			>
				Comprar Boletos
			</Button>

			{#if hasOwnClip}
				<button
					onclick={() => (isMuted = !isMuted)}
					class="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md"
					aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
				>
					{#if isMuted}<VolumeX class="size-4" />{:else}<Volume2 class="size-4" />{/if}
				</button>
			{:else}
				<a
					href={youtubeFallbackUrl(movie)}
					target="_blank"
					rel="noopener noreferrer"
					class="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md"
					aria-label="Ver tráiler"
				>
					<Play class="size-4" />
				</a>
			{/if}
		</div>
	</div>
</section>
