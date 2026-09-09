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
	import PromoBanner from '$lib/components/home/PromoBanner.svelte';
	import UpcomingCarousel from '$lib/components/home/UpcomingCarousel.svelte';
	import CarteleraTopBar from '$lib/components/cartelera/CarteleraTopBar.svelte';
	import CarteleraSedeTrigger from '$lib/components/cartelera/CarteleraSedeTrigger.svelte';
	import CarteleraSearch from '$lib/components/cartelera/CarteleraSearch.svelte';
	import CarteleraChapters from '$lib/components/cartelera/CarteleraChapters.svelte';
	import { cinemaState } from '$lib/state/cinema.svelte';
	import { matchesSearch } from '$lib/utils/carteleraSearch';
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
	let sedeShortName = $derived(cinemaState.selectedCinemaShortName ?? '');
	let currentSede = $derived($page.params.sede);

	let isDialogOpen = $state(false);
	let selectedMovie = $state<Movie | null>(null);
	// Alto real del grupo sticky (promo + header + filtros): las tarjetas lo
	// usan como línea de reposo en vez de un valor inventado. Cambia solo
	// cuando el PromoBanner carga o la barra de filtros hace wrap en móvil.
	let headerHeight = $state(0);

	let trailerMovie = $state<Movie | null>(null);
	let trailerOpen = $state(false);

	let selectedDateTab = $state<'hoy' | 'manana' | 'custom'>('hoy');
	let customDate = $state<DateValue | undefined>();
	let searchQuery = $state('');

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
			.filter((movie) => matchesSearch(movie, searchQuery))
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

	let filteredComingSoon = $derived(comingSoonMovies.filter((movie) => matchesSearch(movie, searchQuery)));

	let emptyMessage = $derived(
		searchQuery.trim()
			? `No encontramos "${searchQuery.trim()}" en esta sede.`
			: 'No hay funciones para esta fecha en este cine.'
	);

	function openMovieDetails(movie: Movie) {
		selectedMovie = movie;
		isDialogOpen = true;
	}

	function onPlayTrailer(movie: Movie) {
		trailerMovie = movie;
		trailerOpen = true;
	}

	// `/cartelera` (sin sede) manda aquí con `?pelicula=<id>` cuando el
	// usuario pidió la ficha completa antes de tener una sede resuelta --
	// mismo mecanismo que ya usa `cines/[sede]/+page.svelte` para el caso
	// análogo del home real.
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
	<!-- Un solo contenedor sticky para promo + header + filtros -- mismo
	     patrón que SiteHeader.svelte usa para el resto del sitio. Antes el
	     PromoBanner vivía suelto (no sticky) y desaparecía en el primer
	     scroll; agrupándolo acá se queda fijo mientras esté disponible, sin
	     depender de calcular su alto (que varía según el texto). -->
	<div class="sticky top-0 z-40 flex w-full flex-col" bind:clientHeight={headerHeight}>
		<PromoBanner />
		<!-- En móvil (< sm) la fila "Cartelera" no se muestra: eran 64px fijos
		     de una pantalla de 812. La flecha de volver baja a la fila de
		     filtros (misma lógica de destino, variant="icon") y el selector de
		     fecha ocupa su propia fila a lo ancho. -->
		<div class="hidden sm:block"><CarteleraTopBar back={{ type: 'sede', sede: currentSede }} /></div>
		<div class="bg-black border-b border-zinc-800 px-4 md:px-8 py-3 flex flex-wrap items-center gap-3">
			<div class="sm:hidden"><CarteleraTopBar back={{ type: 'sede', sede: currentSede }} variant="icon" /></div>
			<CarteleraSedeTrigger sedeName={sedeDisplayName} {sedeShortName} destination="cartelera" />
			<CarteleraSearch bind:query={searchQuery} />
			<div class="ml-auto w-full sm:w-auto">
				<DateSelector bind:selectedDateTab bind:customDate {activeDates} accentClass="text-white" />
			</div>
		</div>
	</div>

	<section class="w-full">
		<CarteleraChapters
			movies={filteredNowPlaying}
			sede={currentSede}
			{selectedDateStr}
			{onPlayTrailer}
			onMoreInfo={openMovieDetails}
			{emptyMessage}
			{headerHeight}
			ambientPaused={trailerOpen || isDialogOpen}
		/>
	</section>

	<!-- Próximamente: el carrusel tradicional (el mismo que ya usan las
	     sedes), no más tarjetas de pantalla completa -- esta sección no tiene
	     horarios reales que mostrar, así que no necesita el mismo tratamiento. -->
	{#if filteredComingSoon.length > 0}
		<UpcomingCarousel movies={filteredComingSoon} isPaused={trailerOpen} />
	{/if}

	<Footer />
</div>

<MovieDetailsDialog bind:open={isDialogOpen} movie={selectedMovie} />
<TrailerLightbox bind:open={trailerOpen} movie={trailerMovie} />
