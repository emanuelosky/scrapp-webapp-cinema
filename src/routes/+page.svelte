<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Search from '@lucide/svelte/icons/search';
	import User from '@lucide/svelte/icons/user';
	import MapPin from '@lucide/svelte/icons/map-pin';
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

	import { nowPlaying, comingSoonMovies } from '$lib/data/mockData';
	import type { Movie } from '$lib/types';
	import logo from '$lib/assets/logo.svg';

	// Estado
	let isDialogOpen = $state(false);
	let selectedMovie = $state<Movie | null>(null);

	function openMovieDetails(movie: Movie) {
		selectedMovie = movie;
		isDialogOpen = true;
	}
</script>

<div class="flex min-h-screen flex-col bg-zinc-950 pb-20 font-sans text-zinc-50">
	<!-- Sticky Header Group (Promo + Navbar) -->
	<div class="sticky top-0 z-50 flex w-full flex-col">
		<PromoBanner />

		<!-- Main Navbar -->
		<header class="w-full border-b border-zinc-800 bg-black">
		<div class="w-full px-4 md:px-8 lg:px-12">
			<!-- Upper Nav -->
			<div class="flex h-20 items-center justify-between">
				<div class="flex items-center gap-8">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href="/" class="flex items-center transition-opacity hover:opacity-90" aria-label="Cinepic Logo">
						<img src={logo} alt="Cinepic" class="h-7 w-auto object-contain" />
					</a>
					<div class="h-6 w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent"></div>
					<nav
						class="hidden items-center gap-8 text-[15px] font-bold tracking-[0.08em] text-zinc-300 md:flex"
					>
						<button class="transition-colors duration-200 hover:text-white">Ver Cartelera</button>
						<button class="transition-colors duration-200 hover:text-white"
							>Combos y dulcería</button
						>
						<button class="transition-colors duration-200 hover:text-white">Anúnciate</button>
						<button class="transition-colors duration-200 hover:text-white"
							>Trabaja con nosotros</button
						>
						<button class="transition-colors duration-200 hover:text-white">Contacto</button>
					</nav>
				</div>

				<div class="flex items-center gap-6">
					<div class="relative hidden w-64 lg:flex">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
						<Input
							type="text"
							placeholder="Buscar películas..."
							class="h-9 border border-white/10 bg-white/5 backdrop-blur-md pl-9 text-sm text-white placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-white/30"
						/>
					</div>

					<div
						class="flex items-center gap-4 text-[15px] font-bold tracking-[0.08em] text-zinc-300"
					>
						<button class="flex items-center gap-2 transition-colors duration-200 hover:text-white"
							><User class="size-4" /> Iniciar Sesión</button
						>
					</div>
				</div>
			</div>

			<!-- Lower Nav (Sub-menu) -->
			<div
				class="flex h-10 items-center justify-between border-t border-zinc-900 text-xs font-semibold text-zinc-400"
			>
				<div class="flex items-center gap-2">
					<MapPin class="size-3.5 text-white" />
					<span class="cursor-pointer text-zinc-300 hover:text-white transition-colors"
						>Selecciona tu cine preferido</span
					>
				</div>
				<div class="hidden items-center gap-6 md:flex">
					<button class="transition-colors hover:text-white">Tarjetas de Regalo</button>
					<button class="transition-colors hover:text-white">Ofertas</button>
				</div>
			</div>
		</div>
	</header>
	</div>

	<!-- Hero Section -->
	<section class="hero-banner relative flex w-full items-center overflow-hidden py-4 lg:py-6">
		<div class="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-1/2 z-20" style="background: radial-gradient(circle at 100% 0%, rgba(0,0,0,0.9) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(0,0,0,0.9) 0%, transparent 50%);"></div>

		<div
			class="relative z-10 container mx-auto flex w-full flex-col items-center justify-between gap-12 px-4 lg:flex-row lg:px-12"
		>
			<div class="mt-8 flex flex-1 flex-col items-center text-center lg:mt-0">
				<img
					src={logo}
					alt="Cinepic Logo"
					class="mx-auto mb-4 h-16 w-auto object-contain drop-shadow-2xl lg:h-20"
				/>

				<h2
					class="mb-4 font-display text-4xl leading-none font-black tracking-tight text-white uppercase drop-shadow-2xl md:text-5xl lg:text-[3rem] xl:text-[3.5rem]"
				>
					Sambil Candelaria
				</h2>

				<div
					class="mx-auto mb-8 flex w-full max-w-sm items-center justify-center gap-3 text-sm text-white/90 md:text-base lg:max-w-md"
				>
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
						Ver en Maps
					</a>
				</div>

				<div class="flex w-full flex-wrap items-center justify-center gap-4">
					<Button
						class="flex h-12 items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 px-8 text-sm font-bold text-white/90 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-white/30 hover:text-white md:text-base tracking-wide"
					>
						Comprar Entradas
					</Button>
					<Button
						class="flex h-12 items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 px-8 text-sm font-bold text-white/90 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-white/30 hover:text-white md:text-base tracking-wide"
					>
						Ver Combos
					</Button>
				</div>
			</div>

			<div
				class="mx-4 hidden h-[280px] w-1 rounded-full bg-gradient-to-b from-transparent via-amber-600/60 to-transparent lg:block xl:mx-8"
			></div>

			<div
				class="relative mt-8 flex h-full w-full flex-1 shrink-0 flex-col items-center justify-center lg:mt-0 lg:pr-4"
			>
				<HeroCarousel movies={nowPlaying} />
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
			<DateSelector />
		</div>

		<NowPlayingCarousel movies={nowPlaying} {openMovieDetails} />
	</section>
</div>

<HeroScrolly />
<UpcomingCarousel movies={comingSoonMovies} />
<Footer />
<MovieDetailsDialog bind:open={isDialogOpen} movie={selectedMovie} />
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
