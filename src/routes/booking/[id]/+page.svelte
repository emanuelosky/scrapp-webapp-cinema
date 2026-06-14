<script lang="ts">
	import { bookingState } from '$lib/state/booking.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import Info from '@lucide/svelte/icons/info';
	import SeatIcon from '$lib/components/booking/SeatIcon.svelte';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import { page } from '$app/stores';
	import * as AlertDialog from "$lib/components/ui/alert-dialog";
	import { ScrollArea } from "$lib/components/ui/scroll-area";

	let zoomScale = $state(1);
	let defaultZoom = $state(1);
	let naturalWidth = $state(0);
	let naturalHeight = $state(0);

	let mainEl = $state<HTMLElement | null>(null);
	let isDragging = $state(false);
	let startX = 0;
	let startY = 0;
	let scrollLeft = 0;
	let scrollTop = 0;

	// Calcular tamaño una vez que los asientos se hayan renderizado
	$effect(() => {
		if (bookingState.matrix && bookingState.matrix.length > 0) {
			// Usamos setTimeout para asegurar que el DOM ya pintó los asientos
			setTimeout(() => {
				const container = document.getElementById('seat-matrix');
				const mainEl = document.querySelector('main');
				if (container && mainEl) {
					// Como usamos transform: scale, el offsetWidth del container SIEMPRE es el original (unscaled)
					naturalWidth = container.offsetWidth;
					naturalHeight = container.offsetHeight;
					
					const availableWidth = mainEl.clientWidth - 48; // Padding horizontal
					const availableHeight = mainEl.clientHeight - 64; // Padding vertical
					
					if (naturalWidth > 0 && naturalHeight > 0) {
						const isMobile = window.innerWidth < 768;
						
						if (isMobile) {
							// En móvil, forzamos escala 1.0 para que las butacas tengan un tamaño táctil real
							// y el usuario pueda moverse por el mapa con swipe (sin encoger).
							defaultZoom = 1.0;
						} else {
							// En desktop, queremos que encaje completamente (sin scroll inicial)
							const scaleX = availableWidth / naturalWidth;
							const scaleY = availableHeight / naturalHeight;
							defaultZoom = Math.min(scaleX, scaleY, 1.0); // No agrandamos más del 100%
						}
						
						if (bookingState.selectedSeats.length === 0) {
							zoomScale = defaultZoom;
						}
					}
				}
			}, 100);
		}
	});

	onMount(() => {
		// Intentar cargar sesión si no hay película en estado
		if (!bookingState.movie) {
			bookingState.loadFromLocalStorage();
		}

		if (!bookingState.movie) {
			goto(resolve('/'));
			return;
		}

		bookingState.loadSeats();

		// JIT Pre-heating: Avisar al backend que un usuario está en la vista de butacas
		const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'https://scrapp-backoffice.onrender.com';
		fetch(`${API_BASE}/api/kiosk/ghost-pool/warmup`, { method: 'POST' })
			.then(() => bookingState.fetchGhostStatus()) // Actualizar contador tras iniciar warmup
			.catch(console.error);
			
		// Polling simple cada 30 segundos para actualizar el contador de ghosts mientras estén en la vista de butacas
		const ghostInterval = setInterval(() => {
			if (!bookingState.ghostStatusCode) {
				bookingState.fetchGhostStatus();
			}
		}, 30000);

		// M-02 FIX: Liberar ghost session si el usuario cierra el tab/navega antes de pagar
		// sendBeacon garantiza que el request llega incluso durante page unload
		const handlePageHide = () => {
			const ghostSession = sessionStorage.getItem('scrapp_ghost_session');
			if (ghostSession) {
				try {
					const { ghostUsername } = JSON.parse(ghostSession);
					if (ghostUsername) {
						// navigator.sendBeacon es la única forma confiable de enviar datos en page unload
						navigator.sendBeacon(
							`${API_BASE}/api/kiosk/ghost-pool/release`,
							JSON.stringify({ username: ghostUsername })
						);
						sessionStorage.removeItem('scrapp_ghost_session');
					}
				} catch {
					// Silencioso — no queremos errores en page unload
				}
			}
		};

		window.addEventListener('pagehide', handlePageHide);
		window.addEventListener('beforeunload', handlePageHide);

		return () => {
			window.removeEventListener('pagehide', handlePageHide);
			window.removeEventListener('beforeunload', handlePageHide);
			clearInterval(ghostInterval);
		};
	});

	let id = $derived($page.params.id);

	let currentDate = $state(new Date());
	
	let showDisabledPrompt = $state(false);
	let pendingDisabledSeatId = $state<string | null>(null);

	$effect(() => {
		const interval = setInterval(() => {
			currentDate = new Date();
		}, 1000);
		return () => clearInterval(interval);
	});

	// The local timeLeft state has been removed. We now rely strictly on bookingState.timeRemainingSeconds.

	let currentDateStr = $derived(currentDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase());
	let currentTimeStr = $derived(currentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));

	onMount(async () => {
		// Segunda inicialización: carga asíncrona de butacas (garantiza DOM listo)
		if (!bookingState.movie) {
			bookingState.loadFromLocalStorage();
		}

		if (!bookingState.movie) {
			await goto(resolve('/'));
			return;
		}

		await bookingState.loadSeats();
	});

	function formatTime(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function handleSeatClick(seatId: string, seatType: string = 'General') {
		const isSelected = bookingState.selectedSeats.includes(seatId);
		
		const doZoom = () => {
			if (!isSelected) {
				// Recién la seleccionamos (zoom in)
				zoomScale = 1.3;
				setTimeout(() => {
					const seatEl = document.getElementById(`seat-${seatId}`);
					if (seatEl) {
						seatEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
					}
				}, 150);
			} else if (isSelected && bookingState.selectedSeats.length === 0) {
				// Recién la deseleccionamos y ya no hay asientos marcados (zoom out total)
				zoomScale = defaultZoom;
			}
		};

		if (seatType.toUpperCase().includes('DISCAPACITA') && !isSelected) {
			const hasDisabledTariff = bookingState.tariffs.some(t => t.nombre.toUpperCase().includes('DISCAPACITA'));
			if (hasDisabledTariff) {
				bookingState.toggleSeat(seatId, seatType, true);
				doZoom();
			} else {
				pendingDisabledSeatId = seatId;
				showDisabledPrompt = true;
			}
		} else {
			bookingState.toggleSeat(seatId, seatType, false);
			doZoom();
		}
	}

	function handleMouseDown(e: MouseEvent) {
		if (!mainEl) return;
		isDragging = true;
		startX = e.pageX - mainEl.offsetLeft;
		startY = e.pageY - mainEl.offsetTop;
		scrollLeft = mainEl.scrollLeft;
		scrollTop = mainEl.scrollTop;
	}

	function handleMouseLeave() {
		isDragging = false;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !mainEl) return;
		e.preventDefault();
		const x = e.pageX - mainEl.offsetLeft;
		const y = e.pageY - mainEl.offsetTop;
		const walkX = (x - startX) * 1.5; // Multiplicador de velocidad de arrastre
		const walkY = (y - startY) * 1.5;
		mainEl.scrollLeft = scrollLeft - walkX;
		mainEl.scrollTop = scrollTop - walkY;
	}
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
</svelte:head>

