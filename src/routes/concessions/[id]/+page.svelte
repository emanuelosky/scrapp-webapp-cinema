<script lang="ts">
	import { bookingState } from '$lib/state/booking.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';

	let id = $derived($page.params.id);

	onMount(() => {
		if (!bookingState.movie || bookingState.selectedSeats.length === 0) {
			goto(resolve('/'));
		}
	});

	const EXCHANGE_RATE = 40.50; // Mock Tasa BCV
	let orderTotal = $derived(bookingState.totalPrice);
	let orderTotalBs = $derived(orderTotal * EXCHANGE_RATE);

	// Mock concession categories and products
	const categories = [
		{
			id: 'combos',
			title: 'Combos Exclusivos',
			image: 'https://images.unsplash.com/photo-1572177191856-3cde618dee1f?q=80&w=1200&auto=format&fit=crop',
			products: [
				{ id: 'c1', name: 'Combo Mega (2 Cotufas Grandes + 2 Refrescos)', price: 15.00 },
				{ id: 'c2', name: 'Combo Pareja (1 Cotufa Grande + 2 Refrescos)', price: 12.00 }
			]
		},
		{
			id: 'cotufas',
			title: 'Cotufas',
			image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=1200&auto=format&fit=crop',
			products: [
				{ id: 'p1', name: 'Cotufa Extra Grande', price: 7.00 },
				{ id: 'p2', name: 'Cotufa Mediana', price: 5.00 }
			]
		},
		{
			id: 'bebidas',
			title: 'Bebidas',
			image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=1200&auto=format&fit=crop',
			products: [
				{ id: 'd1', name: 'Refresco Grande (32oz)', price: 4.00 },
				{ id: 'd2', name: 'Agua Mineral', price: 2.00 }
			]
		},
		{
			id: 'carameleria',
			title: 'Caramelería',
			image: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?q=80&w=1200&auto=format&fit=crop',
			products: [
				{ id: 's1', name: 'Chocolate de Leche', price: 3.50 },
				{ id: 's2', name: 'Gomitas Ácidas', price: 3.00 }
			]
		}
	];

	let openCategory = $state<string | null>('combos');

	function toggleCategory(categoryId: string) {
		openCategory = openCategory === categoryId ? null : categoryId;
	}

	function getQuantity(productId: string) {
		return bookingState.selectedConcessions.find(c => c.id === productId)?.quantity || 0;
	}
</script>

