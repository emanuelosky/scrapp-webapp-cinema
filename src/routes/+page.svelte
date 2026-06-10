<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Search from '@lucide/svelte/icons/search';
	import User from '@lucide/svelte/icons/user';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import X from '@lucide/svelte/icons/x';
	import MovieDetailsDialog from '$lib/components/MovieDetailsDialog.svelte';
	import HeroCarousel from '$lib/components/HeroCarousel.svelte';
	import Footer from '$lib/components/Footer.svelte';
	
	// Home Components
	import PromoBanner from '$lib/components/home/PromoBanner.svelte';
	import DateSelector from '$lib/components/home/DateSelector.svelte';
	import NowPlayingCarousel from '$lib/components/home/NowPlayingCarousel.svelte';
	import UpcomingCarousel from '$lib/components/home/UpcomingCarousel.svelte';
	import HeroScrolly from '$lib/components/home/HeroScrolly.svelte';
	import ScrollToTop from '$lib/components/home/ScrollToTop.svelte';
	import ComingSoonDialog from '$lib/components/ComingSoonDialog.svelte';
	import TheatreSelectorDialog from '$lib/components/TheatreSelectorDialog.svelte';

	import { cinemaState } from '$lib/state/cinema.svelte';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	let { data } = $props();
	let comingSoonMovies = $derived(data.comingSoonMovies);
	let activeDates = $derived(data.activeDates);
	import type { Movie } from '$lib/types';
	import { onMount } from 'svelte';
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';

	// Estado
	let isDialogOpen = $state(false);
	let isComingSoonOpen = $state(false);
	let isTheatreSelectorOpen = $state(false);
	let isSearchOpen = $state(false);
	let selectedMovie: Movie | null = $state(null);
	
	// Filtros de fecha
	let selectedDateTab = $state<'hoy' | 'manana' | 'custom'>('hoy');
	let customDate = $state<DateValue | undefined>();

	let selectedDateStr = $derived.by(() => {
		const tz = getLocalTimeZone();
		if (selectedDateTab === 'hoy') return today(tz).toString();
		if (selectedDateTab === 'manana') return today(tz).add({ days: 1 }).toString();
		if (customDate) return customDate.toString();
		return today(tz).toString();
	});

	let nowPlaying = $derived.by(() => {
		return data.nowPlaying
			.map(movie => {
				const hasAnyShowtimes = Object.keys(movie.showtimesByDate || {}).length > 0;
				const dayShowtimes = movie.showtimesByDate?.[selectedDateStr] || [];
				return {
					...movie,
					showtimes: dayShowtimes,
					_hasAnyShowtimes: hasAnyShowtimes
				};
			})
			.filter(movie => movie.showtimes.length > 0 || !movie._hasAnyShowtimes);
	});
	
	let heroButtonTextIndex = $state(0);
	const heroButtonTexts = [
		{ text: '¿Todavía no sabes qué hacer?', duration: 30000, isLink: false },
		{ text: '¡Compra tus entradas!', duration: 90000, isLink: true }
	];
	
	onMount(() => {
		let timeoutId: ReturnType<typeof setTimeout>;
		
		function cycleText() {
			const current = heroButtonTexts[heroButtonTextIndex];
			timeoutId = setTimeout(() => {
				heroButtonTextIndex = (heroButtonTextIndex + 1) % heroButtonTexts.length;
				cycleText();
			}, current.duration);
		}
		
		cycleText();
		return () => clearTimeout(timeoutId);
	});

	function openMovieDetails(movie: Movie) {
		selectedMovie = movie;
		isDialogOpen = true;
	}
</script>

