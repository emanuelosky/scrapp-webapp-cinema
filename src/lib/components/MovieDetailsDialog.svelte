<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import Clock from '@lucide/svelte/icons/clock';
	import Calendar from '@lucide/svelte/icons/calendar';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import type { Movie, ShowtimeDetails } from '$lib/types';
	import { bookingState } from '$lib/state/booking.svelte';
	import { cinemaState } from '$lib/state/cinema.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { today, now, parseDate } from '@internationalized/date';

	// Este diálogo solo se monta dentro de /cines/[sede], así que
	// cinemaState.activeTimezone siempre refleja la sede correcta (el padre ya
	// llamó syncFromUrl). Todo el cálculo de fecha/hora de aquí debe usar esta
	// zona — nunca el reloj crudo del navegador del visitante, que puede estar
	// en otro país y desalinear "hoy" o el corte de 30 min de gracia.

	let { open = $bindable(false), movie, initialDate = null, initialExpandSynopsis = false }: { open: boolean; movie: Movie | null; initialDate?: string | null; initialExpandSynopsis?: boolean } = $props();

	let availableDates = $derived.by(() => {
		if (!movie?.showtimesByDate) return [];
		// Comparación de strings ISO (YYYY-MM-DD): el orden lexicográfico ya
		// coincide con el cronológico, sin necesidad de construir un Date.
		const todayStr = today(cinemaState.activeTimezone).toString();
		return Object.keys(movie.showtimesByDate).filter(dateStr => dateStr >= todayStr).sort();
	});
	let selectedDate = $state<string | null>(null);
	let selectedShowtime = $state<ShowtimeDetails | null>(null);
	let isSynopsisExpanded = $state(false);
	let synopsisP = $state<HTMLElement | null>(null);
	let hasSynopsisOverflow = $state(false);
	let showConflictModal = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let conflictingItem = $state<any>(null);

	async function proceedToBooking() {
		if (movie && selectedShowtime && selectedDate) {
			const currentSede = $page.params.sede;
			// Sin sede no hay butacas que mostrar: las funciones y el mapa de sala
			// son por cine. Este diálogo solo se monta dentro de /cines/[sede],
			// así que esto no debería ocurrir; antes caía a /booking/<id>, una
			// ruta inexistente que mandaba al usuario a un 404.
			if (!currentSede) {
				console.error('[MovieDetailsDialog] No hay sede en la ruta; no se puede iniciar la reserva.');
				return;
			}
			bookingState.startBooking(movie, selectedDate, selectedShowtime, currentSede);
			open = false;
			await goto(resolve(`/cines/${currentSede}/booking/${movie.id}`));
		}
	}

	// Select first date automatically when movie changes
	$effect(() => {
		if (open && movie) {
			// Si EPIK mandó abrir la sinopsis, la expandimos
			if (initialExpandSynopsis && !isSynopsisExpanded) {
				isSynopsisExpanded = true;
			}
			
			if (availableDates.length > 0 && (!selectedDate || !availableDates.includes(selectedDate))) {
				// Si EPIK pasó una fecha y es válida, usar esa
				if (initialDate && availableDates.includes(initialDate)) {
					selectedDate = initialDate;
					selectedShowtime = null;
					return;
				}

				// Buscar la primera fecha que tenga funciones válidas (que no hayan pasado)
			const tzNow = now(cinemaState.activeTimezone);
			const currentTotalMins = tzNow.hour * 60 + tzNow.minute;
			const todayStr = today(cinemaState.activeTimezone).toString();

			let foundDate = availableDates[0];
			
			for (const date of availableDates) {
				const shows = movie.showtimesByDate?.[date] || [];
				let hasValid = false;
				if (date === todayStr) {
					for (const s of shows) {
						const match = s.time.match(/(\d+):(\d+)\s*(A\.M\.|P\.M\.)/i);
						if (match) {
							let h = parseInt(match[1]);
							const m = parseInt(match[2]);
							const ampm = match[3].toUpperCase();
							if (ampm === 'P.M.' && h < 12) h += 12;
							if (ampm === 'A.M.' && h === 12) h = 0;
							const showTotalMins = h * 60 + m;
							if (currentTotalMins - showTotalMins <= 30) {
								hasValid = true;
								break;
							}
						}
					}
				} else {
					hasValid = shows.length > 0;
				}
				
				if (hasValid) {
					foundDate = date;
					break;
				}
			}

			selectedDate = foundDate;
			selectedShowtime = null;
			}
		}
	});

	// Check for synopsis overflow
	$effect(() => {
		if (synopsisP && movie && !isSynopsisExpanded) {
			hasSynopsisOverflow = synopsisP.scrollHeight > synopsisP.clientHeight;
		}
	});

	// Group showtimes by format for the selected date
	let groupedShowtimes = $derived.by(() => {
		if (!movie || !selectedDate || !movie.showtimesByDate) return {};
		const shows = movie.showtimesByDate[selectedDate] || [];
		const groups: Record<string, ShowtimeDetails[]> = {};
		
		const todayStr = today(cinemaState.activeTimezone).toString();
		const isToday = selectedDate === todayStr;
		const tzNow = now(cinemaState.activeTimezone);
		const currentTotalMins = tzNow.hour * 60 + tzNow.minute;

		for (const s of shows) {
			if (isToday) {
				const match = s.time.match(/(\d+):(\d+)\s*(A\.M\.|P\.M\.)/i);
				if (match) {
					let h = parseInt(match[1]);
					const m = parseInt(match[2]);
					const ampm = match[3].toUpperCase();
					
					if (ampm === 'P.M.' && h < 12) h += 12;
					if (ampm === 'A.M.' && h === 12) h = 0;
					
					const showTotalMins = h * 60 + m;
					if (currentTotalMins - showTotalMins > 30) {
						continue; // Hide if started more than 30 mins ago
					}
				}
			}

			if (!groups[s.format]) groups[s.format] = [];
			groups[s.format].push(s);
		}
		return groups;
	});
	
	let formatKeys = $derived(Object.keys(groupedShowtimes).sort());

	function formatDateLabel(dateStr: string) {
		const tz = cinemaState.activeTimezone;
		const d = parseDate(dateStr);
		const diffDays = d.compare(today(tz));

		const formatter = new Intl.DateTimeFormat('es-VE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz });
		const formatted = formatter.format(d.toDate(tz)).replace(/\./g, '');
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
	<Dialog.Content class="sm:max-w-3xl md:max-w-5xl lg:max-w-6xl xl:max-w-[1200px] w-[95vw] bg-black border-none text-white p-0 overflow-hidden rounded-none shadow-2xl gap-0">
		{#if movie}
			<div class="flex flex-col md:flex-row h-[90vh] md:h-[85vh] md:min-h-[600px] overflow-y-auto md:overflow-hidden custom-scrollbar">
				<!-- Left: Poster -->
				<div class="md:w-[45%] h-[250px] md:h-full relative shrink-0 bg-black flex items-center justify-center overflow-hidden">
					<!-- Blurred Background Layer para Escritorio -->
					<div class="hidden md:block absolute inset-0 z-0">
						<img src={movie.poster} alt="" class="w-full h-full object-cover blur-2xl opacity-40 scale-110" />
						<div class="absolute inset-0 bg-black/40"></div>
					</div>

					<!-- Mobile Image (Banner preferred) -->
					<img src={movie.banner || movie.poster} alt={movie.title} class="w-full h-full object-cover md:hidden relative z-10 {movie.banner ? 'object-center' : 'object-top'}" />
					
					<!-- Desktop Image (Poster object-contain para no cortar, con mask para difuminar bordes) -->
					<img 
						src={movie.poster} 
						alt={movie.title} 
						class="w-full h-[100%] object-contain hidden md:block relative z-10 rounded-lg drop-shadow-2xl" 
						style="-webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%); mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);"
					/>
					
					<div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:hidden z-20"></div>
					<div class="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/80 to-transparent md:hidden z-20"></div>
					<div class="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 to-transparent md:hidden z-20"></div>
				</div>

				<!-- Right: Details & Showtimes -->
				<div class="md:w-[55%] flex flex-col md:h-full overflow-visible md:overflow-hidden relative">
					<!-- Blurred Background Layer -->
					<div class="absolute inset-0 z-0 overflow-hidden">
						<img src={movie.banner || movie.poster} class="w-full h-full object-cover blur-[80px] opacity-40 scale-110" alt="" />
						<div class="absolute inset-0 bg-black/90"></div>
					</div>

					<!-- Main Scrollable Area -->
					<div class="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative z-10">
						<!-- Header -->
						<div class="relative z-10 p-6 md:px-10 md:pt-10 pb-4 shrink-0">
						<div class="flex flex-wrap items-center gap-3 mb-4">
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

					<!-- Synopsis -->
					<div class="relative flex flex-col transition-all duration-300">
						<div class="px-6 md:px-10 pb-4">
							<p 
								bind:this={synopsisP}
								class="text-zinc-300 text-sm leading-relaxed {isSynopsisExpanded ? '' : 'line-clamp-3 md:line-clamp-4'} transition-all"
							>
								{movie.synopsis || 'Sin sinopsis disponible para esta película.'}
							</p>
						</div>
							
							<!-- Toggle Button -->
							{#if hasSynopsisOverflow}
								<button 
									onclick={() => isSynopsisExpanded = !isSynopsisExpanded}
									class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900 border-none rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 z-10 shadow-lg transition-transform hover:scale-110"
									title={isSynopsisExpanded ? 'Colapsar sinopsis' : 'Expandir sinopsis'}
								>
									{#if isSynopsisExpanded}
										<ChevronUp class="size-4" />
									{:else}
										<ChevronDown class="size-4" />
									{/if}
								</button>
							{/if}
						</div>

						<!-- Showtimes -->
						<div class="px-6 md:px-10 py-6 transition-all duration-300">
							<!-- Dates -->
							<div class="mb-8 mt-2">
								<h4 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar class="size-4" /> Selecciona la Fecha</h4>
								<div class="flex flex-wrap gap-2">
									{#each availableDates as date (date)}
										<button 
											class="px-5 py-2.5 text-xs font-bold border rounded-full transition-colors {selectedDate === date ? 'bg-white text-black border-white shadow-md' : 'bg-transparent text-zinc-300 border-zinc-700 hover:border-zinc-400 hover:text-white'}"
											onclick={() => { selectedDate = date; selectedShowtime = null; }}
										>
											{formatDateLabel(date)}
										</button>
									{/each}
								</div>
							</div>

							<!-- Showtimes Grouped by Format -->
							<div class="mb-4">
								<h4 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock class="size-4" /> Horarios Disponibles</h4>
								
								{#if formatKeys.length === 0}
									<div class="flex flex-col items-start gap-5 bg-white/5 border border-white/10 rounded-xl p-6 mt-2">
										<p class="text-sm text-zinc-300 font-medium leading-relaxed">Las funciones de hoy ya finalizaron o no hay horarios programados para esta fecha.</p>
										
										{#if selectedDate && availableDates.indexOf(selectedDate) + 1 < availableDates.length}
											{@const nextDate = availableDates[availableDates.indexOf(selectedDate) + 1]}
											<button 
												class="px-6 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full transition-transform hover:scale-105 shadow-xl"
												onclick={() => { selectedDate = nextDate; selectedShowtime = null; }}
											>
												Ver Horarios de {formatDateLabel(nextDate).split(',')[0]}
											</button>
										{/if}
									</div>
								{:else}
									<div class="flex flex-col gap-6">
										{#each formatKeys as format (format)}
											<div>
												<h5 class="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase mb-3 border-b border-zinc-800 pb-1">{format}</h5>
												<div class="flex flex-wrap gap-3">
													{#each groupedShowtimes[format] as st (st.id)}
														<button 
															class="px-8 py-3.5 text-sm font-bold border rounded-full transition-all {selectedShowtime?.id === st.id ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' : 'bg-white/5 text-zinc-300 border-white/10 hover:border-white/30 hover:bg-white/10 hover:text-white'}"
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
						</div>
					</div> <!-- End of Main Scrollable Area -->

					<!-- Footer Actions -->
					<div class="relative z-20 md:mt-auto p-6 md:px-10 shrink-0 bg-black/40 backdrop-blur-md sticky bottom-0 border-t border-white/5">
						<button 
							class="w-full bg-zinc-200 hover:bg-white rounded-full text-black font-black uppercase tracking-widest py-4 text-sm transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={!selectedShowtime}
							onclick={() => {
								if (movie && selectedShowtime && selectedDate) {
									const existingItem = bookingState.cartItems.find(item => item.showtimeId === selectedShowtime!.id);
									if (existingItem) {
										conflictingItem = existingItem;
										showConflictModal = true;
									} else {
										proceedToBooking();
									}
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

		{#if showConflictModal}
		<div class="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
			<div class="bg-black border border-zinc-800 p-0 gap-0 max-w-sm w-full shadow-2xl flex flex-col text-center">
				<div class="px-6 py-5 border-b border-zinc-800 flex flex-col items-center">
					<div class="w-14 h-14 rounded-full bg-zinc-900 border-none flex items-center justify-center mb-4 text-white">
						<AlertCircle class="w-7 h-7" />
					</div>
					<h3 class="text-xl font-black text-white tracking-tight">Función en Carrito</h3>
				</div>
				<div class="p-6 flex flex-col gap-6">
					<div>
						<p class="text-zinc-400 text-sm mb-2">
							Tienes elegidos estos asientos:
						</p>
						<span class="text-white font-mono font-bold text-lg inline-block">
							{#each conflictingItem.seats as seat, i (seat)}
								{@const parts = seat.split('-')}
								{parts.length >= 2 ? `${parts[0]}:${parts[1]}` : seat}{i < conflictingItem.seats.length - 1 ? ', ' : ''}
							{/each}
						</span>
					</div>
					<p class="text-zinc-500 text-sm font-medium">¿Deseas borrar el carro actual para empezar de cero o piensas añadir más butacas a esta misma orden?</p>
					
					<div class="flex flex-col gap-3 w-full">
						<button 
							class="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest py-4 text-sm transition-colors border border-transparent shadow-xl"
							onclick={() => {
								showConflictModal = false;
								proceedToBooking();
							}}
						>
							Añadir Butacas
						</button>
						<button 
							class="w-full bg-zinc-900 border border-zinc-800 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-white font-bold uppercase tracking-widest py-3 text-sm transition-colors"
							onclick={() => {
								showConflictModal = false;
								bookingState.expireSession();
								proceedToBooking();
							}}
						>
							Borrar Todo
						</button>
						<button 
							class="text-zinc-500 text-xs uppercase tracking-widest hover:text-white font-bold"
							onclick={() => showConflictModal = false}
						>
							Volver
						</button>
					</div>
				</div>
			</div>
		</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #3f3f46;
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #52525b;
	}
</style>
