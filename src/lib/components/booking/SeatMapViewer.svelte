<script lang="ts">
	import { bookingState } from '$lib/state/booking.svelte';
	import SeatIcon from '$lib/components/booking/SeatIcon.svelte';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	let { onSeatWheelchair }: { onSeatWheelchair: (seatId: string) => void } = $props();

	let zoomScale = $state(1);
	let defaultZoom = $state(1);
	
	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let matrixWidth = $state(0);
	let matrixHeight = $state(0);

	let isDragging = $state(false);
	let startX = 0;
	let startY = 0;
	let scrollLeft = 0;
	let scrollTop = 0;
	let mainEl = $state<HTMLElement | null>(null);

	$effect(() => {
		if (bookingState.matrix && bookingState.matrix.length > 0 && containerWidth > 0 && containerHeight > 0 && matrixWidth > 0 && matrixHeight > 0) {
			const availableWidth = containerWidth - 48;
			const availableHeight = containerHeight - 64;
			
			const isMobile = window.innerWidth < 768;
			
			if (isMobile) {
				defaultZoom = 1.0;
			} else {
				const scaleX = availableWidth / matrixWidth;
				const scaleY = availableHeight / matrixHeight;
				defaultZoom = Math.min(scaleX, scaleY, 1.0);
			}
			
			if (bookingState.selectedSeats.length === 0 && zoomScale === 1) {
				zoomScale = defaultZoom;
			}
		}
	});

	function handleSeatClick(seatId: string, seatType: string = 'General') {
		const isSelected = bookingState.selectedSeats.includes(seatId);
		
		const doZoom = () => {
			if (!isSelected) {
				zoomScale = 1.3;
				setTimeout(() => {
					const seatEl = document.getElementById(`seat-${seatId}`);
					if (seatEl) {
						seatEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
					}
				}, 150);
			} else if (isSelected && bookingState.selectedSeats.length === 0) {
				zoomScale = defaultZoom;
			}
		};

		if (seatType.toUpperCase().includes('DISCAPACITA') && !isSelected) {
			const hasDisabledTariff = bookingState.tariffs.some(t => t.nombre.toUpperCase().includes('DISCAPACITA'));
			if (hasDisabledTariff) {
				bookingState.toggleSeat(seatId, seatType, true);
				doZoom();
			} else {
				onSeatWheelchair(seatId);
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

	function handleMouseLeave() { isDragging = false; }
	function handleMouseUp() { isDragging = false; }

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !mainEl) return;
		e.preventDefault();
		const x = e.pageX - mainEl.offsetLeft;
		const y = e.pageY - mainEl.offsetTop;
		const walkX = (x - startX) * 1.5;
		const walkY = (y - startY) * 1.5;
		mainEl.scrollLeft = scrollLeft - walkX;
		mainEl.scrollTop = scrollTop - walkY;
	}
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
</svelte:head>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<main 
	bind:this={mainEl}
	bind:clientWidth={containerWidth}
	bind:clientHeight={containerHeight}
	role="application"
	class="flex-1 overflow-auto touch-pan-x touch-pan-y w-full relative custom-scrollbar bg-[#0a0a0a] select-none {isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
	onmousedown={handleMouseDown}
	onmouseleave={handleMouseLeave}
	onmouseup={handleMouseUp}
	onmousemove={handleMouseMove}
>
	{#if bookingState.isProcessing}
		<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
			<Loader2 class="size-12 text-white animate-spin" />
			<p class="text-zinc-300 font-bold tracking-widest uppercase text-sm md:text-base animate-pulse text-center px-4">
				{bookingState.loadingMessage || 'Procesando...'}
			</p>
		</div>
	{/if}

	<div class="w-full flex justify-center pt-8 pb-48 px-4 relative">
		<div 
			class="relative transition-all duration-500 ease-out" 
			style="width: {matrixWidth > 0 ? (matrixWidth * zoomScale) + 'px' : 'auto'}; height: {matrixHeight > 0 ? (matrixHeight * zoomScale) + 'px' : 'auto'};"
		>
			<div 
				bind:clientWidth={matrixWidth}
				bind:clientHeight={matrixHeight}
				class="absolute top-0 left-0 origin-top-left flex flex-col items-center w-max transition-transform duration-500 ease-out"
				style="transform: scale({zoomScale});"
			>
				<div class="flex flex-col gap-1 md:gap-1.5 w-max">
					<div class="w-full flex flex-col items-center -mb-6 mt-2 relative z-10 pointer-events-none">
						<!-- Proyector light effect -->
						<div class="absolute -bottom-16 w-[140%] h-48 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none z-0"></div>
						<div class="w-full h-12 border-t-2 border-white/50 rounded-[100%] shadow-[0_-15px_50px_rgba(255,255,255,0.3)] relative overflow-hidden z-10">
							<div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
						</div>
						<div class="flex flex-col items-center gap-2 mt-2 w-full px-8">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-zinc-400/40 animate-bounce mb-2">
								<path d="M12 19V5M5 12l7-7 7 7"/>
							</svg>
							<div class="w-full text-center scale-y-[1.8] scale-x-[1.1] pointer-events-none select-none">
								<span class="text-zinc-400 font-normal tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-3xl sm:text-5xl md:text-7xl opacity-80" style="font-family: 'Bebas Neue', 'Oswald', 'Roboto Condensed', sans-serif;">PANTALLA</span>
							</div>
						</div>
					</div>
					{#each bookingState.matrix as row, rowIndex (rowIndex)}
						<div class="flex items-center gap-1 md:gap-1.5">
							{#each row as cell, cellIndex (cellIndex)}
								{#if cell.type === 'empty'}
									<div class="w-7 h-7 md:w-9 md:h-9 invisible"></div>
								{:else if cell.type === 'row-label'}
									<div class="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center font-bold text-xs md:text-sm text-zinc-500">
										{cell.label}
									</div>
								{:else if cell.type === 'seat'}
									{@const isSelected = bookingState.selectedSeats.includes(cell.id)}
									{@const isTaken = cell.status === 'taken'}
									{@const seatTypeUpper = (cell.seatType || 'GENERAL').toUpperCase()}
									{@const isWheelchair = seatTypeUpper.includes('DISCAPACITA')}
									{@const isSpecial = !seatTypeUpper.includes('GENERAL') && !seatTypeUpper.includes('BLOQUEADA') && !isWheelchair}
									
									<button 
										id="seat-{cell.id}"
										class="group relative w-7 h-7 md:w-9 md:h-9 flex items-center justify-center transition-transform duration-300 
											{isTaken ? 'text-zinc-800 cursor-not-allowed opacity-40' : 
											isSelected ? 'text-white scale-[1.3] z-20 drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]' : 
											isWheelchair ? 'text-zinc-300 hover:text-white hover:scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]' :
											isSpecial ? 'text-zinc-400 hover:text-zinc-300 hover:scale-110' :
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

<div class="fixed bottom-28 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-zinc-800/80 rounded-full px-6 py-2 flex gap-6 z-40 opacity-90 transition-all duration-300 {zoomScale > defaultZoom ? 'pointer-events-auto shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-zinc-900 cursor-pointer' : 'pointer-events-none'}">
	{#if zoomScale > defaultZoom}
		<button 
			class="flex items-center justify-center gap-3 w-full text-white font-bold tracking-widest uppercase text-xs animate-in zoom-in-95 fade-in duration-300"
			onclick={() => { zoomScale = defaultZoom; }}
		>
			<svg class="size-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
