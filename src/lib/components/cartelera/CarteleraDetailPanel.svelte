<script lang="ts">
	import { animate } from 'animejs';
	import Play from '@lucide/svelte/icons/play';
	import Info from '@lucide/svelte/icons/info';
	import type { Movie } from '$lib/types';
	import TrailerBackground from '$lib/components/home/TrailerBackground.svelte';
	import PromoBanner from '$lib/components/home/PromoBanner.svelte';
	import { HERO_TRAILERS_ENABLED } from '$lib/config/heroTrailers';

	let {
		movie,
		onPlayTrailer,
		onMoreInfo,
		showPromo = false
	}: {
		movie: Movie | null;
		onPlayTrailer: (movie: Movie) => void;
		onMoreInfo: (movie: Movie) => void;
		showPromo?: boolean;
	} = $props();

	let panelEl = $state<HTMLDivElement | null>(null);

	// Crossfade al cambiar de película activa (clic en una fila de la lista).
	// {#key movie.id} desmontaría y perdería la posición de scroll del panel
	// en cada cambio; animar el contenido en su lugar es más suave y barato.
	$effect(() => {
		void movie?.id;
		if (!panelEl) return;
		const anim = animate(panelEl, {
			opacity: [0, 1],
			translateY: [8, 0],
			ease: 'outQuad',
			duration: 300
		});
		return () => anim.revert();
	});
</script>

<div class="sticky top-20 h-fit">
	{#if movie}
		<div bind:this={panelEl}>
			<div class="relative w-full aspect-video bg-black overflow-hidden">
				<TrailerBackground {movie} mode="cover" isPlaying={HERO_TRAILERS_ENABLED} loop={true} />
				<button
					type="button"
					class="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group"
					aria-label="Ver tráiler"
					onclick={() => movie && onPlayTrailer(movie)}
				>
					<span class="flex size-16 items-center justify-center rounded-full border-2 border-white text-white group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
						<Play class="size-6 fill-current ml-1" />
					</span>
				</button>
			</div>

			<div class="p-6">
				<h2 class="font-display text-2xl font-black uppercase text-white leading-tight">{movie.title}</h2>
				<div class="flex items-center gap-2 text-zinc-400 text-xs font-semibold mt-1">
					{#if movie.duration}<span class="tracking-widest">{movie.duration}</span>{/if}
					{#if movie.duration && movie.rating}<span class="w-px h-2.5 bg-zinc-600"></span>{/if}
					{#if movie.rating}<span class="tracking-widest">{movie.rating}</span>{/if}
				</div>

				{#if movie.synopsis}
					<p class="text-zinc-300 text-sm leading-relaxed mt-4 line-clamp-4">{movie.synopsis}</p>
				{/if}

				<button
					type="button"
					class="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-silverplate-300 hover:text-white transition-colors"
					onclick={() => movie && onMoreInfo(movie)}
				>
					<Info class="size-4" /> Más información
				</button>
			</div>

			{#if showPromo}
				<div class="px-6 pb-6">
					<PromoBanner />
				</div>
			{/if}
		</div>
	{/if}
</div>
