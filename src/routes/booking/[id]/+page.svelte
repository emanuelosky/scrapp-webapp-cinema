<script lang="ts">
	import { bookingState } from '$lib/state/booking.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import Info from '@lucide/svelte/icons/info';
	import SeatIcon from '$lib/components/booking/SeatIcon.svelte';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import { page } from '$app/stores';

	let id = $derived($page.params.id);

	let now = $state(new Date());
	let currentDateStr = $derived(now.toLocaleDateString('es-VE'));
	let currentTimeStr = $derived(now.toLocaleTimeString('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));

	let timeLeft = $state(480); // 8 minutes = 480 seconds
	let timerInterval: ReturnType<typeof setInterval> | undefined;

	onMount(async () => {
		if (!bookingState.movie) {
			await goto(resolve('/'));
			return;
		}

		await bookingState.loadSeats();

		timerInterval = setInterval(() => {
			now = new Date();
			if (timeLeft > 0) {
				timeLeft--;
			} else {
				clearInterval(timerInterval);
			}
		}, 1000);
	});

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
	});

	function formatTime(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function handleSeatClick(row: string, num: number) {
		const seatId = `${row}${num}`;
		bookingState.toggleSeat(seatId);
	}
</script>

<div class="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
	<!-- HEADER -->
	<header class="w-full bg-black border-b border-zinc-800 p-3 md:p-4 flex flex-col xl:flex-row gap-4 sticky top-0 z-50 shadow-2xl">
		<!-- Go Back & Col 1: Movie Info -->
		<div class="flex-1 flex gap-4 items-center border-r-0 xl:border-r border-zinc-800 pr-4">
			<a href={resolve('/')} class="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition text-zinc-400 hover:text-white shrink-0">
				<ArrowLeft class="size-5" />
			</a>
			{#if bookingState.movie}
				<img src={bookingState.movie.poster} alt="" class="h-24 w-16 object-cover rounded shadow-md shrink-0" />
				<div class="flex flex-col overflow-hidden">
					<h1 class="font-black text-xl md:text-3xl uppercase tracking-tight leading-none mb-1.5 truncate">{bookingState.movie.title}</h1>
					<div class="flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-400">
						<span class="border border-zinc-700 px-1.5 py-0.5 rounded-sm">{bookingState.movie.rating || 'B'}</span>
						<span>{bookingState.movie.duration || '2H 15M'}</span>
						<span class="px-1.5 py-0.5 bg-zinc-800 rounded-sm text-zinc-300">{bookingState.selectedShowtime?.format || '2D ESP'}</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Col 2: Date & Time -->
		<div class="flex-1 flex flex-col justify-center border-r-0 xl:border-r border-zinc-800 px-0 xl:px-4">
			<div class="flex items-center justify-between text-[10px] md:text-xs mb-1.5">
				<span class="font-bold text-zinc-500 uppercase tracking-widest">Función seleccionada:</span>
				<span class="text-white font-bold uppercase tracking-tight">{bookingState.selectedDate} • {bookingState.selectedShowtime?.time}</span>
			</div>
			<div class="flex items-center justify-between text-[10px] md:text-xs mb-1.5">
				<span class="font-bold text-amber-500 uppercase tracking-widest">Fecha y hora:</span>
				<span class="font-bold text-amber-500 font-mono tracking-tighter">{currentDateStr} • {currentTimeStr}</span>
			</div>
			<div class="flex items-center justify-between mt-1.5 border-t border-zinc-800/50 pt-2">
				<div class="flex items-center gap-1 relative group">
					<span class="font-bold text-red-500/80 text-[10px] md:text-xs uppercase tracking-widest cursor-help">Tiempo restante:</span>
					<Info class="size-3 text-red-500/60 hover:text-red-500 cursor-help transition-colors" />
					<div class="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-red-900/50 text-[10px] leading-tight text-red-200 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
						Al expirar este tiempo se cancelará la venta.
					</div>
				</div>
				<span class="font-mono font-black text-red-500 text-base md:text-lg animate-pulse">{formatTime(timeLeft)}<span class="text-[9px] md:text-[10px] font-bold text-red-500/80 tracking-widest ml-1">MIN</span></span>
			</div>
		</div>

		<!-- Col 3: Tickets -->
		<div class="flex-[1.5] flex flex-col gap-0 px-0 xl:px-4 justify-center mt-2 xl:mt-0">
			<!-- Adults -->
			<div class="flex items-center border-b border-zinc-800 py-1.5">
				<div class="flex-1 flex items-center justify-start">
					<span class="text-xs font-bold text-white uppercase tracking-wider w-20">Adulto</span>
				</div>
				<div class="flex-1 flex items-center justify-center">
					<span class="text-zinc-500 font-bold text-xs">$5.00</span>
				</div>
				<div class="flex-1 flex items-center justify-end gap-3">
					<button class="size-6 rounded-full border border-zinc-600 flex items-center justify-center hover:border-white hover:text-white transition text-zinc-400" onclick={() => bookingState.adultTickets = Math.max(0, bookingState.adultTickets - 1)}><Minus class="size-3" /></button>
					<span class="font-black text-lg w-4 text-center">{bookingState.adultTickets}</span>
					<button class="size-6 rounded-full border border-zinc-600 flex items-center justify-center hover:border-white hover:text-white transition text-zinc-400" onclick={() => bookingState.adultTickets++}><Plus class="size-3" /></button>
				</div>
			</div>
			<!-- Kids -->
			<div class="flex items-center border-b border-zinc-800 py-1.5">
				<div class="flex-1 flex items-center justify-start">
					<div class="flex items-center gap-1">
						<span class="text-xs font-bold text-white uppercase tracking-wider">Niños</span>
						<div class="relative group flex items-center">
							<Info class="size-3 text-zinc-500 hover:text-white cursor-help transition-colors" />
							<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 text-[10px] leading-tight text-zinc-300 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
								Entrada de niños hasta los 14. Posiblemente se solicite su CI. Este descuento es válido hasta las 5:00pm.
							</div>
						</div>
					</div>
				</div>
				<div class="flex-1 flex items-center justify-center">
					<span class="text-zinc-500 font-bold text-xs">$2.50</span>
				</div>
				<div class="flex-1 flex items-center justify-end gap-3">
					<button class="size-6 rounded-full border border-zinc-600 flex items-center justify-center hover:border-white hover:text-white transition text-zinc-400" onclick={() => bookingState.childTickets = Math.max(0, bookingState.childTickets - 1)}><Minus class="size-3" /></button>
					<span class="font-black text-lg w-4 text-center">{bookingState.childTickets}</span>
					<button class="size-6 rounded-full border border-zinc-600 flex items-center justify-center hover:border-white hover:text-white transition text-zinc-400" onclick={() => bookingState.childTickets++}><Plus class="size-3" /></button>
				</div>
			</div>
			<!-- Seniors -->
			<div class="flex items-center py-1.5">
				<div class="flex-1 flex items-center justify-start">
					<div class="flex items-center gap-1">
						<span class="text-xs font-bold text-white uppercase tracking-wider">Señores</span>
						<div class="relative group flex items-center">
							<Info class="size-3 text-zinc-500 hover:text-white cursor-help transition-colors" />
							<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-700 text-[10px] leading-tight text-zinc-300 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
								Entrada para mayores de 60 años. Se solicitará documento de identidad en puerta.
							</div>
						</div>
					</div>
				</div>
				<div class="flex-1 flex items-center justify-center">
					<span class="text-zinc-500 font-bold text-xs">$2.50</span>
				</div>
				<div class="flex-1 flex items-center justify-end gap-3">
					<button class="size-6 rounded-full border border-zinc-600 flex items-center justify-center hover:border-white hover:text-white transition text-zinc-400" onclick={() => bookingState.seniorTickets = Math.max(0, bookingState.seniorTickets - 1)}><Minus class="size-3" /></button>
					<span class="font-black text-lg w-4 text-center">{bookingState.seniorTickets}</span>
					<button class="size-6 rounded-full border border-zinc-600 flex items-center justify-center hover:border-white hover:text-white transition text-zinc-400" onclick={() => bookingState.seniorTickets++}><Plus class="size-3" /></button>
				</div>
			</div>
		</div>
	</header>

	<!-- MAIN: SEAT MAP -->
	<main class="flex-1 flex flex-col items-center overflow-x-auto p-8 relative">
		
		{#if bookingState.isProcessing}
			<div class="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
				<Loader2 class="size-12 text-amber-500 animate-spin" />
				<p class="text-zinc-300 font-bold tracking-widest uppercase text-sm md:text-base animate-pulse text-center px-4">
					{bookingState.loadingMessage || 'Procesando...'}
				</p>
			</div>
		{/if}
		
		<!-- Screen Curve -->
		<div class="w-full max-w-4xl flex flex-col items-center mb-16 mt-4 min-w-[600px]">
			<div class="w-[80%] h-12 border-t-4 border-zinc-700 rounded-[100%] shadow-[0_-15px_40px_rgba(255,255,255,0.05)] relative overflow-hidden">
				<div class="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
			</div>
			<span class="text-zinc-600 font-bold uppercase tracking-[0.5em] text-sm mt-4">Pantalla</span>
		</div>

		<!-- Seats Grid -->
		<!-- SEATING AREA (CFD MATRIX) -->
		<div class="flex-1 w-full flex items-center justify-center pt-8 overflow-x-auto select-none">
			<div class="flex flex-col gap-1 md:gap-1.5 w-max pb-20 px-4">
				{#each bookingState.matrix as row, rowIndex (rowIndex)}
					<div class="flex items-center gap-1 md:gap-1.5">
						{#each row as cell, cellIndex (cellIndex)}
							{#if cell.type === 'empty'}
								<!-- Pasillo o hueco vacío -->
								<div class="w-6 h-6 md:w-8 md:h-8 invisible"></div>
							{:else if cell.type === 'row-label'}
								<!-- Letra de la fila -->
								<div class="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center font-bold text-xs md:text-sm text-zinc-500">
									{cell.label}
								</div>
							{:else if cell.type === 'seat'}
								<!-- Butaca real -->
								{@const isSelected = bookingState.selectedSeats.includes(cell.id)}
								{@const isTaken = cell.status === 'taken'}
								{@const isWheelchair = cell.id.startsWith('A') && (cell.label === '1' || cell.label === '20')}
								
								<button 
									class="group relative w-7 h-7 md:w-9 md:h-9 flex items-center justify-center transition-all duration-200 
										{isTaken ? 'text-zinc-800 cursor-not-allowed opacity-40' : 
										isSelected ? 'text-white scale-110 z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 
										'text-zinc-600 hover:text-zinc-400 hover:scale-105'}"
									disabled={isTaken}
									onclick={() => handleSeatClick(cell.id.charAt(0), parseInt(cell.label))}
								>
									{#if isWheelchair}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full p-1 opacity-80">
											<circle cx="8" cy="12" r="4" />
											<path d="M12 12h3" />
											<path d="M15 12v-5h3" />
											<path d="M11 6h-2" />
										</svg>
									{:else}
										<SeatIcon className="w-full h-full drop-shadow-sm" />
									{/if}
									{#if !isWheelchair}
										<span class="absolute text-[7px] md:text-[9px] font-light tracking-tighter mt-[-4px] {isSelected ? 'text-black font-semibold' : (isTaken ? 'text-transparent' : 'text-white/70')} pointer-events-none transition-colors">
											{cell.id}
										</span>
									{/if}
								</button>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<!-- Legend -->
		<div class="fixed bottom-32 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-xl border border-zinc-800 rounded-full px-6 py-3 flex gap-6 z-40 shadow-2xl">
			<div class="flex items-center gap-2">
				<SeatIcon className="size-5 text-zinc-600" />
				<span class="text-xs font-medium text-zinc-400">Libre</span>
			</div>
			<div class="flex items-center gap-2">
				<SeatIcon className="size-5 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
				<span class="text-xs font-medium text-white">Tu Selección</span>
			</div>
			<div class="flex items-center gap-2">
				<SeatIcon className="size-5 text-zinc-800 opacity-40" />
				<span class="text-xs font-medium text-zinc-600">Ocupada</span>
			</div>
		</div>

	</main>

	<!-- BOTTOM BAR -->
	<div class="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-4 md:p-6 z-50">
		<div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
			<div class="flex flex-col">
				<div class="flex items-center gap-2">
					<span class="text-sm font-bold text-zinc-400">Total a Pagar:</span>
					<span class="text-xl font-black text-white">${bookingState.totalPrice.toFixed(2)}</span>
					<span class="text-zinc-600 px-2">|</span>
					<span class="text-sm font-bold text-zinc-400">Butacas Elegidas:</span>
					<span class="text-xl font-black {bookingState.selectedSeats.length === bookingState.totalTickets && bookingState.totalTickets > 0 ? 'text-green-500' : 'text-amber-500'}">{bookingState.selectedSeats.length}</span>
				</div>
				{#if bookingState.totalTickets === 0}
					<span class="text-xs text-amber-500 flex items-center gap-1 mt-1"><Info class="size-3" /> Selecciona la cantidad de tickets o marca una butaca</span>
				{:else if bookingState.selectedSeats.length < bookingState.totalTickets}
					<span class="text-xs text-amber-500 flex items-center gap-1 mt-1"><Info class="size-3" /> Faltan {bookingState.totalTickets - bookingState.selectedSeats.length} butacas por elegir</span>
				{/if}
			</div>

			<button 
				class="px-8 py-3 bg-amber-400 text-black font-bold uppercase tracking-widest rounded-full hover:bg-amber-300 transition-colors shadow-[0_0_20px_rgba(251,191,36,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!bookingState.canProceed}
				onclick={() => goto(resolve('/concessions/[id]', { id: id || '' }))}
			>
				Confirmar Asientos
			</button>
		</div>
	</div>
</div>
