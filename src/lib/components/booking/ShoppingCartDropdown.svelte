<script lang="ts">
	import { bookingState } from '$lib/state/booking.svelte';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Clock from '@lucide/svelte/icons/clock';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import { slide, fade } from 'svelte/transition';
	import { page } from '$app/stores';

	let isOpen = $state(false);

	let formatTime = (seconds: number | null) => {
		if (seconds === null) return '--:--';
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s < 10 ? '0' : ''}${s}`;
	};

	let hasActiveCart = $derived(bookingState.timeRemainingSeconds !== null && bookingState.timeRemainingSeconds > 0);
	let isExpiringSoon = $derived(bookingState.timeRemainingSeconds !== null && bookingState.timeRemainingSeconds <= 60);


</script>

{#if hasActiveCart}
<div class="relative flex items-center gap-2 md:gap-4">
	<!-- Eliminamos el Floating Pill porque el tiempo ahora estará en el botón del carrito -->

	<div class="relative">
		<button 
			class="relative flex items-center gap-3 transition-colors duration-200 hover:text-white group px-2 py-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
			onclick={() => isOpen = !isOpen}
		>
			<div class="relative">
				<ShoppingCart class="size-4 md:size-5" />
				<span class="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black border border-black shadow-sm">
					{bookingState.cartItems.reduce((acc, item) => acc + item.seats.length, 0)}
				</span>
				<!-- Eliminado el mini reloj porque volvimos a la píldora -->
			</div>
			<div class="hidden md:flex flex-col items-start leading-none gap-1 overflow-visible">
				{#if hasActiveCart}
					<div class="flex items-center gap-1.5">
						<span class="text-[9px] uppercase tracking-widest text-zinc-500 font-bold whitespace-nowrap">Tiempo restante</span>
						<div class="relative group flex items-center justify-center">
							<span class="flex items-center justify-center size-3 rounded-full border border-zinc-500 text-[8px] text-zinc-500 font-bold cursor-help bg-zinc-800/50 hover:bg-zinc-700 transition-colors">?</span>
							<!-- Tooltip -->
							<div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-center z-[100] leading-tight">
								Al finalizar el tiempo se cerrará la venta y se liberarán tus butacas.
							</div>
						</div>
					</div>
					<span class="font-mono font-black text-[13px] tracking-tight {isExpiringSoon ? 'text-red-500 animate-pulse' : 'text-amber-500'}">
						{formatTime(bookingState.timeRemainingSeconds)}
					</span>
				{:else}
					<span class="text-[9px] uppercase tracking-widest text-zinc-400 font-bold group-hover:text-amber-500 transition-colors whitespace-nowrap">Tu Reserva</span>
				{/if}
			</div>
		</button>

		{#if isOpen}
		<!-- Backdrop for mobile -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm sm:hidden" transition:fade onclick={() => isOpen = false}></div>
		
		<!-- Dropdown Menu -->
		<div 
			class="fixed sm:absolute right-0 sm:right-0 bottom-0 sm:bottom-auto top-auto sm:top-full sm:mt-4 w-full sm:w-96 rounded-t-2xl sm:rounded-2xl border-t sm:border border-zinc-800 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl z-[70] overflow-hidden flex flex-col"
			transition:slide={{ duration: 200 }}
		>
			<!-- Header -->
			<div class="bg-black p-4 border-b border-zinc-800 flex flex-col gap-3">
				<div class="flex items-center justify-between">
					<h3 class="font-display uppercase tracking-widest text-sm font-black flex items-center gap-2 text-white">
						<ShoppingCart class="size-4 text-amber-500" />
						Carrito de Compras
					</h3>
					<div class="flex gap-2">
						<button class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/10 px-2 py-1.5 rounded" title="Cancelar Venta" onclick={() => { isOpen = false; bookingState.expireSession(); }}>
							<Trash2 class="size-3" /> <span class="hidden sm:inline">Vaciar</span>
						</button>
						<button class="sm:hidden text-zinc-500 hover:text-white p-1" onclick={() => isOpen = false}>
							&times;
						</button>
					</div>
				</div>
			</div>

			<!-- Body -->
			<div class="p-5 flex flex-col gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
				{#if bookingState.cartItems.length > 0}
					<div class="flex flex-col gap-6">
						{#each bookingState.cartItems as item (item.showtimeId)}
							<div class="flex flex-col gap-3">
								<div class="flex gap-4">
									<img src={item.moviePoster} alt="" class="w-16 h-24 object-cover rounded-md border border-zinc-800 shadow-lg" />
									<div class="flex flex-col flex-1 overflow-hidden">
										<h4 class="font-bold text-base uppercase tracking-tight text-white leading-tight mb-0.5">{item.movieTitle}</h4>
										<span class="text-[10px] font-semibold text-zinc-400">{item.showtimeDate} • {item.showtimeTime}</span>
										
										<div class="mt-2 flex flex-col gap-1">
											<div class="flex flex-wrap gap-1">
												{#each item.seats as seat (seat)}
													{@const parts = seat.split('-')}
													{@const formattedSeat = parts.length >= 2 ? `${parts[0]}:${parts[1]}` : seat}
													<span class="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded shadow-sm text-[10px] font-mono font-bold">{formattedSeat}</span>
												{/each}
											</div>
										</div>
									</div>
								</div>
								
								<div class="flex flex-col gap-1.5 pl-2 border-l-2 border-zinc-800 ml-2">
									{#each item.tariffs as tariff (tariff.nombre)}
										<div class="flex items-center justify-between text-xs">
											<span class="text-zinc-500 font-medium">Entrada {tariff.nombre} ({tariff.qty})</span>
											<span class="text-zinc-300">${(tariff.precio * tariff.qty).toFixed(2)}</span>
										</div>
									{/each}
								</div>
							</div>
							<div class="h-px bg-zinc-800/50 w-full"></div>
						{/each}
					</div>

					<!-- Concessions -->
					{#if bookingState.selectedConcessions.length > 0}
						<div class="flex flex-col gap-2 pt-2">
							<span class="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Dulcería</span>
							{#each bookingState.selectedConcessions as item (item.id)}
								<div class="flex items-center justify-between text-sm">
									<span class="text-zinc-400 font-medium">{item.quantity}x {item.name}</span>
									<span class="text-white">${(item.price * item.quantity).toFixed(2)}</span>
								</div>
							{/each}
						</div>
					{/if}

					<div class="flex items-center justify-between pt-4 border-t border-zinc-800 mt-2">
						<span class="text-xs text-white font-black uppercase tracking-widest">Total a Pagar</span>
						<span class="font-black text-2xl text-amber-500">${bookingState.totalPrice.toFixed(2)}</span>
					</div>

					<div class="flex items-start gap-3 {isExpiringSoon ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'} border p-3 rounded-lg text-xs mt-2 shadow-inner">
						{#if isExpiringSoon}
							<AlertCircle class="size-5 shrink-0 animate-pulse mt-0.5" />
						{:else}
							<Clock class="size-5 shrink-0 mt-0.5" />
						{/if}
						<div class="flex flex-col gap-0.5">
							<span class="font-bold text-[13px]">Tiempo Restante: <span class="font-mono text-sm tracking-tight">{formatTime(bookingState.timeRemainingSeconds)}</span></span>
							<span class="text-[10px] opacity-80 leading-snug">Si el contador llega a cero, tus butacas serán liberadas automáticamente.</span>
						</div>
					</div>
				{:else}
					<p class="text-zinc-500 text-sm text-center py-6 font-medium">El carrito está vacío.</p>
				{/if}
			</div>

			<!-- Footer -->
			<div class="p-4 bg-black border-t border-zinc-800 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] flex flex-col gap-3">
				{#if !$page.url.pathname.includes('/checkout')}
					<button 
						class="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest py-3 text-xs transition-colors rounded-md border border-zinc-700"
						onclick={() => {
							isOpen = false;
							window.location.href = '/';
						}}
					>
						Añadir Otra Película
					</button>
				{/if}
				<button 
					class="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest py-3.5 text-xs transition-colors rounded-md shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]"
					onclick={() => {
						isOpen = false;
						if (bookingState.cartItems.length > 0 && !$page.url.pathname.includes('/concessions') && !$page.url.pathname.includes('/checkout')) {
							// Use the last added item for the concessions link context
							const lastItem = bookingState.cartItems[bookingState.cartItems.length - 1];
							window.location.href = `/concessions/${lastItem.showtimeId}`;
						} else {
							// Ya estan en checkout
						}
					}}
				>
					{#if $page.url.pathname.includes('/checkout')}
						Estás en Checkout
					{:else}
						Ir a Pagar
					{/if}
				</button>
			</div>
		</div>
	{/if}
	</div>
</div>
{/if}
