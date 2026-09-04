<script lang="ts">
	import HeroScrolly from '$lib/components/home/HeroScrolly.svelte';
	import { Button } from '$lib/components/ui/button';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Footer from '$lib/components/Footer.svelte';
	import SiteHeader from '$lib/components/navigation/SiteHeader.svelte';
	import { cinemaState } from '$lib/state/cinema.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		cinemaState.init();
	});

	let headerModalOpen = $state(false);
</script>

<svelte:head>
	<title>CINEPIC | VIVE LO INIMAGINABLE</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-black font-sans text-zinc-50 overflow-clip w-full relative">
	<SiteHeader openMovieDetails={() => {}} bind:isAnyModalOpen={headerModalOpen} />

	<!-- Banner Section: placeholder para publicidad de red de cines (contenido real pendiente) -->
	<section class="banner-slot relative flex w-full min-h-[60vh] md:min-h-[70vh] items-center justify-center overflow-hidden border-b border-zinc-900">
		<div class="absolute inset-0 z-0">
			<div class="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black z-10"></div>
		</div>

		<div class="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full">
			<div class="w-40 md:w-56 mb-6">
				<img src="/logo.svg" alt="Cinepic" class="w-full h-auto object-contain" />
			</div>

			<h1 class="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl mb-6">
				VIVE LO <span class="text-transparent bg-clip-text bg-gradient-to-r from-champagne-400 to-champagne-600">INIMAGINABLE</span>
			</h1>

			<p class="text-zinc-400 text-lg md:text-2xl max-w-2xl font-light">
				La mejor experiencia de cine te espera. Elige tu complejo favorito para ver cartelera, comprar boletos y más.
			</p>

			<span class="mt-8 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-zinc-700 border border-zinc-800 rounded-full px-4 py-1.5">
				Espacio publicitario de la red CINEPIC
			</span>
		</div>
	</section>

	<!-- Selector de Sede -->
	<section class="w-full py-16 md:py-20 px-6">
		<div class="max-w-4xl mx-auto flex flex-col items-center text-center">
			<h2 class="font-display text-2xl md:text-3xl tracking-wider text-white uppercase mb-3">Elige tu sede</h2>
			<p class="text-zinc-500 text-sm md:text-base mb-10 max-w-xl">
				Selecciona el complejo cinematográfico donde quieres disfrutar tu próxima película.
			</p>

			<div class="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl">
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href="/cines/candelaria" class="w-full sm:w-1/2">
					<Button class="w-full bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700/50 text-white font-bold py-8 rounded-full text-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 hover:border-champagne-500/50 flex flex-col items-center justify-center gap-2 group">
						<MapPin class="size-6 text-champagne-500 group-hover:scale-110 transition-transform" />
						<span>Sambil Candelaria</span>
					</Button>
				</a>

				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href="/cines/lido" class="w-full sm:w-1/2">
					<Button class="w-full bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700/50 text-white font-bold py-8 rounded-full text-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 hover:border-champagne-500/50 flex flex-col items-center justify-center gap-2 group">
						<MapPin class="size-6 text-champagne-500 group-hover:scale-110 transition-transform" />
						<span>Centro Lido</span>
					</Button>
				</a>
			</div>
		</div>
	</section>
</div>

<HeroScrolly />
<Footer />

<style>
	.banner-slot {
		background: radial-gradient(circle at 50% 30%, rgba(180,83,9,0.12) 0%, rgba(0,0,0,1) 55%);
	}
</style>
