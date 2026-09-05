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

	// Borde derecho de la columna negra: ondulado (varía en X según Y) en vez
	// de una línea vertical recta. La capa de difuminado usa la misma forma
	// desplazada un poco más hacia la imagen, con blur, para que la unión no
	// se note como una línea.
	const solidEdge =
		'polygon(0 0%, 32% 0%, 31% 10%, 33% 20%, 32% 30%, 34% 40%, 33% 50%, 31% 60%, 33% 70%, 32% 80%, 30% 90%, 32% 100%, 0 100%)';
	const fadeEdge =
		'polygon(0 0%, 41% 0%, 40% 10%, 42% 20%, 41% 30%, 43% 40%, 42% 50%, 40% 60%, 42% 70%, 41% 80%, 39% 90%, 41% 100%, 0 100%)';
</script>

<!--
	Desktop estilo AMC: una sola imagen a banner completo (no dos columnas).
	La columna de texto es 100% negra sólida con un borde ondulado (curvo en
	ambos ejes, no una línea vertical recta); una segunda capa negra con blur
	sobre ese mismo borde funde la unión con el banner sin taparlo demasiado.
-->
<section class="relative hidden w-full overflow-hidden border-b border-zinc-900 bg-black md:block md:h-[380px] lg:h-[440px]">
	<div class="relative h-full w-full">
		{#key movie.id}
			<TrailerBackground {movie} mode="cover" bind:isMuted bind:hasOwnClip />
		{/key}

		<!-- Columna sólida: 100% negra, borde ondulado -->
		<div class="pointer-events-none absolute inset-0 bg-black" style="clip-path: {solidEdge};"></div>

		<!-- Fusión: mismo borde desplazado hacia la imagen, difuminado -->
		<div
			class="pointer-events-none absolute inset-0 bg-black/70"
			style="clip-path: {fadeEdge}; filter: blur(28px);"
		></div>

		<div class="absolute inset-y-0 left-0 z-10 flex w-full max-w-2xl flex-col justify-center gap-6 px-10 lg:px-16">
			<div class="min-w-0">
				<h2 class="font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-white lg:text-6xl">
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
					<p class="mt-4 line-clamp-2 max-w-lg text-sm leading-relaxed text-zinc-400 lg:text-base">
						{movie.synopsis}
					</p>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				<Button
					onclick={() => onSelectMovie(movie)}
					class="h-14 flex-none rounded-full border border-white/10 bg-white/5 px-10 text-base font-bold tracking-wide text-white/90 backdrop-blur-md transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white"
				>
					Comprar Boletos
				</Button>

				{#if hasOwnClip}
					<button
						onclick={() => (isMuted = !isMuted)}
						class="flex size-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white/40"
						aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
					>
						{#if isMuted}<VolumeX class="size-5" />{:else}<Volume2 class="size-5" />{/if}
					</button>
				{:else}
					<a
						href={youtubeFallbackUrl(movie)}
						target="_blank"
						rel="noopener noreferrer"
						class="flex size-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white/40"
						aria-label="Ver tráiler"
					>
						<Play class="size-5" />
					</a>
				{/if}
			</div>
		</div>
	</div>
</section>
