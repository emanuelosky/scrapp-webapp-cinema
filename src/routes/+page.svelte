<script lang="ts">
	import HeroScrolly from '$lib/components/home/HeroScrolly.svelte';
	import { Button } from '$lib/components/ui/button';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Footer from '$lib/components/Footer.svelte';
	import { cinemaState } from '$lib/state/cinema.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		cinemaState.init();
	});
</script>

<svelte:head>
	<title>Cinepic | Vive lo inimaginable</title>
</svelte:head>

<!-- Splash/Selector Area -->
<div class="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
	<!-- Background Image/Video -->
	<div class="absolute inset-0 z-0">
		<div class="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black z-10"></div>
	</div>

	<div class="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full">
		<div class="w-48 md:w-64 mb-8">
			<img src="/logo.svg" alt="Cinepic" class="w-full h-auto object-contain" />
		</div>
		
		<h1 class="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl mb-6">
			VIVE LO <span class="text-transparent bg-clip-text bg-gradient-to-r from-champagne-400 to-champagne-600">INIMAGINABLE</span>
		</h1>
		
		<p class="text-zinc-400 text-lg md:text-2xl mb-12 max-w-2xl font-light">
			Selecciona tu complejo cinematográfico favorito para ver nuestra cartelera, comprar boletos y disfrutar de la mejor experiencia.
		</p>
		
		<div class="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl">
			<a href="/cines/candelaria" class="w-full sm:w-1/2">
				<Button class="w-full bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700/50 text-white font-bold py-8 rounded-full text-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 hover:border-champagne-500/50 flex flex-col items-center justify-center gap-2 group">
					<MapPin class="size-6 text-champagne-500 group-hover:scale-110 transition-transform" />
					<span>Sambil Candelaria</span>
				</Button>
			</a>
			
			<a href="/cines/lido" class="w-full sm:w-1/2">
				<Button class="w-full bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700/50 text-white font-bold py-8 rounded-full text-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 hover:border-champagne-500/50 flex flex-col items-center justify-center gap-2 group">
					<MapPin class="size-6 text-champagne-500 group-hover:scale-110 transition-transform" />
					<span>Centro Lido</span>
				</Button>
			</a>
		</div>
	</div>

	<!-- Scroll Indicator -->
	<div class="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
		<span class="text-zinc-500 text-xs uppercase tracking-widest font-bold">Eventos Corporativos</span>
		<div class="w-px h-12 bg-gradient-to-b from-champagne-500 to-transparent"></div>
	</div>
</div>

<HeroScrolly />
<Footer />
