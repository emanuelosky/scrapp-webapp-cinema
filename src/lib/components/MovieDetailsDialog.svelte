<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Clock from '@lucide/svelte/icons/clock';
	import type { Movie } from '$lib/types';

	let { open = $bindable(false), movie }: { open: boolean; movie: Movie | null } = $props();

	const dates = ["Hoy, 7 Jun", "Sáb, 8 Jun", "Dom, 9 Jun", "Lun, 10 Jun"];
	const showtimes = ["14:30", "16:45", "19:00", "21:30"];
	
	let selectedDate = $state(dates[0]);
	let selectedTime = $state(showtimes[0]);
</script>

<Dialog bind:open={open}>
	<DialogContent class="max-w-4xl bg-zinc-950 border-zinc-800 text-zinc-50 p-0 overflow-hidden rounded-xl shadow-2xl shadow-red-900/20">
		{#if movie}
			<div class="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto">
				<!-- Left: Poster & Trailer (Mobile: Top) -->
				<div class="md:w-2/5 relative">
					<img src={movie.poster} alt={movie.title} class="w-full h-full object-cover min-h-[300px]" />
					<div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent md:hidden"></div>
					<div class="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-950/20 to-zinc-950 hidden md:block"></div>
				</div>

				<!-- Right: Details & Showtimes -->
				<div class="md:w-3/5 p-6 md:p-8 flex flex-col relative z-10 -mt-24 md:mt-0">
					<DialogHeader class="text-left mb-6">
						<div class="inline-flex items-center gap-2 mb-2">
							<span class="bg-[#d4af37] text-black text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">{movie.label || 'ESTRENO'}</span>
							<span class="text-xs font-semibold text-zinc-400 border border-zinc-700 px-2 rounded-sm">PG-13</span>
						</div>
						<DialogTitle class="text-3xl md:text-5xl font-black italic tracking-tighter text-white mb-2 drop-shadow-md">{movie.title}</DialogTitle>
						<DialogDescription class="text-zinc-400 text-sm md:text-base leading-relaxed">
							2h 45m • Acción, Sci-Fi, Aventura • Inglés Subtitulado
						</DialogDescription>
					</DialogHeader>

					<p class="text-zinc-300 text-sm leading-relaxed mb-6">
						Explora el viaje mítico de Paul Atreides mientras se une con Chani y los Fremen en su camino de venganza contra los conspiradores que destruyeron a su familia.
					</p>

					<Separator class="bg-zinc-800 mb-6" />

					<!-- Dates -->
					<div class="mb-6">
						<h4 class="text-sm font-bold text-white mb-3 flex items-center gap-2"><Clock class="size-4 text-red-500" /> Selecciona la Fecha</h4>
						<div class="flex flex-wrap gap-2">
							{#each dates as date (date)}
								<button 
									class="px-4 py-2 rounded-full text-xs font-semibold border transition-all {selectedDate === date ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white'}"
									onclick={() => selectedDate = date}
								>
									{date}
								</button>
							{/each}
						</div>
					</div>

					<!-- Showtimes -->
					<div class="mb-8">
						<h4 class="text-sm font-bold text-white mb-3 flex items-center gap-2"><Ticket class="size-4 text-red-500" /> Horarios Disponibles</h4>
						<div class="flex flex-wrap gap-3">
							{#each showtimes as time (time)}
								<button 
									class="px-5 py-3 rounded-lg text-sm font-bold border transition-all {selectedTime === time ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-900/50' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'}"
									onclick={() => selectedTime = time}
								>
									{time}
								</button>
							{/each}
						</div>
					</div>

					<!-- Footer Actions -->
					<div class="mt-auto pt-6 flex gap-4">
						<Button class="flex-1 bg-white hover:bg-zinc-200 text-black font-bold py-6 text-lg rounded-xl transition-transform hover:scale-[1.02]">
							Continuar a Butacas
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</DialogContent>
</Dialog>
