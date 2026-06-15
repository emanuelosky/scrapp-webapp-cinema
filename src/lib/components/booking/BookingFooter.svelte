<script lang="ts">
	import { bookingState } from '$lib/state/booking.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Info from '@lucide/svelte/icons/info';

	let { id }: { id: string | undefined } = $props();
</script>

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