<AlertDialog.Root bind:open={showDisabledPrompt}>
	<AlertDialog.Content class="bg-black border border-zinc-800 text-white shadow-2xl rounded-none p-0 gap-0 max-w-sm w-full flex flex-col items-center">
		<div class="w-full px-6 py-5 border-b border-zinc-800 text-center flex flex-col items-center">
			<div class="flex items-center justify-center w-14 h-14 bg-zinc-900 border border-zinc-800 text-white rounded-full mb-4">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7">
					<circle cx="8" cy="12" r="4" />
					<path d="M12 12h3" />
					<path d="M15 12v-5h3" />
					<path d="M11 6h-2" />
				</svg>
			</div>
			<h2 class="text-xl font-black text-white tracking-tight uppercase">Atención Especial</h2>
		</div>
		
		<div class="p-6 flex flex-col gap-6 w-full text-center">
			<p class="text-zinc-400 text-sm leading-relaxed">
				¿Deseas activar el espacio para discapacitados y agregar la tarifa correspondiente?
			</p>

			<div class="flex flex-col gap-3 w-full">
				<AlertDialog.Action class="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest py-4 transition-all border border-transparent shadow-xl rounded-none m-0" onclick={() => {
					if (pendingDisabledSeatId) {
						bookingState.toggleSeat(pendingDisabledSeatId, 'DISCAPACITA', true);
						pendingDisabledSeatId = null;
					}
					showDisabledPrompt = false;
				}}>Activar</AlertDialog.Action>
				<AlertDialog.Cancel class="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest py-3 transition-colors rounded-none m-0" onclick={() => { pendingDisabledSeatId = null; }}>
					Cancelar
				</AlertDialog.Cancel>
			</div>
		</div>
	</AlertDialog.Content>
