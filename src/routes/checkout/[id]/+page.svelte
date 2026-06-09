<script lang="ts">
	import { bookingState } from '$lib/state/booking.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import Info from '@lucide/svelte/icons/info';
	import Mail from '@lucide/svelte/icons/mail';
	import { resolve } from '$app/paths';

	onMount(() => {
		if (!bookingState.movie || bookingState.selectedSeats.length === 0) {
			goto(resolve('/'));
		}
	});

	let isProcessing = $state(false);
	let isSuccess = $state(false);

	async function handlePayment() {
		if (!bookingState.customerEmail || !bookingState.paymentMethod) {
			alert('Por favor completa tu correo y selecciona un método de pago.');
			return;
		}

		isProcessing = true;
		await new Promise((resolve) => setTimeout(resolve, 2500));
		isProcessing = false;
		isSuccess = true;
	}

	const EXCHANGE_RATE = 40.50; // Mock Tasa BCV
	let orderTotal = $derived(bookingState.totalPrice);
	let orderTotalBs = $derived(orderTotal * EXCHANGE_RATE);
</script>

{#if isSuccess}
	<div class="flex min-h-screen items-center justify-center bg-black p-4">
		<div
			class="w-full max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center"
		>
			<div
				class="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-500/20 text-green-500"
			>
				<CheckCircle2 class="size-10" />
			</div>
			<h1 class="font-display text-3xl font-black text-white">¡Compra Exitosa!</h1>
			<p class="text-zinc-400">
				Hemos enviado tu boleto digital al correo <br />
				<strong class="text-white">{bookingState.customerEmail}</strong>.
			</p>

			<div class="space-y-4 rounded-2xl border border-white/5 bg-black/50 p-6 text-left">
				<div>
					<p class="mb-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">Película</p>
					<p class="text-lg font-medium text-white">{bookingState.movie?.title}</p>
				</div>
				<div class="flex justify-between gap-4">
					<div>
						<p class="mb-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">Función</p>
						<p class="text-white">{bookingState.selectedDate} • {bookingState.selectedTime}</p>
					</div>
					<div class="text-right">
						<p class="mb-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">Butacas</p>
						<p class="font-bold text-amber-400">{bookingState.selectedSeats.join(', ')}</p>
					</div>
				</div>
			</div>

			<button
				class="mt-8 h-14 w-full rounded-full bg-white font-bold tracking-widest text-black uppercase transition-colors hover:bg-zinc-200"
				onclick={() => goto(resolve('/'))}
			>
				Volver al Inicio
			</button>
		</div>
	</div>
{:else}
	<main class="min-h-screen bg-black pb-32 font-sans text-white">
		<!-- Header minimalista tipo AMC -->
		<header class="mx-auto flex max-w-5xl items-center gap-4 px-4 py-6">
			<button
				class="text-zinc-400 transition-colors hover:text-white"
				onclick={() => history.back()}
			>
				<ArrowLeft class="size-6" />
			</button>
			<div class="text-2xl font-black tracking-tighter italic">CONFIRMAR PAGO</div>
		</header>

		<div class="container mx-auto max-w-5xl px-4">
			<div class="flex flex-col gap-12 lg:flex-row lg:gap-24">
				<!-- Left Column -->
				<div class="flex-1 space-y-10">
					<!-- CI Required -->
					<div
						class="rounded-r-xl border-l-4 border-amber-500/50 bg-amber-500/5 py-2 pl-4 opacity-70"
					>
						<h2
							class="mb-1 flex items-center gap-2 text-sm font-bold tracking-tight text-amber-500"
						>
							<Info class="size-4" />
							CI Requerida para Películas +18
						</h2>
						<p class="text-xs leading-relaxed text-zinc-300">
							Los menores de edad deben estar acompañados por un representante legal mayor de 21
							años. Por favor prepárate para mostrar tu Cédula de Identidad (CI) en el cine.
						</p>
					</div>

					<!-- Contact Info -->
					<div class="space-y-4">
						<h2 class="text-2xl font-bold tracking-tight">Información de Contacto</h2>
						<div class="space-y-1">
							<label for="email" class="text-sm font-bold">Correo Electrónico</label>
							<div class="relative">
								<Mail class="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-500" />
								<input
									id="email"
									type="email"
									placeholder="tucorreo@ejemplo.com"
									bind:value={bookingState.customerEmail}
									class="w-full rounded border-none bg-[#1a1a1a] py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-amber-400 focus:outline-none"
								/>
							</div>
							<p class="pt-1 text-xs text-zinc-500">
								Tu recibo y confirmación de compra serán enviados a este correo.
							</p>
						</div>
						<hr class="mt-6 border-white/10" />
					</div>

					<!-- Movie Start Time -->
					<div class="space-y-3">
						<h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								class="size-6"
								><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line
									x1="7"
									y1="2"
									x2="7"
									y2="22"
								/><line x1="17" y1="2" x2="17" y2="22" /><line
									x1="2"
									y1="12"
									x2="22"
									y2="12"
								/><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line
									x1="17"
									y1="17"
									x2="22"
									y2="17"
								/><line x1="17" y1="7" x2="22" y2="7" /></svg
							>
							Hora de Inicio
						</h2>
						<p class="text-sm leading-relaxed text-zinc-400">
							El horario mostrado es cuando comienzan los tráilers y el contenido adicional. La
							película empezará 25-30 minutos después del horario indicado.
						</p>
						<hr class="mt-6 border-white/10" />
					</div>

					<!-- Payment -->
					<div class="space-y-6">
						<h2 class="text-2xl font-bold tracking-tight">Pago</h2>

						<div class="flex gap-4 border-b border-white/10 pb-4">
							<button
								class="text-sm font-medium {bookingState.paymentMethod === 'card'
									? '-mb-4 border-b-2 border-amber-400 pb-4 text-white'
									: 'text-zinc-500'}"
								onclick={() => (bookingState.paymentMethod = 'card')}>Tarjeta</button
							>
							<button
								class="text-sm font-medium {bookingState.paymentMethod === 'zelle'
									? '-mb-4 border-b-2 border-amber-400 pb-4 text-white'
									: 'text-zinc-500'}"
								onclick={() => (bookingState.paymentMethod = 'zelle')}>Zelle</button
							>
							<button
								class="text-sm font-medium {bookingState.paymentMethod === 'pago_movil'
									? '-mb-4 border-b-2 border-amber-400 pb-4 text-white'
									: 'text-zinc-500'}"
								onclick={() => (bookingState.paymentMethod = 'pago_movil')}>Pago Móvil</button
							>
						</div>

						{#if bookingState.paymentMethod === 'card'}
							<div class="space-y-4 pt-2">
								<div class="space-y-1">
									<label for="cardNumber" class="text-sm font-bold">Número de Tarjeta</label>
									<input
										id="cardNumber"
										type="text"
										class="w-full rounded bg-[#1a1a1a] p-4 text-white"
									/>
								</div>
								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-1">
										<label for="exp" class="text-sm font-bold">Vencimiento</label>
										<input
											id="exp"
											type="text"
											placeholder="MM/AA"
											class="w-full rounded bg-[#1a1a1a] p-4 text-white"
										/>
									</div>
									<div class="space-y-1">
										<label for="cvv" class="text-sm font-bold">CVV</label>
										<input
											id="cvv"
											type="text"
											class="w-full rounded bg-[#1a1a1a] p-4 text-white"
										/>
									</div>
								</div>
							</div>
						{/if}

						{#if bookingState.paymentMethod === 'zelle'}
							<div class="space-y-2 rounded bg-[#1a1a1a] p-4 text-sm text-zinc-400">
								<p>Transfiere a: <strong class="text-white">pagos@scrappcinema.com</strong></p>
								<p>Titular: Scrapp Cinema LLC</p>
								<div class="pt-2">
									<label for="zelleRef" class="mb-1 block text-sm font-bold text-white"
										>Nombre del Titular Zelle</label
									>
									<input
										id="zelleRef"
										type="text"
										class="w-full rounded border border-white/10 bg-black p-3 text-white"
									/>
								</div>
							</div>
						{/if}

						{#if bookingState.paymentMethod === 'pago_movil'}
							<div class="space-y-2 rounded bg-[#1a1a1a] p-4 text-sm text-zinc-400">
								<p>Banco: <strong class="text-white">Banesco (0134)</strong></p>
								<p>Teléfono: <strong class="text-white">0414-1234567</strong></p>
								<p>RIF: <strong class="text-white">J-12345678-9</strong></p>
								<div class="pt-2">
									<label for="pmRef" class="mb-1 block text-sm font-bold text-white"
										>Referencia</label
									>
									<input
										id="pmRef"
										type="text"
										class="w-full rounded border border-white/10 bg-black p-3 text-white"
									/>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Right Column: Order Details (AMC Style) -->
				<div class="w-full lg:w-[350px]">
					<div class="sticky top-12 space-y-6">
						<h2 class="mb-6 text-2xl font-bold tracking-tight">Detalles de la Orden</h2>

						<!-- Tickets -->
						<div class="space-y-3">
							<div
								class="flex items-center justify-between text-xs tracking-widest text-zinc-500 uppercase"
							>
								<span>Entradas</span>
								<button
									class="font-bold tracking-normal text-[#00c0f3] capitalize hover:underline"
									onclick={() => history.back()}>Editar</button
								>
							</div>
							{#if bookingState.adultTickets > 0}
								<div class="flex flex-col gap-0.5">
									<div class="flex justify-between text-sm font-bold">
										<span>Entrada Adulto ({bookingState.adultTickets})</span>
										<span>${(bookingState.adultTickets * 5).toFixed(2)}</span>
									</div>
									<span class="text-xs text-zinc-500 font-medium">Butacas: {bookingState.selectedSeats.slice(0, bookingState.adultTickets).join(', ')}</span>
								</div>
							{/if}
							{#if bookingState.childTickets > 0}
								<div class="flex flex-col gap-0.5">
									<div class="flex justify-between text-sm font-bold">
										<span>Entrada Niño ({bookingState.childTickets})</span>
										<span>${(bookingState.childTickets * 2.5).toFixed(2)}</span>
									</div>
									<span class="text-xs text-zinc-500 font-medium">Butacas: {bookingState.selectedSeats.slice(bookingState.adultTickets, bookingState.adultTickets + bookingState.childTickets).join(', ')}</span>
								</div>
							{/if}
							{#if bookingState.seniorTickets > 0}
								<div class="flex flex-col gap-0.5">
									<div class="flex justify-between text-sm font-bold">
										<span>Entrada 3ra Edad ({bookingState.seniorTickets})</span>
										<span>${(bookingState.seniorTickets * 2.5).toFixed(2)}</span>
									</div>
									<span class="text-xs text-zinc-500 font-medium">Butacas: {bookingState.selectedSeats.slice(bookingState.adultTickets + bookingState.childTickets).join(', ')}</span>
								</div>
							{/if}
						</div>

						<hr class="border-white/10" />

						<!-- Food & Drinks -->
						<div
							class="flex items-center justify-between text-xs tracking-widest text-zinc-500 uppercase"
						>
							<span>Combos y Dulces</span>
							<button class="font-bold tracking-normal text-[#00c0f3] capitalize hover:underline" onclick={() => history.back()}>Editar</button>
						</div>
						
						{#if bookingState.selectedConcessions.length > 0}
							<div class="space-y-3 mt-3">
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

						<button
							class="mt-8 w-full rounded bg-amber-400 py-4 font-bold tracking-widest text-black uppercase transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
							onclick={handlePayment}
							disabled={isProcessing}
						>
							{#if isProcessing}
								Procesando...
							{:else}
								Pagar Orden
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	</main>
{/if}