<div class="flex min-h-screen flex-col bg-black pb-20 font-sans text-zinc-50">
	<!-- Sticky Header Group (Promo + Navbar) -->
	<div class="sticky top-0 z-50 flex w-full flex-col">
		<PromoBanner />

		<!-- Main Navbar -->
		<header class="w-full border-b border-zinc-800 bg-black">
		<div class="w-full px-4 md:px-8 lg:px-12">
			<!-- Upper Nav -->
			<div class="flex h-20 items-center justify-between">
				<div class="flex items-center gap-4 lg:gap-8 overflow-hidden">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href="/" class="flex shrink-0 items-center transition-opacity hover:opacity-90" aria-label="Cinepic Logo">
						<img src="/logo.svg" alt="Cinepic" class="h-6 md:h-7 lg:h-8 w-auto object-contain" />
					</a>
					<div class="hidden md:block h-6 w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent"></div>
					<nav
						class="flex flex-1 items-center gap-4 lg:gap-8 text-[11px] md:text-[13px] lg:text-[14px] font-bold tracking-[0.05em] whitespace-nowrap text-zinc-300 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
						style="-webkit-overflow-scrolling: touch;"
					>
						<button class="transition-colors duration-200 hover:text-white shrink-0">Ver Cartelera</button>
						<button class="transition-colors duration-200 hover:text-white shrink-0">Combos</button>
						<button class="transition-colors duration-200 hover:text-white shrink-0">Anúnciate</button>
						<button class="transition-colors duration-200 hover:text-white shrink-0">Trabaja con nosotros</button>
						<button class="transition-colors duration-200 hover:text-white shrink-0">Contacto</button>
					</nav>
				</div>

				<div class="flex items-center gap-4 md:gap-6 pl-4 border-l border-white/10 ml-2">
					<!-- Mobile Pill (only when isSearchOpen is true) -->
					{#if isSearchOpen}
						<div class="relative w-40 md:w-48 flex min-[1350px]:hidden animate-in fade-in slide-in-from-right-4 duration-300">
							<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
							<Input
								type="text"
								placeholder="Buscar..."
								class="h-9 border border-white/10 bg-white/5 backdrop-blur-md pl-9 pr-9 text-sm text-white placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-white/30 rounded-full"
							/>
							<button class="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-white" onclick={() => isSearchOpen = false}>
								<X class="size-4" />
							</button>
						</div>
					{/if}

					<!-- Search Icon for screens < 1350px -->
					{#if !isSearchOpen}
						<button class="flex min-[1350px]:hidden text-zinc-400 hover:text-white transition-colors" onclick={() => isSearchOpen = true}>
							<Search class="size-4 md:size-5" />
						</button>
					{/if}

					<!-- Full Search Bar for screens >= 1350px -->
					<div class="relative hidden w-48 min-[1350px]:w-64 min-[1350px]:flex">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
						<Input
							type="text"
							placeholder="Buscar películas..."
							class="h-9 border border-white/10 bg-white/5 backdrop-blur-md pl-9 text-sm text-white placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-white/30 rounded-full"
						/>
					</div>

					<div
						class="flex items-center text-[12px] lg:text-[15px] font-bold tracking-[0.05em] lg:tracking-[0.08em] text-zinc-300"
					>
						<button class="flex items-center gap-1.5 transition-colors duration-200 hover:text-white"
							><User class="size-4 md:size-5" /> <span class="hidden sm:inline">Iniciar Sesión</span></button
						>
					</div>
				</div>
			</div>

			<!-- Lower Nav (Sub-menu) -->
			<div
				class="flex h-10 items-center justify-between border-t border-zinc-900 text-[10px] md:text-xs font-semibold text-zinc-400"
			>
				<button class="flex items-center gap-2 group transition-colors focus:outline-none" onclick={() => isTheatreSelectorOpen = true}>
					<MapPin class="shrink-0 size-3 md:size-3.5 {cinemaState.selectedCinema ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-400 group-hover:text-white'}" />
					{#if cinemaState.isLoadingLocation}
						<span class="flex items-center gap-2 text-zinc-300">
							<Loader2 class="size-3 animate-spin shrink-0" /> Buscando...
						</span>
					{:else if cinemaState.selectedCinema}
						<span class="text-zinc-300 group-hover:text-white transition-colors font-bold tracking-wide truncate max-w-[180px] sm:max-w-[250px] md:max-w-none text-left">Cine: {cinemaState.selectedCinema}</span>
					{:else}
						<span class="text-zinc-300 group-hover:text-white transition-colors truncate max-w-[180px] sm:max-w-none">Selecciona tu cine preferido</span>
					{/if}
				</button>
				<div class="hidden items-center gap-6 md:flex">
					<button class="transition-colors hover:text-white" onclick={() => isComingSoonOpen = true}>Tarjetas de Regalo</button>
					<button class="transition-colors hover:text-white" onclick={() => isComingSoonOpen = true}>Ofertas</button>
				</div>
			</div>
		</div>
	</header>
	</div>

	<!-- Hero Section -->
	<section class="hero-banner relative flex w-full items-center overflow-hidden py-4 lg:py-6">
		<div class="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-1/2 z-20" style="background: radial-gradient(circle at 100% 0%, rgba(0,0,0,0.9) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(0,0,0,0.9) 0%, transparent 50%);"></div>

		<!-- Desktop Layout (hidden on mobile, visible on sm and up) -->
		<div class="relative z-10 container mx-auto hidden sm:flex w-full flex-row items-center justify-between gap-6 lg:gap-12 px-4 lg:px-12">
			<!-- Desktop Left Content -->
			<div class="mt-8 flex flex-1 min-w-0 flex-col items-center text-center lg:mt-0">
				<img
					src="/logo.svg"
					alt="Cinepic Logo"
					class="mx-auto mb-4 h-16 md:h-20 w-auto object-contain drop-shadow-2xl lg:h-24"
				/>

				<h2
					class="mb-4 font-display text-4xl leading-none font-black tracking-tight text-white uppercase drop-shadow-2xl md:text-5xl lg:text-[3rem] xl:text-[3.5rem]"
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
						class="font-bold whitespace-nowrap text-amber-400 underline-offset-4 transition-colors hover:text-amber-300 hover:underline"
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

			<!-- Desktop Divider & Carousel -->
			<div class="mx-4 hidden h-[200px] xl:h-[280px] w-1 rounded-full bg-gradient-to-b from-transparent via-amber-600/60 to-transparent xl:block xl:mx-8"></div>
			<div class="relative mt-0 flex h-full w-full flex-1 shrink-0 flex-col items-center justify-center lg:pr-4">
				<HeroCarousel movies={nowPlaying} />
			</div>
		</div>

		<!-- Mobile Layout (visible on mobile, hidden on sm and up) -->
		<div class="relative z-10 container mx-auto flex sm:hidden w-full flex-col items-center justify-center px-2 py-4 gap-4">
			<img
				src="/logo.svg"
				alt="Cinepic Logo"
				class="mx-auto h-20 w-auto object-contain drop-shadow-2xl"
			/>

			<h2
				class="font-display text-2xl leading-tight font-black tracking-widest text-white uppercase drop-shadow-2xl text-center"
			>
				{cinemaState.selectedCinema ? `SEDE ${cinemaState.selectedCinema}` : 'SEDE SAMBIL CANDELARIA'}
			</h2>

			<div class="relative flex h-10 w-full items-center justify-center overflow-hidden mt-2">
				{#key heroButtonTextIndex}
					<div class="absolute animate-in slide-in-from-bottom-2 fade-in duration-500 flex items-center gap-2">
						<Sparkles class="size-3 text-white drop-shadow-md" />
						{#if heroButtonTexts[heroButtonTextIndex].isLink}
							<button class="font-black tracking-widest uppercase text-xs border-b border-white hover:border-white/50 pb-0.5 transition-colors group cursor-pointer">
								<span class="text-white drop-shadow-md group-hover:opacity-80 transition-all">
									{heroButtonTexts[heroButtonTextIndex].text}
								</span>
							</button>
						{:else}
							<span class="font-black tracking-widest text-white uppercase text-xs drop-shadow-md">
								{heroButtonTexts[heroButtonTextIndex].text}
							</span>
						{/if}
						<Sparkles class="size-3 text-white drop-shadow-md" />
					</div>
				{/key}
			</div>
		</div>
	</section>

	<section class="w-full mt-12 px-4 md:px-8 lg:px-12">
		<div
			class="mb-8 flex flex-col items-start justify-between border-b border-zinc-800 pb-4 md:flex-row md:items-center"
		>
			<h3 class="mb-4 font-display text-3xl tracking-wider text-white md:mb-0 md:text-4xl pl-4 md:pl-10">
				Películas en este Cine
			</h3>
			<DateSelector bind:selectedDateTab bind:customDate {activeDates} />
		</div>

		<NowPlayingCarousel movies={nowPlaying} {openMovieDetails} />
	</section>
</div>

<HeroScrolly />
<UpcomingCarousel movies={comingSoonMovies} />
<Footer />
<MovieDetailsDialog bind:open={isDialogOpen} movie={selectedMovie} />
<ComingSoonDialog bind:open={isComingSoonOpen} />
<TheatreSelectorDialog bind:open={isTheatreSelectorOpen} />
<ScrollToTop />

<style>
	.hero-banner {
		background: radial-gradient(circle at 75% 55%, #ea580c 0%, #7c2d12 35%, #09090b 80%);
	}

	@media (max-width: 1024px) {
		.hero-banner {
			background: radial-gradient(circle at 50% 50%, #ea580c 0%, #7c2d12 40%, #09090b 90%);
		}
	}
</style>
