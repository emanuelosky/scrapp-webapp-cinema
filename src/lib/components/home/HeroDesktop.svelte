<script lang="ts">
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { Button } from '$lib/components/ui/button';
	import HeroCarousel from '$lib/components/HeroCarousel.svelte';
	import { cinemaState } from '$lib/state/cinema.svelte';
	import type { Movie } from '$lib/types';

	let { nowPlaying }: { nowPlaying: Movie[] } = $props();

	let currentIndex = $state(0);
	let activeMovie = $derived(nowPlaying && nowPlaying.length > 0 ? nowPlaying[currentIndex] : null);
</script>

<!-- Dynamic Blurred Background -->
<div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
	{#if activeMovie}
		{#key activeMovie.id}
			<img src={activeMovie.banner || activeMovie.poster} class="w-full h-full object-cover blur-2xl opacity-70 scale-110 transition-opacity duration-1000 animate-in fade-in" alt=""/>
			<div class="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20"></div>
		{/key}
	{/if}
</div>

<div class="relative z-10 container mx-auto hidden sm:flex w-full flex-row items-center justify-between gap-6 lg:gap-12 px-4 lg:px-12">
	<div class="mt-8 flex flex-1 min-w-0 flex-col items-center text-center lg:mt-0">
		<img
			src="/logo.svg"
			alt="Cinepic Logo"
			class="mx-auto mb-2 h-16 md:h-20 w-auto object-contain drop-shadow-2xl lg:h-24"
		/>

		<h2
			class="mb-6 font-display text-4xl leading-none font-black tracking-tight text-white uppercase drop-shadow-2xl md:text-5xl lg:text-[3rem] xl:text-[3.5rem]"
		>
			{cinemaState.selectedCinema || 'Sambil Candelaria'}
		</h2>

		<div class="mx-auto mb-8 flex w-full max-w-sm items-center justify-center gap-3 text-sm text-white/90 md:text-base lg:max-w-md">
			<MapPin class="size-5 shrink-0 text-amber-500" />
			<span
				class="truncate"
				title="Centro Comercial Sambil, Av. Andrés Bello, La Candelaria, Caracas 1010"
				>C.C. Sambil La Candelaria, Caracas</span
			>
			<div class="h-5 w-px shrink-0 bg-white/30"></div>
			<a
				href="https://www.google.com/maps/search/?api=1&query=Sambil+La+Candelaria+Caracas"
				target="_blank"
				rel="external"
				class="font-bold whitespace-nowrap text-zinc-300 underline-offset-4 transition-colors hover:text-white hover:underline"
			>
				Ver Maps
			</a>
		</div>

		<div class="flex w-full flex-row flex-wrap items-center justify-center gap-4">
			<Button
				class="flex h-12 w-auto items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 px-8 text-sm font-bold text-white/90 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-white/30 hover:text-white md:text-base tracking-wide"
			>
				Comprar Entradas
			</Button>
			<Button
				class="flex h-12 w-auto items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 px-8 text-sm font-bold text-white/90 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-white/30 hover:text-white md:text-base tracking-wide"
			>
				Ver Combos
			</Button>
		</div>
	</div>

	<div class="mx-4 hidden h-[200px] xl:h-[280px] w-1 rounded-full bg-gradient-to-b from-transparent via-zinc-400/50 to-transparent xl:block xl:mx-8 shadow-[0_0_15px_rgba(255,255,255,0.1)]"></div>
	<div class="relative mt-0 flex h-full w-full flex-1 shrink-0 flex-col items-center justify-center lg:pr-4">
		<HeroCarousel movies={nowPlaying} bind:currentIndex />
	</div>
</div>
