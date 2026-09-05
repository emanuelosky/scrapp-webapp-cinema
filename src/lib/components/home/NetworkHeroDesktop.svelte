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

<!--
	Desktop estilo AMC: una sola imagen a banner completo (no dos columnas),
	fundida con un degradado radial (curvo en ambos ejes, no un corte vertical
	recto) hacia negro donde vive el texto. Estos banners no traen texto/logo
	propio que cubrir, así que se tratan como fondo, igual que hace TMDB/AMC.
-->
<section class="relative hidden w-full overflow-hidden border-b border-zinc-900 bg-black md:block md:h-[360px] lg:h-[420px]">
	<div class="relative h-full w-full">
		{#key movie.id}
			<TrailerBackground {movie} mode="cover" bind:isMuted bind:hasOwnClip />
		{/key}

		<!--
			Fusión curva: elipse anclada al lado del texto — su borde es curvo en
			ambos ejes (no una línea vertical recta), y se desvanece antes hacia
			la imagen para dejarla más visible.
		-->
		<div
			class="pointer-events-none absolute inset-0"
			style="background: radial-gradient(ellipse 780px 620px at 0% 50%, #000 0%, #000 32%, rgba(0,0,0,0.85) 48%, rgba(0,0,0,0.35) 66%, transparent 82%);"
		></div>

		<div class="absolute inset-y-0 left-8 z-10 flex w-fit max-w-lg flex-col justify-center gap-5 lg:left-14">
			<div class="min-w-0">
				<h2 class="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-white lg:text-5xl">
					{movie.title}
				</h2>
				{#if movie.formats || movie.rating || movie.duration}
					<div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-widest text-zinc-300">
						{#if movie.rating}<span class="flex size-6 items-center justify-center rounded-sm bg-white text-[11px] font-black text-black">{movie.rating}</span>{/if}
						{#if movie.formats?.video}<span>{movie.formats.video}</span>{/if}
						{#if movie.formats?.language}<span>{movie.formats.language}</span>{/if}
						{#if movie.duration}<span>{movie.duration}</span>{/if}
					</div>
				{/if}
				{#if movie.synopsis}
					<p class="mt-4 line-clamp-2 max-w-md text-sm leading-relaxed text-zinc-400">
						{movie.synopsis}
					</p>
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
						class="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white/40"
						aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
					>
						{#if isMuted}<VolumeX class="size-4" />{:else}<Volume2 class="size-4" />{/if}
					</button>
				{:else}
					<a
						href={youtubeFallbackUrl(movie)}
						target="_blank"
						rel="noopener noreferrer"
						class="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white/40"
						aria-label="Ver tráiler"
					>
						<Play class="size-4" />
					</a>
				{/if}
			</div>
		</div>
	</div>
</section>
