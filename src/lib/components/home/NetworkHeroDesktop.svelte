<script lang="ts">
	import TrailerBackground from '$lib/components/home/TrailerBackground.svelte';
	import { Button } from '$lib/components/ui/button';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import Play from '@lucide/svelte/icons/play';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { Movie } from '$lib/types';

	let {
		movie,
		onSelectMovie,
		total = 1,
		currentIndex = 0,
		onNext,
		onPrev,
		onGoTo
	}: {
		movie: Movie;
		onSelectMovie: (m: Movie) => void;
		total?: number;
		currentIndex?: number;
		onNext?: () => void;
		onPrev?: () => void;
		onGoTo?: (i: number) => void;
	} = $props();

	let isMuted = $state(true);
	let hasOwnClip = $state(false);

	function youtubeFallbackUrl(m: Movie): string {
		if (m.trailerYoutubeUrl) return m.trailerYoutubeUrl;
		return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${m.title} tráiler oficial`)}`;
	}

	// Fusión: el propio borde izquierdo del banner se disuelve hacia
	// transparente, revelando el negro de la sección debajo — union limpia
	// sin degradados superpuestos ni trucos de dirección.
	const bannerMask = 'linear-gradient(to right, transparent 0%, black 10%)';
</script>

<!--
	Desktop estilo AMC + brutalismo cinematográfico: el banner se muestra
	completo, a su proporción real (16:9, nunca recortado), en su propia
	columna de ancho fijo. La zona negra es flexible y absorbe el resto del
	espacio — ahí vive la información, centrada, con un aura de color sutil
	detrás (igual técnica que HeroDesktop en las sedes).
-->
<section class="relative hidden w-full overflow-hidden border-b border-zinc-900 bg-black md:flex md:h-[300px] xl:h-[440px]">
	<!-- Zona negra: flexible, absorbe todo el ancho que el banner no necesita -->
	<div class="relative flex flex-1 items-center justify-center overflow-hidden px-6 xl:px-16">
		<!-- Aura: glow de color derivado del banner, sutil -->
		{#key movie.id}
			{#if movie.banner}
				<img
					src={movie.banner}
					alt=""
					class="pointer-events-none absolute -inset-20 h-[calc(100%+10rem)] w-[calc(100%+10rem)] scale-125 object-cover opacity-25 blur-3xl"
				/>
			{/if}
		{/key}
		<div class="pointer-events-none absolute inset-0 bg-black/60"></div>

		<div class="relative z-10 flex w-full max-w-xl flex-col gap-6">
			<div class="min-w-0">
				<h2 class="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-white xl:text-6xl">
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
					<p class="mt-4 line-clamp-2 text-sm leading-relaxed text-zinc-300 xl:text-base">
						{movie.synopsis}
					</p>
				{/if}
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<Button
					onclick={() => onSelectMovie(movie)}
					class="h-12 flex-none rounded-full border border-white/10 bg-white/5 px-6 text-sm font-bold tracking-wide text-white/90 backdrop-blur-md transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white xl:h-14 xl:px-10 xl:text-base"
				>
					Comprar Boletos
				</Button>

				{#if hasOwnClip}
					<button
						onclick={() => (isMuted = !isMuted)}
						class="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white/40 xl:size-14"
						aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
					>
						{#if isMuted}<VolumeX class="size-4 xl:size-5" />{:else}<Volume2 class="size-4 xl:size-5" />{/if}
					</button>
				{:else}
					<a
						href={youtubeFallbackUrl(movie)}
						target="_blank"
						rel="noopener noreferrer"
						class="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white/40 xl:size-14"
						aria-label="Ver tráiler"
					>
						<Play class="size-4 xl:size-5" />
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Banner: columna a su proporción real (16:9), nunca recortado. El borde
	     izquierdo se disuelve hacia el negro de la sección (fusión limpia). -->
	<div
		class="relative hidden h-full shrink-0 aspect-video md:block"
		style="mask-image: {bannerMask}; -webkit-mask-image: {bannerMask};"
	>
		{#key movie.id}
			<TrailerBackground {movie} mode="cover" bind:isMuted bind:hasOwnClip />
		{/key}

		{#if total > 1}
			<!-- Navegación: flechas + puntos, centrados abajo del banner -->
			<div class="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onclick={onPrev}
					class="pointer-events-auto size-9 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 hover:text-white"
					aria-label="Película anterior"
				>
					<ChevronLeft class="size-4" />
				</Button>

				<div class="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 backdrop-blur-md">
					{#each { length: total } as _, i (i)}
						<button
							onclick={() => onGoTo?.(i)}
							class="h-1.5 rounded-full transition-all {i === currentIndex ? 'w-5 bg-champagne-500' : 'w-1.5 bg-white/40 hover:bg-white/70'}"
							aria-label={`Ir a la película ${i + 1}`}
						></button>
					{/each}
				</div>

				<Button
					variant="ghost"
					size="icon"
					onclick={onNext}
					class="pointer-events-auto size-9 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 hover:text-white"
					aria-label="Película siguiente"
				>
					<ChevronRight class="size-4" />
				</Button>
			</div>
		{/if}
	</div>
</section>
