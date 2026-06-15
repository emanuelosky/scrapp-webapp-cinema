<script lang="ts">
	import { bookingState } from '$lib/state/booking.svelte';
	import { resolve } from '$app/paths';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import Info from '@lucide/svelte/icons/info';
	import { ScrollArea } from "$lib/components/ui/scroll-area";

	let currentDate = $state(new Date());

	$effect(() => {
		const interval = setInterval(() => {
			currentDate = new Date();
		}, 1000);
		return () => clearInterval(interval);
	});

	let currentDateStr = $derived(currentDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase());
	let currentTimeStr = $derived(currentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));

	function formatTime(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}
</script>

<header class="w-full bg-black border-b border-zinc-800 p-2 md:p-4 flex flex-col xl:flex-row gap-2 md:gap-4 sticky top-0 z-50 shadow-2xl">
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
