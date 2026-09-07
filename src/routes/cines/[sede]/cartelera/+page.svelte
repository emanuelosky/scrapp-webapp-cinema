<script lang="ts">
	import { onMount } from 'svelte';
	import { today, now, type DateValue } from '@internationalized/date';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	import Footer from '$lib/components/Footer.svelte';
	import MovieDetailsDialog from '$lib/components/MovieDetailsDialog.svelte';
	import TrailerLightbox from '$lib/components/home/TrailerLightbox.svelte';
	import DateSelector from '$lib/components/home/DateSelector.svelte';
	import CarteleraTopBar from '$lib/components/cartelera/CarteleraTopBar.svelte';
	import CarteleraSedeTrigger from '$lib/components/cartelera/CarteleraSedeTrigger.svelte';
	import CarteleraList from '$lib/components/cartelera/CarteleraList.svelte';
	import CarteleraDetailPanel from '$lib/components/cartelera/CarteleraDetailPanel.svelte';
	import { cinemaState } from '$lib/state/cinema.svelte';
	import type { Movie } from '$lib/types';

	let { data } = $props();
	let comingSoonMovies = $derived(data.comingSoonMovies as Movie[]);
	let activeDates = $derived((data.activeDates || []) as string[]);

	// La URL manda: espeja la sede activa desde el slug, igual que
	// `cines/[sede]/+page.svelte`.
	$effect(() => {
		cinemaState.syncFromUrl($page.params.sede);
	});

	onMount(() => {
		cinemaState.verifyCatalog();
	});

	let sedeDisplayName = $derived(cinemaState.selectedCinemaName ?? '');
	let currentSede = $derived($page.params.sede);

	let isDialogOpen = $state(false);
	let selectedMovie = $state<Movie | null>(null);
	let activeMovie = $state<Movie | null>(null);

	let trailerMovie = $state<Movie | null>(null);
	let trailerOpen = $state(false);

	let selectedDateTab = $state<'hoy' | 'manana' | 'custom'>('hoy');
	let customDate = $state<DateValue | undefined>();

	let selectedDateStr = $derived.by(() => {
		const tz = cinemaState.activeTimezone;
		if (selectedDateTab === 'hoy') return today(tz).toString();
		if (selectedDateTab === 'manana') return today(tz).add({ days: 1 }).toString();
		if (customDate) return customDate.toString();
		return today(tz).toString();
	});

	let filteredNowPlaying = $derived.by(() => {
		const tz = cinemaState.activeTimezone;
		const tzNow = now(tz);
		const currentStr = `${tzNow.hour.toString().padStart(2, '0')}:${tzNow.minute.toString().padStart(2, '0')}:00`;
		const todayStr = today(tz).toString();

		return (data.nowPlaying as Movie[])
			.map((movie) => {
				const rawDayShowtimes = movie.showtimesByDate?.[selectedDateStr] || [];
				const dayShowtimes = rawDayShowtimes.filter((s) => {
					if (selectedDateStr === todayStr && s.rawTime) return s.rawTime >= currentStr;
					return true;
				});
				return { ...movie, showtimes: dayShowtimes };
			})
			.filter((movie) => movie.showtimes.length > 0);
	});

	$effect(() => {
		const list = filteredNowPlaying;
		if (list.length === 0) {
			activeMovie = null;
			return;
		}
		if (!activeMovie || !list.some((m) => m.id === activeMovie!.id)) {
			activeMovie = list[0];
		}
	});

	function openMovieDetails(movie: Movie) {
		selectedMovie = movie;
		isDialogOpen = true;
	}

	function onPlayTrailer(movie: Movie) {
		trailerMovie = movie;
		trailerOpen = true;
	}

	// `/cartelera` (sin sede) manda aquí con `?pelicula=<id>` cuando el
	// usuario pidió más información antes de tener una sede resuelta -- mismo
	// mecanismo que ya usa `cines/[sede]/+page.svelte` para el caso análogo
	// del home real.
	let handledPendingMovie = $state<string | null>(null);
	$effect(() => {
		const pending = $page.url.searchParams.get('pelicula');
		if (!pending || handledPendingMovie === pending) return;

		const found =
			(data.nowPlaying as Movie[]).find((m) => String(m.id) === pending) ||
			comingSoonMovies.find((m) => String(m.id) === pending);

		handledPendingMovie = pending;
		if (found) {
			openMovieDetails(found);
		} else {
			toast.info('Esa película no está en cartelera en este cine.');
		}

		const cleaned = new URL($page.url);
		cleaned.searchParams.delete('pelicula');
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(cleaned.pathname + cleaned.search, { replaceState: true, noScroll: true, keepFocus: true });
	});
</script>

<svelte:head>
	<title>CINEPIC | CARTELERA — {sedeDisplayName.toUpperCase()}</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-black font-sans text-zinc-50">
	<CarteleraTopBar back={{ type: 'sede', sede: currentSede }} />

	<div class="sticky top-16 z-30 bg-black border-b border-zinc-800 px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
		<CarteleraSedeTrigger sedeName={sedeDisplayName} destination="cartelera" />
		<DateSelector bind:selectedDateTab bind:customDate {activeDates} accentClass="text-white" />
	</div>

	<section class="w-full px-4 md:px-8 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-x-12">
		<div class="min-w-0">
			<CarteleraList
				movies={filteredNowPlaying}
				activeMovieId={activeMovie?.id ?? null}
				onSelect={(m) => (activeMovie = m)}
				sede={currentSede}
				{selectedDateStr}
				emptyMessage="No hay funciones para esta fecha en este cine."
			/>

			{#if comingSoonMovies.length > 0}
				<h2 class="font-display text-xl tracking-wider text-white mt-12 mb-2">PRÓXIMAMENTE</h2>
				<CarteleraList
					movies={comingSoonMovies}
					activeMovieId={activeMovie?.id ?? null}
					onSelect={(m) => (activeMovie = m)}
					sede={currentSede}
					{selectedDateStr}
				/>
			{/if}
		</div>

		<div class="hidden lg:block">
			<CarteleraDetailPanel movie={activeMovie} {onPlayTrailer} onMoreInfo={openMovieDetails} showPromo={true} />
		</div>
	</section>

	<Footer />
</div>

<MovieDetailsDialog bind:open={isDialogOpen} movie={selectedMovie} />
<TrailerLightbox bind:open={trailerOpen} movie={trailerMovie} />
