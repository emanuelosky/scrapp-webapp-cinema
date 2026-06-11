<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import Clock from '@lucide/svelte/icons/clock';
	import Calendar from '@lucide/svelte/icons/calendar';
	import type { Movie, ShowtimeDetails } from '$lib/types';
	import { bookingState } from '$lib/state/booking.svelte';
	import { goto } from '$app/navigation';
	import { SvelteDate } from 'svelte/reactivity';

	let { open = $bindable(false), movie }: { open: boolean; movie: Movie | null } = $props();

	let availableDates = $derived(movie?.showtimesByDate ? Object.keys(movie.showtimesByDate).sort() : []);
	let selectedDate = $state<string | null>(null);
	let selectedShowtime = $state<ShowtimeDetails | null>(null);

	// Select first date automatically when movie changes
	$effect(() => {
		if (open && availableDates.length > 0 && (!selectedDate || !availableDates.includes(selectedDate))) {
			selectedDate = availableDates[0];
			selectedShowtime = null;
		}
	});

	// Group showtimes by format for the selected date
	let groupedShowtimes = $derived.by(() => {
		if (!movie || !selectedDate || !movie.showtimesByDate) return {};
		const shows = movie.showtimesByDate[selectedDate] || [];
		const groups: Record<string, ShowtimeDetails[]> = {};
		for (const s of shows) {
			if (!groups[s.format]) groups[s.format] = [];
			groups[s.format].push(s);
		}
		return groups;
	});
	
	let formatKeys = $derived(Object.keys(groupedShowtimes).sort());

	function formatDateLabel(dateStr: string) {
		const d = new SvelteDate(dateStr + "T12:00:00");
		const today = new SvelteDate();
		today.setHours(12, 0, 0, 0);
		
		const diffTime = d.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		const formatter = new Intl.DateTimeFormat('es-VE', { weekday: 'short', day: 'numeric', month: 'short' });
		const formatted = formatter.format(d).replace(/\./g, '');
		const parts = formatted.split(' ');
		if (parts.length >= 3) {
			parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
			parts[2] = parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
		}
		const finalString = parts.join(' ');
		
		if (diffDays === 0) return `Hoy, ${finalString}`;
		if (diffDays === 1) return `Mañana, ${finalString}`;
		return finalString;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl w-[95vw] bg-black border border-zinc-800 text-white p-0 overflow-hidden rounded-none shadow-2xl gap-0">
		{#if movie}
			<div class="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto">
				<!-- Left: Poster -->
				<div class="md:w-[40%] relative border-r border-zinc-800">
					<img src={movie.poster} alt={movie.title} class="w-full h-full object-cover min-h-[300px] md:min-h-full" />
					<div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent md:hidden"></div>
				</div>

				<!-- Right: Details & Showtimes -->
				<div class="md:w-[60%] p-6 md:p-10 flex flex-col">
					<div class="mb-8">
						<div class="flex items-center gap-3 mb-4">
							{#if movie.label}
								<span class="bg-zinc-200 text-black text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">{movie.label}</span>
							{/if}
							{#if movie.rating}
								<span class="text-[11px] font-bold text-zinc-400 border border-zinc-700 px-2 py-0.5">{movie.rating}</span>
							{/if}
							{#if movie.formats?.video}
								<span class="text-[11px] font-bold text-zinc-400 border border-zinc-700 px-2 py-0.5">{movie.formats.video}</span>
							{/if}
							{#if movie.formats?.language}
								<span class="text-[11px] font-bold text-zinc-400 border border-zinc-700 px-2 py-0.5">{movie.formats.language}</span>
							{/if}
							{#if movie.duration}
								<span class="text-[11px] font-bold text-zinc-400">{movie.duration}</span>
							{/if}
						</div>
						<Dialog.Title class="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-3 leading-none">{movie.title}</Dialog.Title>
						<Dialog.Description class="text-zinc-400 text-sm md:text-base font-medium">
							{movie.genres || 'Sin Género'}
						</Dialog.Description>
					</div>

					<p class="text-zinc-300 text-sm leading-relaxed mb-8">
						{movie.synopsis || 'Sin sinopsis disponible para esta película.'}
					</p>

					<div class="w-full h-px bg-zinc-800 mb-8"></div>

					<!-- Dates -->
					<div class="mb-8">
						<h4 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar class="size-4" /> Selecciona la Fecha</h4>
						<div class="flex flex-wrap gap-2">
							{#each availableDates as date (date)}
								<button 
									class="px-5 py-2.5 text-xs font-bold border transition-colors {selectedDate === date ? 'bg-white text-black border-white shadow-md' : 'bg-transparent text-zinc-300 border-zinc-700 hover:border-zinc-400 hover:text-white'}"
									onclick={() => { selectedDate = date; selectedShowtime = null; }}
								>
									{formatDateLabel(date)}
								</button>
							{/each}
						</div>
					</div>

					<!-- Showtimes Grouped by Format -->
					<div class="mb-10">
						<h4 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock class="size-4" /> Horarios Disponibles</h4>
						
						{#if formatKeys.length === 0}
							<p class="text-sm text-zinc-500 italic">No hay funciones disponibles para esta fecha.</p>
						{:else}
							<div class="flex flex-col gap-6">
								{#each formatKeys as format (format)}
									<div>
										<h5 class="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase mb-3 border-b border-zinc-800 pb-1">{format}</h5>
										<div class="flex flex-wrap gap-3">
											{#each groupedShowtimes[format] as st (st.id)}
												<button 
													class="px-8 py-3.5 text-sm font-bold border transition-all {selectedShowtime?.id === st.id ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white'}"
													onclick={() => selectedShowtime = st}
												>
													{st.time}
												</button>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Footer Actions -->
					<div class="mt-auto pt-4 flex gap-4">
						<button 
							class="w-full bg-zinc-200 hover:bg-white text-black font-black uppercase tracking-widest py-4 text-sm transition-colors border border-transparent shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={!selectedShowtime}
							onclick={async () => {
								if (movie && selectedShowtime && selectedDate) {
									// Pasa el pos_show_id embebido en selectedShowtime
									bookingState.startBooking(movie, selectedDate, selectedShowtime);
									open = false;
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									await goto(`/booking/${movie.id}` as any);
								}
							}}
						>
							{#if selectedShowtime}
								Elegir Butacas - {selectedShowtime.time}
							{:else}
								Selecciona un Horario
							{/if}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
