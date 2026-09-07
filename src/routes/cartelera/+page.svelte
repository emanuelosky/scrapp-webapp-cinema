<script lang="ts">
	import { onMount } from 'svelte';
	import { today, now, type DateValue } from '@internationalized/date';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import Footer from '$lib/components/Footer.svelte';
	import TrailerLightbox from '$lib/components/home/TrailerLightbox.svelte';
	import DateSelector from '$lib/components/home/DateSelector.svelte';
	import CarteleraTopBar from '$lib/components/cartelera/CarteleraTopBar.svelte';
	import CarteleraSedeTrigger from '$lib/components/cartelera/CarteleraSedeTrigger.svelte';
	import CarteleraList from '$lib/components/cartelera/CarteleraList.svelte';
	import CarteleraDetailPanel from '$lib/components/cartelera/CarteleraDetailPanel.svelte';
	import { cinemaState } from '$lib/state/cinema.svelte';
	import type { Movie } from '$lib/types';

	onMount(() => {
		cinemaState.verifyCatalog();
	});

	// Sede activa elegida sola al entrar (preferida, si no la primera) -- ver
	// nota en +page.ts sobre por qué ya no se agregan varias sedes a la vez.
	// `cinemaState.syncFromUrl` NO se llama aquí a propósito: esta ruta no
	// tiene [sede] en la URL, así que el resto de la app (header, etc.) debe
	// seguir viéndose como "sin sede", aunque acá adentro sí trabajemos con
	// una internamente para poder mostrar horarios reales.
	let activeSedeId = $state<string | null>(null);
	$effect(() => {
		if (activeSedeId || cinemaState.cinemas.length === 0) return;
		const preferred = cinemaState.preferredCinemaId;
		activeSedeId = preferred && cinemaState.isKnownCinema(preferred) ? preferred : cinemaState.cinemas[0].id;
	});

	let sedeDisplayName = $derived(
		cinemaState.cinemas.find((c) => c.id === activeSedeId)?.name ??
			cinemaState.cinemas.find((c) => c.id === activeSedeId)?.short_name ??
			''
	);

	let nowPlaying = $state<Movie[]>([]);
	let comingSoonMovies = $state<Movie[]>([]);
	let activeDates = $state<string[]>([]);

	// El fetch vive acá (no en el load()) porque la sede activa puede cambiar
	// sin navegar -- elegir otra sede en el diálogo SÍ navega (a
	// /cines/<sede>/cartelera, ver CarteleraSedeTrigger), pero la primera
	// resolución automática al entrar no debe empujar una URL nueva.
	$effect(() => {
		const sedeId = activeSedeId;
		if (!sedeId) return;
		const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5174';
		fetch(`${API_URL}/api/v1/movies?location_id=${sedeId}`)
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (!data) return;
				nowPlaying = data.nowPlaying || [];
				comingSoonMovies = data.comingSoonMovies || [];
				activeDates = data.activeDates || [];
			})
			.catch((e) => console.error('Error fetching movies:', e));
	});

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

		return nowPlaying
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

	function onPlayTrailer(movie: Movie) {
		trailerMovie = movie;
		trailerOpen = true;
	}

	// "Más información" no abre MovieDetailsDialog aquí: ese diálogo reserva
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
	<CarteleraTopBar back={{ type: 'home' }} />

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
				sede={activeSedeId ?? undefined}
				{selectedDateStr}
				emptyMessage="No hay funciones para esta fecha en este cine."
			/>

			{#if comingSoonMovies.length > 0}
				<h2 class="font-display text-xl tracking-wider text-white mt-12 mb-2">PRÓXIMAMENTE</h2>
				<CarteleraList
					movies={comingSoonMovies}
					activeMovieId={activeMovie?.id ?? null}
					onSelect={(m) => (activeMovie = m)}
					sede={activeSedeId ?? undefined}
					{selectedDateStr}
				/>
			{/if}
		</div>

		<div class="hidden lg:block">
			<CarteleraDetailPanel movie={activeMovie} {onPlayTrailer} {onMoreInfo} />
		</div>
	</section>

	<Footer />
</div>

<TrailerLightbox bind:open={trailerOpen} movie={trailerMovie} />
