<script lang="ts">

	import { Input } from '$lib/components/ui/input';
	import Search from '@lucide/svelte/icons/search';
	import User from '@lucide/svelte/icons/user';
	import MapPin from '@lucide/svelte/icons/map-pin';

	import X from '@lucide/svelte/icons/x';
	import MovieDetailsDialog from '$lib/components/MovieDetailsDialog.svelte';

	import Footer from '$lib/components/Footer.svelte';
	
	// Home Components
	import PromoBanner from '$lib/components/home/PromoBanner.svelte';
	import DateSelector from '$lib/components/home/DateSelector.svelte';
	import NowPlayingCarousel from '$lib/components/home/NowPlayingCarousel.svelte';
	import UpcomingCarousel from '$lib/components/home/UpcomingCarousel.svelte';
	import HeroDesktop from '$lib/components/home/HeroDesktop.svelte';
	import HeroMobile from '$lib/components/home/HeroMobile.svelte';
	import HeroScrolly from '$lib/components/home/HeroScrolly.svelte';
	import ScrollToTop from '$lib/components/home/ScrollToTop.svelte';
	import ComingSoonDialog from '$lib/components/ComingSoonDialog.svelte';
	import TheatreSelectorDialog from '$lib/components/TheatreSelectorDialog.svelte';
	import BrutalistMegaMenu from '$lib/components/navigation/BrutalistMegaMenu.svelte';

	import { cinemaState } from '$lib/state/cinema.svelte';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import ShoppingCartDropdown from '$lib/components/booking/ShoppingCartDropdown.svelte';
	import { bookingState } from '$lib/state/booking.svelte';

	let { data } = $props();
	let comingSoonMovies = $derived(data.comingSoonMovies);
	let activeDates = $derived(data.activeDates || []);
	import type { Movie } from '$lib/types';

	import { today, now, type DateValue } from '@internationalized/date';
	import { APP_TIMEZONE } from '$lib/utils/timezone';

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
		const tz = APP_TIMEZONE;
		if (selectedDateTab === 'hoy') return today(tz).toString();
		if (selectedDateTab === 'manana') return today(tz).add({ days: 1 }).toString();
		if (customDate) return customDate.toString();
		return today(tz).toString();
	});

	let nowPlaying = $derived.by(() => {
		const tzNow = now(APP_TIMEZONE);
		const currentStr = `${tzNow.hour.toString().padStart(2, '0')}:${tzNow.minute.toString().padStart(2, '0')}:00`;
		const todayStr = today(APP_TIMEZONE).toString();
		
		return data.nowPlaying
			.map(movie => {
				const rawDayShowtimes = movie.showtimesByDate?.[selectedDateStr] || [];
				// Si estamos viendo la fecha de "hoy", filtramos las funciones que ya pasaron
				const dayShowtimes = rawDayShowtimes.filter(s => {
					if (selectedDateStr === todayStr && s.rawTime) {
						return s.rawTime >= currentStr;
					}
					return true;
				});

				return {
					...movie,
					showtimes: dayShowtimes
				};
			})
			.filter(movie => movie.showtimes.length > 0);
	});

	$effect(() => {
		// Auto-switch to tomorrow if today has no upcoming showtimes
		if (selectedDateTab === 'hoy' && nowPlaying.length === 0) {
			// Check if 'hoy' originally had some showtimes that all passed, or if it was truly empty
			// Actually, just checking if nowPlaying is empty on 'hoy' is enough to trigger the switch to 'manana'
			// so the user sees something.
			selectedDateTab = 'manana';
		}
	});
	


	function openMovieDetails(movie: Movie) {
		selectedMovie = movie;
		isDialogOpen = true;
	}
</script>

<div class="flex min-h-screen flex-col bg-black pb-20 font-sans text-zinc-50 overflow-clip w-full relative">
	<!-- Sticky Header Group (Promo + Navbar) -->
	<div class="sticky top-0 z-50 flex w-full flex-col">
		<PromoBanner />

		<!-- Main Navbar -->
		<header class="w-full border-b border-zinc-800 bg-black relative">
		<div class="w-full px-4 md:px-8 lg:px-12">
			<!-- Upper Nav -->
			<div class="flex h-14 md:h-16 items-center justify-between static">
				<div class="flex flex-1 min-w-0 items-center gap-4 lg:gap-8 overflow-hidden h-full">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href="/" class="flex shrink-0 items-center transition-opacity hover:opacity-90" aria-label="Cinepic Logo">
						<img src="/logo.svg" alt="Cinepic" class="h-6 md:h-7 lg:h-8 w-auto object-contain" />
					</a>
					<div class="h-6 w-px bg-zinc-800 shrink-0 mx-2 md:mx-4"></div>
					<div class="h-full flex flex-1 items-center min-w-0">
						<BrutalistMegaMenu movies={nowPlaying} comingSoon={comingSoonMovies} openModal={openMovieDetails} />
					</div>
				</div>

				<div class="flex items-center gap-4 md:gap-6 pl-4 border-l border-zinc-800 ml-2">
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

					<!-- Search Icon for screens < 1350px OR when Cart is active -->
					{#if !isSearchOpen}
						<button class="flex min-[1350px]:hidden text-zinc-400 hover:text-white transition-colors {bookingState.timeRemainingSeconds !== null && bookingState.timeRemainingSeconds > 0 ? '!flex' : ''}" onclick={() => isSearchOpen = true}>
							<Search class="size-4 md:size-5" />
						</button>
					{/if}

					<!-- Full Search Bar for screens >= 1350px AND Cart is NOT active -->
					<div class="relative hidden w-48 min-[1350px]:w-64 min-[1350px]:flex {bookingState.timeRemainingSeconds !== null && bookingState.timeRemainingSeconds > 0 ? '!hidden' : ''}">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
						<Input
							type="text"
							placeholder="Buscar películas..."
							class="h-9 border border-white/10 bg-white/5 backdrop-blur-md pl-9 text-sm text-white placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-white/30 rounded-full"
						/>
					</div>

					<div
						class="flex items-center text-[12px] lg:text-[15px] font-bold tracking-[0.05em] lg:tracking-[0.08em] text-zinc-300 gap-4"
					>
						<ShoppingCartDropdown />
						<!-- Separador -->
						<div class="h-5 w-px bg-zinc-800 hidden lg:block"></div>

						<!-- Usuario / Auth -->
						<div class="flex items-center gap-3 md:gap-4 lg:pr-2">
							<button class="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors group" aria-label="Entrar">
								<User class="size-5 group-hover:scale-110 transition-transform" />
								<span class="text-[14px] md:text-[15px] font-bold hidden lg:block pt-[2px]">Entrar</span>
							</button>
							<span class="text-zinc-800 hidden lg:block">|</span>
							<button class="text-[14px] md:text-[15px] font-bold text-zinc-300 hover:text-white transition-colors hidden lg:block pt-[2px]">
								Crear Cuenta
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Lower Nav (Sub-menu) -->
			<div
				class="flex h-10 items-center justify-between border-t border-zinc-800 text-[10px] md:text-xs font-semibold text-zinc-400"
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

		<HeroDesktop {nowPlaying} />
		<HeroMobile />
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
		background: radial-gradient(circle at 75% 55%, rgba(180,83,9,0.15) 0%, rgba(0,0,0,1) 40%);
	}

	@media (max-width: 1024px) {
		.hero-banner {
			background: radial-gradient(circle at 50% 50%, rgba(180,83,9,0.1) 0%, rgba(0,0,0,1) 50%);
		}
	}
</style>