</AlertDialog.Root>

<div class="h-[100dvh] w-full overflow-hidden bg-[#0a0a0a] text-white flex flex-col font-sans relative">
	<!-- HEADER -->
	<header class="w-full bg-black border-b border-zinc-800 p-2 md:p-4 flex flex-col xl:flex-row gap-2 md:gap-4 sticky top-0 z-50 shadow-2xl">
		<!-- Go Back & Col 1: Movie Info -->
		<div class="flex-1 flex gap-3 md:gap-4 items-center border-r-0 xl:border-r border-zinc-800 pr-2 md:pr-4">
			<a href={resolve('/')} class="p-1.5 md:p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition text-zinc-400 hover:text-white shrink-0">
				<ArrowLeft class="size-4 md:size-5" />
			</a>
			{#if bookingState.activeSelection.movie}
				<img src={bookingState.activeSelection.movie.poster} alt="" class="h-16 w-10 md:h-24 md:w-16 object-cover rounded shadow-md shrink-0" />
				<div class="flex flex-col overflow-hidden">
					<h1 class="font-black text-lg md:text-3xl uppercase tracking-tight leading-none mb-1 md:mb-1.5 truncate">{bookingState.activeSelection.movie.title}</h1>
					<div class="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-xs font-bold text-zinc-400">
						<span class="border border-zinc-700 px-1 py-0.5 rounded-sm">{bookingState.activeSelection.movie.rating || 'B'}</span>
						<span>{bookingState.activeSelection.movie.duration || '2H 15M'}</span>
						<span class="px-1.5 py-0.5 bg-zinc-800 rounded-sm text-zinc-300">{bookingState.activeSelection.selectedShowtime?.format || '2D ESP'}</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Col 2: Date & Time -->
		<div class="flex-1 flex flex-col justify-center border-r-0 xl:border-r border-zinc-800 px-0 xl:px-4">
			<div class="flex items-center justify-between text-[10px] md:text-xs mb-1 md:mb-1.5">
				<span class="font-bold text-zinc-500 uppercase tracking-widest hidden md:inline">Función seleccionada:</span>
				<span class="font-bold text-zinc-500 uppercase tracking-widest md:hidden">Función:</span>
				<span class="text-white font-bold uppercase tracking-tight">{bookingState.activeSelection.selectedDate} • {bookingState.activeSelection.selectedShowtime?.time}</span>
			</div>
			<div class="hidden md:flex items-center justify-between text-[10px] md:text-xs mb-1.5">
				<span class="font-bold text-amber-500 uppercase tracking-widest">Fecha y hora:</span>
				<span class="font-bold text-amber-500 font-mono tracking-tighter">{currentDateStr} • {currentTimeStr}</span>
			</div>
			<div class="flex items-center justify-between mt-0.5 md:mt-1.5 border-t border-zinc-800/50 pt-1 md:pt-2">
				{#if bookingState.timeRemainingSeconds !== null}
					<div class="flex items-center gap-1 relative group">
						<span class="font-bold text-red-500/80 text-[10px] md:text-xs uppercase tracking-widest cursor-help">Tiempo restante:</span>
						<Info class="size-3 text-red-500/60 hover:text-red-500 cursor-help transition-colors" />
						<div class="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 border border-red-900/50 text-[10px] leading-tight text-red-200 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
							Al expirar este tiempo se cancelará la venta.
						</div>
					</div>
					<span class="font-mono font-black text-red-500 text-base md:text-lg animate-pulse">{formatTime(bookingState.timeRemainingSeconds)}<span class="text-[9px] md:text-[10px] font-bold text-red-500/80 tracking-widest ml-1">{bookingState.timeRemainingSeconds < 60 ? 'SEGS' : 'MIN'}</span></span>
				{:else}
					<div class="flex items-center gap-1">
						<span class="font-bold text-zinc-500 text-[10px] md:text-xs uppercase tracking-widest">Elige tus butacas</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Col 3: Tickets -->
		<div class="flex-[1.5] flex flex-col gap-0 px-0 xl:px-4 justify-center mt-1 xl:mt-0">
			{#if bookingState.tariffs.length === 0}
				<div class="text-zinc-500 text-[10px] md:text-xs font-mono text-center py-1 animate-pulse">Cargando tarifas...</div>
			{:else}
				<ScrollArea class="h-16 md:h-28 pr-2 md:pr-4">
					{#each bookingState.tariffs as tariff, i (tariff.id)}
						<div class="flex items-center {i < bookingState.tariffs.length - 1 ? 'border-b border-zinc-800/50 md:border-zinc-800' : ''} py-1 md:py-1.5">
							<div class="flex-1 flex items-center justify-start overflow-hidden pr-2">
								<span class="text-xs font-bold text-white uppercase tracking-wider truncate w-full">{tariff.nombre}</span>
							</div>
							<div class="w-16 shrink-0 flex items-center justify-center">
								<span class="text-zinc-500 font-bold text-xs">${tariff.precio.toFixed(2)}</span>
							</div>
							<div class="w-24 shrink-0 flex items-center justify-end gap-3">
								<button 
									class="size-6 rounded-full border border-zinc-600 flex items-center justify-center hover:border-white hover:text-white transition text-zinc-400" 
									onclick={() => { bookingState.ticketQuantities[tariff.id] = Math.max(0, (bookingState.ticketQuantities[tariff.id] || 0) - 1); bookingState.saveToLocalStorage(); }}
								>
									<Minus class="size-3" />
								</button>
								<span class="font-black text-lg w-4 text-center">{bookingState.ticketQuantities[tariff.id] || 0}</span>
								<button 
									class="size-6 rounded-full border border-zinc-600 flex items-center justify-center hover:border-white hover:text-white transition text-zinc-400" 
									onclick={() => { bookingState.ticketQuantities[tariff.id] = (bookingState.ticketQuantities[tariff.id] || 0) + 1; bookingState.saveToLocalStorage(); }}
								>
									<Plus class="size-3" />
								</button>
							</div>
						</div>
					{/each}
				</ScrollArea>
			{/if}
		</div>
	</header>

	<!-- MAIN: SEAT MAP -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<main 
		bind:this={mainEl}
		role="application"
		class="flex-1 overflow-auto touch-pan-x touch-pan-y w-full relative custom-scrollbar bg-[#0a0a0a] select-none {isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
		onmousedown={handleMouseDown}
		onmouseleave={handleMouseLeave}
		onmouseup={handleMouseUp}
		onmousemove={handleMouseMove}
	>
		
		{#if bookingState.isProcessing}
			<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
				<Loader2 class="size-12 text-amber-500 animate-spin" />
				<p class="text-zinc-300 font-bold tracking-widest uppercase text-sm md:text-base animate-pulse text-center px-4">
					{bookingState.loadingMessage || 'Procesando...'}
				</p>
			</div>
		{/if}

		<!-- NATIVE SCROLL CONTAINER -->
		<div class="w-full flex justify-center pt-8 pb-48 px-4 relative">
			<!-- WRAPPER PARA SCROLL BARS CORRECTOS -->
			<div 
				class="relative transition-all duration-500 ease-out" 
				style="width: {naturalWidth > 0 ? (naturalWidth * zoomScale) + 'px' : 'auto'}; height: {naturalHeight > 0 ? (naturalHeight * zoomScale) + 'px' : 'auto'};"
			>
				<!-- SEATING AREA MATRIX -->
				<div 
					id="seat-matrix" 
					class="absolute top-0 left-0 origin-top-left flex flex-col items-center w-max transition-transform duration-500 ease-out"
					style="transform: scale({zoomScale});"
				>
					<div class="flex flex-col gap-1 md:gap-1.5 w-max">
					
					<!-- Screen Curve matches exact width of seats -->
					<div class="w-full flex flex-col items-center -mb-6 mt-2 relative z-10 pointer-events-none">
						<div class="w-full h-12 border-t border-zinc-400/60 rounded-[100%] shadow-[0_-15px_40px_rgba(161,161,170,0.25)] relative overflow-hidden">
							<div class="absolute inset-0 bg-gradient-to-b from-zinc-400/20 to-transparent"></div>
						</div>
						<div class="flex flex-col items-center gap-2 mt-2 w-full px-8">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-zinc-400/40 animate-bounce mb-2">
								<path d="M12 19V5M5 12l7-7 7 7"/>
							</svg>
							<!-- Letra estilo Condensed, estirada verticalmente -->
							<div class="w-full text-center scale-y-[1.8] scale-x-[1.1] pointer-events-none select-none">
								<span class="text-zinc-400 font-normal tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-3xl sm:text-5xl md:text-7xl opacity-80" style="font-family: 'Bebas Neue', 'Oswald', 'Roboto Condensed', sans-serif;">PANTALLA</span>
							</div>
						</div>
					</div>
				{#each bookingState.matrix as row, rowIndex (rowIndex)}
					<div class="flex items-center gap-1 md:gap-1.5">
						{#each row as cell, cellIndex (cellIndex)}
							{#if cell.type === 'empty'}
								<!-- Pasillo o hueco vacío -->
								<div class="w-7 h-7 md:w-9 md:h-9 invisible"></div>
							{:else if cell.type === 'row-label'}
								<!-- Letra de la fila -->
								<div class="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center font-bold text-xs md:text-sm text-zinc-500">
									{cell.label}
								</div>
							{:else if cell.type === 'seat'}
								<!-- Butaca real -->
								{@const isSelected = bookingState.selectedSeats.includes(cell.id)}
								{@const isTaken = cell.status === 'taken'}
								{@const seatTypeUpper = (cell.seatType || 'GENERAL').toUpperCase()}
								{@const isWheelchair = seatTypeUpper.includes('DISCAPACITA')}
								{@const isSpecial = !seatTypeUpper.includes('GENERAL') && !seatTypeUpper.includes('BLOQUEADA') && !isWheelchair}
								
								<button 
									id="seat-{cell.id}"
									class="group relative w-7 h-7 md:w-9 md:h-9 flex items-center justify-center transition-transform duration-300 
										{isTaken ? 'text-zinc-800 cursor-not-allowed opacity-40' : 
										isSelected ? 'text-white scale-[1.3] z-20 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]' : 
										isWheelchair ? 'text-blue-400 hover:text-blue-300 hover:scale-110' :
										isSpecial ? 'text-purple-500 hover:text-purple-400 hover:scale-110' :
										'text-zinc-600 hover:text-zinc-400 hover:scale-110'}"
									disabled={isTaken}
									title={cell.seatType}
									onclick={() => handleSeatClick(cell.id, cell.seatType || 'General')}
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
											{cell.label.split(':')[1] || cell.label}
										</span>
									{/if}
								</button>
							{/if}
						{/each}
					</div>
				{/each}
				</div>
			</div>
		</div>
		</div>
	</main>

	<!-- Legend (Moved outside main to guarantee fixed floating behavior) -->
	<div class="fixed bottom-28 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-zinc-800/80 rounded-full px-6 py-2 flex gap-6 z-40 opacity-90 transition-all duration-300 {zoomScale > defaultZoom ? 'pointer-events-auto shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-zinc-900 cursor-pointer' : 'pointer-events-none'}">
		{#if zoomScale > defaultZoom}
			<button 
				class="flex items-center justify-center gap-3 w-full text-white font-bold tracking-widest uppercase text-xs animate-in zoom-in-95 fade-in duration-300"
				onclick={() => { zoomScale = defaultZoom; }}
			>
				<svg class="size-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M8 3v3a2 2 0 0 1-2 2H3" />
					<path d="M21 8h-3a2 2 0 0 1-2-2V3" />
					<path d="M3 16h3a2 2 0 0 1 2 2v3" />
					<path d="M16 21v-3a2 2 0 0 1 2-2h3" />
				</svg>
				Volver a Vista Completa
			</button>
		{:else}
			<div class="flex items-center gap-2 animate-in zoom-in-95 fade-in duration-300">
				<SeatIcon className="size-5 text-zinc-600" />
				<span class="text-xs font-medium text-zinc-400">Libre</span>
			</div>
			<div class="flex items-center gap-2 animate-in zoom-in-95 fade-in duration-300">
				<SeatIcon className="size-5 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
				<span class="text-xs font-medium text-white">Tu Selección</span>
			</div>
			<div class="flex items-center gap-2 animate-in zoom-in-95 fade-in duration-300">
				<SeatIcon className="size-5 text-zinc-800 opacity-40" />
				<span class="text-xs font-medium text-zinc-600">Ocupada</span>
			</div>
		{/if}
	</div>

	<!-- BOTTOM BAR -->
	<div class="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-2 md:p-6 z-50">
		<div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
			<div class="flex flex-col w-full md:w-auto">
				<div class="flex items-center gap-1.5 justify-center md:justify-start">
					<span class="text-[10px] md:text-sm font-bold text-zinc-400">Total a Pagar:</span>
					<span class="text-lg md:text-xl font-black text-white">${bookingState.totalPrice.toFixed(2)}</span>
					<span class="text-zinc-600 px-1 md:px-2">|</span>
					<span class="text-[10px] md:text-sm font-bold text-zinc-400">Butacas Elegidas:</span>
					<span class="text-lg md:text-xl font-black {bookingState.selectedSeats.length === bookingState.totalTickets && bookingState.totalTickets > 0 ? 'text-green-500' : 'text-amber-500'}">{bookingState.selectedSeats.length}</span>
				</div>
				{#if bookingState.totalTickets === 0}
					<span class="text-[9px] md:text-xs text-amber-500 flex items-center justify-center md:justify-start gap-1 mt-0.5 md:mt-1"><Info class="size-3 hidden md:block" /> Selecciona tickets o marca una butaca</span>
				{:else if bookingState.selectedSeats.length < bookingState.totalTickets}
					<span class="text-[9px] md:text-xs text-amber-500 flex items-center justify-center md:justify-start gap-1 mt-0.5 md:mt-1"><Info class="size-3 hidden md:block" /> Faltan {bookingState.totalTickets - bookingState.selectedSeats.length} butacas por elegir</span>
				{/if}
			</div>

			<button 
				class="w-[85%] mx-auto md:w-auto md:mx-0 px-4 py-2 md:px-8 md:py-3 bg-amber-400 text-black text-[11px] md:text-base font-bold uppercase tracking-widest rounded-full hover:bg-amber-300 transition-colors shadow-[0_0_20px_rgba(251,191,36,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!bookingState.canProceed || bookingState.isProcessing}
				onclick={async () => {
					const success = await bookingState.addSelectionToCart();
					if (success) {
						goto(resolve('/concessions/[id]', { id: id || '' }));
					}
				}}
			>
				{bookingState.isProcessing ? 'Procesando...' : 'Confirmar Asientos'}
			</button>
		</div>
		
	</div>
</div>
