<script lang="ts">
	import { onScroll } from 'animejs';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteMap } from 'svelte/reactivity';
	import { bookingState } from '$lib/state/booking.svelte';
	import Ticket from '@lucide/svelte/icons/ticket';
	import type { Movie, ShowtimeDetails } from '$lib/types';

	let {
		movie,
		isActive,
		onSelect,
		sede,
		selectedDateStr
	}: {
		movie: Movie;
		isActive: boolean;
		onSelect: (movie: Movie) => void;
		/** Sede activa (siempre exactamente una: cartelera ya no mezcla más de
		 * una sede en la misma vista, ver /cartelera y /cines/[sede]/cartelera). */
		sede?: string;
		selectedDateStr?: string;
	} = $props();

	let rowEl = $state<HTMLDivElement | null>(null);

	// Horarios agrupados por formato -- el mismo patrón visual de AMC, pero
	// resuelto contra datos reales en vez de un botón genérico "Ver
	// horarios". Ya no se agrupa por sede: mezclar horarios de dos sedes en
	// la misma tarjeta es justo lo que se quitó (riesgo real de que alguien
	// compre en Lido y se presente en Candelaria).
	let groupedShowtimes = $derived.by(() => {
		if (!selectedDateStr) return [];
		const entries = movie.showtimesByDate?.[selectedDateStr] || [];

		const byFormat = new SvelteMap<string, ShowtimeDetails[]>();
		for (const entry of entries) {
			const key = entry.format || 'DIGITAL';
			if (!byFormat.has(key)) byFormat.set(key, []);
			byFormat.get(key)!.push(entry);
		}
		return Array.from(byFormat.entries());
	});

	function bookShowtime(showtime: ShowtimeDetails) {
		if (!sede || !selectedDateStr) return;
		bookingState.startBooking(movie, selectedDateStr, showtime, sede);
		goto(resolve(`/cines/${sede}/booking/${movie.id}`));
	}

	// La fila activa del panel derecho sigue al scroll, no solo al clic:
	// cuando el centro de la fila cruza el centro del viewport, se vuelve la
	// activa. Solo importa en el layout de dos columnas (desktop); en mobile
	// el chequeo de ancho dentro del callback lo vuelve un no-op barato.
	$effect(() => {
		if (!rowEl) return;
		const observer = onScroll({
			target: rowEl,
			enter: 'center center',
			onEnter: () => {
				if (window.innerWidth >= 1024) onSelect(movie);
			}
		});
		return () => observer.revert();
	});
</script>

<div bind:this={rowEl} class="cartelera-list-row w-full py-6 border-b border-zinc-900 transition-colors {isActive ? 'bg-zinc-950/60' : ''}">
	<div class="flex gap-4 px-4 md:px-8">
		<div class="relative shrink-0">
			{#if movie.label}
				<div class="absolute -top-2 -left-2 z-10 drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]">
					<div class="ticket-shape flex items-center gap-1 py-1 px-2.5 {movie.label === 'PREVENTA' ? 'bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-400' : 'bg-gradient-to-r from-champagne-400 via-champagne-500 to-champagne-500'}">
						<Ticket class="size-2.5 text-black opacity-90" />
						<span class="text-[8px] font-black text-black uppercase tracking-widest">{movie.label}</span>
					</div>
				</div>
			{/if}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div role="button" tabindex="0" class="cursor-pointer" onclick={() => onSelect(movie)}>
				<img
					src={movie.poster}
					alt={movie.title}
					class="w-20 md:w-24 aspect-[2/3] object-cover {isActive ? 'ring-2 ring-white' : ''}"
				/>
			</div>
		</div>

		<div class="flex-1 min-w-0">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div role="button" tabindex="0" class="cursor-pointer" onclick={() => onSelect(movie)}>
				<h3 class="font-display text-2xl md:text-3xl font-black text-white uppercase leading-[1.05] tracking-normal hover:text-zinc-300 transition-colors">
					{movie.title}
				</h3>
			</div>
			<div class="flex items-center gap-2 text-zinc-400 text-xs font-semibold mt-1.5">
				{#if movie.duration}<span class="tracking-widest">{movie.duration}</span>{/if}
				{#if movie.duration && movie.rating}<span class="w-px h-2.5 bg-zinc-600"></span>{/if}
				{#if movie.rating}<span class="tracking-widest">{movie.rating}</span>{/if}
			</div>

			<div class="mt-4 flex flex-col gap-3">
				{#each groupedShowtimes as [format, times] (format)}
					<div>
						<p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">{format}</p>
						<div class="flex flex-wrap gap-2">
							{#each times as showtime (showtime.id)}
								<button
									type="button"
									class="px-3.5 py-1.5 border border-zinc-700 text-white text-xs font-bold hover:bg-white hover:text-black hover:border-white transition-colors"
									onclick={() => bookShowtime(showtime)}
								>
									{showtime.time}
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<p class="text-zinc-600 text-xs italic">No hay funciones para esta fecha.</p>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.ticket-shape {
		-webkit-mask-image:
			radial-gradient(circle at 0% 50%, transparent 2.5px, black 3px),
			radial-gradient(circle at 100% 50%, transparent 2.5px, black 3px);
		-webkit-mask-size: 51% 100%;
		-webkit-mask-position: left, right;
		-webkit-mask-repeat: no-repeat;
		mask-image:
			radial-gradient(circle at 0% 50%, transparent 2.5px, black 3px),
			radial-gradient(circle at 100% 50%, transparent 2.5px, black 3px);
		mask-size: 51% 100%;
		mask-position: left, right;
		mask-repeat: no-repeat;
	}
</style>
