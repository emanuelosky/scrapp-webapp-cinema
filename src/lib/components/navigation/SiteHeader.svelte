<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import User from '@lucide/svelte/icons/user';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	import PromoBanner from '$lib/components/home/PromoBanner.svelte';
	import BrutalistMegaMenu from '$lib/components/navigation/BrutalistMegaMenu.svelte';
	import CommandPalette from '$lib/components/navigation/CommandPalette.svelte';
	import ComingSoonDialog from '$lib/components/ComingSoonDialog.svelte';
	import TheatreSelectorDialog from '$lib/components/TheatreSelectorDialog.svelte';
	import ShoppingCartDropdown from '$lib/components/booking/ShoppingCartDropdown.svelte';

	import { cinemaState } from '$lib/state/cinema.svelte';
	import { bookingState } from '$lib/state/booking.svelte';
	import type { Movie } from '$lib/types';

	let {
		nowPlaying = [],
		comingSoonMovies = [],
		openMovieDetails,
		isAnyModalOpen = $bindable(false)
	}: {
		nowPlaying?: Movie[];
		comingSoonMovies?: Movie[];
		openMovieDetails?: (m: Movie) => void;
		isAnyModalOpen?: boolean;
	} = $props();

	let isComingSoonOpen = $state(false);
	let isTheatreSelectorOpen = $state(false);
	let isCommandOpen = $state(false);

	$effect(() => {
		isAnyModalOpen = isComingSoonOpen || isTheatreSelectorOpen || isCommandOpen;
	});
</script>

<!-- Sticky Header Group (Promo + Navbar) -->
<div class="sticky top-0 z-50 flex w-full flex-col">
	<PromoBanner />

	<!-- Main Navbar -->
	<header class="w-full border-b border-zinc-800 bg-black relative">
	<div class="w-full px-4 md:px-8 lg:px-12 xl:px-16">
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
				<!-- Mobile Search Icon -->
				<button class="flex min-[1350px]:hidden text-zinc-400 hover:text-white transition-colors {bookingState.timeRemainingSeconds !== null && bookingState.timeRemainingSeconds > 0 ? '!flex' : ''}" onclick={() => isCommandOpen = true}>
					<Search class="size-4 md:size-5" />
				</button>

				<!-- Full Search Bar for screens >= 1350px AND Cart is NOT active -->
				<div class="relative hidden w-48 min-[1350px]:w-64 min-[1350px]:flex {bookingState.timeRemainingSeconds !== null && bookingState.timeRemainingSeconds > 0 ? '!hidden' : ''}">
					<button
						onclick={() => isCommandOpen = true}
						class="h-9 w-full flex items-center border border-zinc-800 bg-black text-zinc-400 hover:bg-white hover:text-black focus-visible:ring-1 focus-visible:ring-white/30 rounded-full cursor-pointer transition-colors group"
					>
						<Search class="ml-3 mr-2 size-4 text-zinc-500 group-hover:text-black transition-colors pointer-events-none shrink-0" />
						<span class="font-bold tracking-widest uppercase text-[10px] truncate flex-1 text-left">BUSCAR PELÍCULAS...</span>

						<div class="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity mr-1.5 shrink-0">
							<kbd class="pointer-events-none inline-flex h-6 items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 group-hover:bg-zinc-200 group-hover:border-zinc-300 px-2 font-mono text-[10px] font-medium text-zinc-400 group-hover:text-black transition-colors">
								<span class="text-xs">⌘</span>K
							</kbd>
						</div>
					</button>
				</div>

				<div
					class="flex items-center text-[12px] lg:text-[15px] font-bold tracking-[0.05em] lg:tracking-[0.08em] text-zinc-300 gap-4"
				>
					<ShoppingCartDropdown />
					<!-- Separador -->
					<div class="h-5 w-px bg-zinc-800 hidden lg:block"></div>

					<!-- Usuario / Auth -->
					<div class="flex items-center gap-3 md:gap-4 lg:pr-2">
						<button class="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors group" aria-label="Entrar">
							<div class="w-7 h-7 rounded-full border border-zinc-700 bg-zinc-900/80 flex items-center justify-center group-hover:bg-white transition-colors">
								<User class="size-3.5 group-hover:text-black transition-colors" />
							</div>
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
	</div>

	<!-- Lower Nav (Sub-menu) -->
	<div class="w-full border-t border-zinc-800">
		<div
			class="flex w-full h-10 items-center justify-between text-[10px] md:text-xs font-semibold text-zinc-400 relative px-4 md:px-8 lg:px-12 xl:px-16"
		>
				<button class="flex items-center gap-2 group transition-colors focus:outline-none z-20 bg-black pl-4 pr-2" onclick={() => isTheatreSelectorOpen = true}>
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

<ComingSoonDialog bind:open={isComingSoonOpen} />
<TheatreSelectorDialog bind:open={isTheatreSelectorOpen} />
<CommandPalette bind:open={isCommandOpen} movies={[...nowPlaying, ...comingSoonMovies]} {openMovieDetails} />
