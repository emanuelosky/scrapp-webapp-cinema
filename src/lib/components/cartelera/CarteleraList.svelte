<script lang="ts">
	import { animate, stagger } from 'animejs';
	import type { Movie } from '$lib/types';
	import CarteleraListRow from './CarteleraListRow.svelte';

	let {
		movies,
		activeMovieId,
		onSelect,
		sede,
		selectedDateStr,
		emptyMessage = 'No hay funciones para este filtro.'
	}: {
		movies: Movie[];
		activeMovieId: string | number | null;
		onSelect: (movie: Movie) => void;
		sede?: string;
		selectedDateStr?: string;
		emptyMessage?: string;
	} = $props();

	let listEl = $state<HTMLDivElement | null>(null);

	// Entrada escalonada al cargar y cada vez que cambia el filtro/fecha
	// (referencia nueva de `movies`). Lineal, no en grilla, porque esto es
	// una lista de una sola columna -- el modo `grid` de stagger() sí se usó
	// en el intento anterior con tarjetas en grilla, acá no aplica.
	$effect(() => {
		void movies;
		if (!listEl) return;
		const rows = listEl.querySelectorAll<HTMLElement>('.cartelera-list-row');
		if (rows.length === 0) return;

		const anim = animate(rows, {
			opacity: [0, 1],
			translateX: [-16, 0],
			ease: 'outQuad',
			duration: 400,
			delay: stagger(50)
		});

		return () => anim.revert();
	});
</script>

<div bind:this={listEl} class="w-full">
	{#each movies as movie (movie.id)}
		<CarteleraListRow {movie} isActive={movie.id === activeMovieId} {onSelect} {sede} {selectedDateStr} />
	{:else}
		<p class="text-center text-zinc-500 font-bold uppercase tracking-widest text-sm py-16">{emptyMessage}</p>
	{/each}
</div>