<main class="min-h-screen bg-black pb-40 font-sans text-white">
	<!-- Header -->
	<header class="mx-auto flex max-w-5xl items-center gap-4 px-4 py-6">
		<button
			class="text-zinc-400 transition-colors hover:text-white"
			onclick={() => history.back()}
		>
			<ArrowLeft class="size-6" />
		</button>
		<div class="text-2xl font-black tracking-tighter italic">CONFIRMAR ORDEN</div>
	</header>

	<div class="container mx-auto max-w-5xl px-4">
		<div class="flex flex-col gap-12 lg:flex-row lg:gap-24">
			
			<!-- Left Column: Concessions Accordion -->
			<div class="flex-1 space-y-4">
				{#each categories as category (category.id)}
					<div class="rounded-xl overflow-hidden border border-white/10 bg-zinc-900/50">
						<!-- Banner / Header -->
						<button 
							class="w-full relative h-32 md:h-40 flex items-end p-6 cursor-pointer group"
							onclick={() => toggleCategory(category.id)}
						>
							<div class="absolute inset-0 bg-cover bg-center" style="background-image: url('{category.image}');"></div>
							<div class="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20 group-hover:from-black/90 transition-all"></div>
							
							<div class="relative w-full flex justify-between items-end">
								<h2 class="text-3xl font-black italic tracking-tighter shadow-black drop-shadow-md">{category.title}</h2>
								{#if openCategory === category.id}
									<ChevronUp class="size-8" />
								{:else}
									<ChevronDown class="size-8" />
								{/if}
							</div>
						</button>

						<!-- Product List (Accordion Body) -->
						{#if openCategory === category.id}
							<div class="p-6 bg-[#1a1a1a] divide-y divide-white/5">
								{#each category.products as product (product.id)}
									<div class="py-4 flex justify-between items-center first:pt-0 last:pb-0">
										<div class="pr-4">
											<h3 class="font-bold text-lg leading-tight mb-1">{product.name}</h3>
											<p class="text-amber-500 font-medium">${product.price.toFixed(2)}</p>
										</div>
										<div class="flex items-center gap-3 bg-black rounded-full px-2 py-1 border border-white/10 shrink-0">
											<button 
												class="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
												disabled={getQuantity(product.id) === 0}
												onclick={() => bookingState.updateConcession(product.id, product.name, product.price, -1)}
											>
												<Minus class="size-4" />
											</button>
											<span class="font-bold w-4 text-center">{getQuantity(product.id)}</span>
											<button 
												class="p-1.5 rounded-full hover:bg-white/10 transition-colors text-amber-500"
												onclick={() => bookingState.updateConcession(product.id, product.name, product.price, 1)}
											>
												<Plus class="size-4" />
											</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Right Column: Sticky Order Details -->
			<div class="w-full lg:w-[350px]">
				<div class="sticky top-12 space-y-6">
					<h2 class="mb-6 text-2xl font-bold tracking-tight">Detalles de la Orden</h2>

					<!-- Tickets -->
					<div class="space-y-3">
						<div class="flex items-center justify-between text-xs tracking-widest text-zinc-500 uppercase">
							<span>Entradas</span>
							<button
								class="font-bold tracking-normal text-[#00c0f3] capitalize hover:underline"
								onclick={() => history.back()}
							>Editar</button>
						</div>
						{#each bookingState.tariffs as tariff (tariff.id)}
							{#if bookingState.ticketQuantities[tariff.id] > 0}
								<div class="flex flex-col gap-0.5">
									<div class="flex justify-between text-sm font-bold">
										<span>Entrada {tariff.nombre} ({bookingState.ticketQuantities[tariff.id]})</span>
										<span>${(bookingState.ticketQuantities[tariff.id] * tariff.precio).toFixed(2)}</span>
									</div>
								</div>
							{/if}
						{/each}
					</div>

					<!-- Concessions List -->
					{#if bookingState.selectedConcessions.length > 0}
						<hr class="border-white/10" />
						<div class="space-y-3">
							<div class="flex items-center justify-between text-xs tracking-widest text-zinc-500 uppercase">
								<span>Combos y Dulces</span>
							</div>
							{#each bookingState.selectedConcessions as item (item.id)}
								<div class="flex justify-between text-sm font-bold">
									<span class="pr-4 leading-tight">{item.name} <span class="text-zinc-500 font-normal">x{item.quantity}</span></span>
									<span>${(item.price * item.quantity).toFixed(2)}</span>
								</div>
							{/each}
						</div>
					{/if}

					<hr class="border-white/10" />

					<!-- Total -->
					<div class="flex items-start justify-between w-full">
						<span class="text-xs tracking-widest text-zinc-500 uppercase pt-2">Total</span>
						<div class="flex flex-col items-end gap-1">
							<span class="text-3xl font-bold text-white leading-none">${orderTotal.toFixed(2)}</span>
							<span class="text-xl font-bold text-amber-500">Bs {orderTotalBs.toFixed(2)}</span>
						</div>
					</div>

				</div>
			</div>
		</div>
	</div>

	<!-- Fixed Bottom Bar -->
	<div class="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-white/10 p-4 md:p-6 z-50">
		<div class="container mx-auto max-w-5xl flex justify-between items-center">
			<div>
				<p class="text-[10px] md:text-xs text-zinc-400 uppercase tracking-widest font-bold mb-0.5 md:mb-1">Total a Pagar</p>
				<div class="flex flex-col md:flex-row md:items-baseline gap-0 md:gap-3">
					<p class="text-xl md:text-3xl font-bold leading-tight">${orderTotal.toFixed(2)}</p>
					<p class="text-sm md:text-2xl font-bold text-amber-500 leading-tight">Bs {orderTotalBs.toFixed(2)}</p>
				</div>
			</div>
			<button
				class="px-6 py-3 md:px-12 md:py-4 rounded bg-white text-black text-sm md:text-base font-bold uppercase tracking-widest transition-all hover:bg-zinc-200"
				onclick={() => goto(resolve('/checkout/[id]', { id: id || '' }))}
			>
				Continuar
			</button>
		</div>
	</div>
</main>
