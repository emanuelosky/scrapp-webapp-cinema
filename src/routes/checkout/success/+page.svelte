<script lang="ts">
	import { bookingState } from '$lib/state/booking.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import { resolve } from '$app/paths';

	onMount(() => {
		if (!bookingState.lastCompletedSale) {
			goto(resolve('/'));
		}
	});
</script>

{#if bookingState.lastCompletedSale}
	<div class="flex min-h-screen items-center justify-center bg-black p-4">
		<div class="w-full max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
			<div class="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-500/20 text-green-500">
				<CheckCircle2 class="size-10" />
			</div>
			<h1 class="font-display text-3xl font-black text-white">¡Compra Exitosa!</h1>
			<p class="text-zinc-400">
				Hemos enviado tu boleto digital al correo <br />
				<strong class="text-white">{bookingState.lastCompletedSale.customerEmail}</strong>.
			</p>

			<div class="space-y-4 rounded-2xl border border-white/5 bg-black/50 p-6 text-left">
				{#each bookingState.lastCompletedSale.cartItems as item (item.showtimeId)}
					<div class="border-b border-white/10 pb-4 last:border-0 last:pb-0">
						<div>
							<p class="mb-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">Película</p>
							<p class="text-lg font-medium text-white">{item.movieTitle}</p>
						</div>
						<div class="flex justify-between gap-4 mt-2">
							<div>
								<p class="mb-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">Función</p>
								<p class="text-white">{item.showtimeDate} • {item.showtimeTime}</p>
							</div>
							<div class="text-right">
								<p class="mb-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">Butacas</p>
								<p class="font-bold text-amber-400">{item.seats.join(', ')}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<button
				class="mt-8 h-14 w-full rounded-full bg-white font-bold tracking-widest text-black uppercase transition-colors hover:bg-zinc-200"
				onclick={() => {
					bookingState.lastCompletedSale = null;
					bookingState.saveToLocalStorage();
					goto(resolve('/'));
				}}
			>
				Comprar más entradas
			</button>
		</div>
	</div>
{/if}
