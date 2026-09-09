<script lang="ts">
	import { today, now, type DateValue } from '@internationalized/date';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import Footer from '$lib/components/Footer.svelte';
	import TrailerLightbox from '$lib/components/home/TrailerLightbox.svelte';
	import DateSelector from '$lib/components/home/DateSelector.svelte';
	import UpcomingCarousel from '$lib/components/home/UpcomingCarousel.svelte';
	import CarteleraTopBar from '$lib/components/cartelera/CarteleraTopBar.svelte';
	import CarteleraSedeTrigger from '$lib/components/cartelera/CarteleraSedeTrigger.svelte';
	import CarteleraSearch from '$lib/components/cartelera/CarteleraSearch.svelte';
	import CarteleraChapters from '$lib/components/cartelera/CarteleraChapters.svelte';
	import { cinemaState } from '$lib/state/cinema.svelte';
	import { matchesSearch } from '$lib/utils/carteleraSearch';
	import type { Movie } from '$lib/types';

	let { data } = $props();

	// El load() ya resolvió la sede y trajo su cartelera: la página puede pintar
	// con datos desde el primer frame, sin esperar a montar.
	// `cinemaState.syncFromUrl` NO se llama aquí a propósito: esta ruta no tiene
	// [sede] en la URL, así que el resto de la app (header, etc.) debe seguir
	// viéndose como "sin sede", aunque acá adentro sí trabajemos con una.
	// Derivados de `data`, no copias en $state: cuando la verificación del
	// catálogo detecta divergencia, +layout.svelte llama a invalidateAll() y
	// este load() (que declara depends('app:cinemas')) se vuelve a ejecutar ya
	// con el catálogo corregido. Una copia en $state se habría quedado con los
	// datos viejos, y además el load() reresuelve la sede solo, así que tampoco
	// hace falta un efecto que vuelva a pedir la cartelera desde acá.
	let activeSedeId = $derived(data.sedeId);
	let nowPlaying = $derived(data.nowPlaying);
	let comingSoonMovies = $derived(data.comingSoonMovies);
	let activeDates = $derived(data.activeDates);

	let sedeActiva = $derived(cinemaState.cinemas.find((c) => c.id === activeSedeId));
	let sedeDisplayName = $derived(sedeActiva?.name ?? sedeActiva?.short_name ?? '');
	let sedeShortName = $derived(sedeActiva?.short_name ?? sedeActiva?.name ?? '');

	// Alto real del grupo sticky (header + filtros): las tarjetas lo usan
	// como línea de reposo en vez de un valor inventado.
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

		return nowPlaying
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

	function onPlayTrailer(movie: Movie) {
		trailerMovie = movie;
		trailerOpen = true;
	}

	// "Ficha completa" no abre MovieDetailsDialog aquí: ese diálogo reserva
	// vía `$page.params.sede`, que en esta ruta no existe (no tiene [sede] en
	// la URL). Como ya sabemos la sede activa, mandamos directo a su
	// cartelera -- que sí tiene el diálogo real -- con `?pelicula=` para que
	// se abra sola ahí (mismo mecanismo que ya usa el home real).
	function onMoreInfo(movie: Movie) {
		if (!activeSedeId) return;
		goto(resolve(`/cines/${activeSedeId}/cartelera?pelicula=${encodeURIComponent(String(movie.id))}`));
	}
</script>

<svelte:head>
	<title>CINEPIC | CARTELERA</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-black font-sans text-zinc-50">
	<!-- Sin PromoBanner acá: `activePromo` solo existe con una sede en la URL
	     (ver +layout.ts), y esta ruta nunca la tiene. Mismo contenedor sticky
	     que la página de sede igual, para que ambas queden estructuralmente
	     análogas. -->
	<div class="sticky top-0 z-40 flex w-full flex-col" bind:clientHeight={headerHeight}>
		<!-- En móvil (< sm) la fila "Cartelera" no se muestra: eran 64px fijos
		     de una pantalla de 812. La flecha de volver baja a la fila de
		     filtros (misma lógica de destino, variant="icon") y el selector de
		     fecha ocupa su propia fila a lo ancho. -->
		<div class="hidden sm:block"><CarteleraTopBar back={{ type: 'home' }} /></div>
		<div class="bg-black border-b border-zinc-800 px-4 md:px-8 py-3 flex flex-wrap items-center gap-3">
			<div class="sm:hidden"><CarteleraTopBar back={{ type: 'home' }} variant="icon" /></div>
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
			sede={activeSedeId ?? undefined}
			{selectedDateStr}
			{onPlayTrailer}
			{onMoreInfo}
			{emptyMessage}
			{headerHeight}
			ambientPaused={trailerOpen}
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

<TrailerLightbox bind:open={trailerOpen} movie={trailerMovie} />
