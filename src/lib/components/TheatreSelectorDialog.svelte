<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import Search from '@lucide/svelte/icons/search';
	import LocateFixed from '@lucide/svelte/icons/locate-fixed';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { cinemaState, type CinemaLocation } from '$lib/state/cinema.svelte';
	import { onMount } from 'svelte';
	import { goto, preloadCode, preloadData } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';

	let {
		open = $bindable(false),
		pendingMovieId,
		destination = 'home'
	}: { open?: boolean; pendingMovieId?: string; destination?: 'home' | 'cartelera' } = $props();

	let searchQuery = $state('');
	let showConsent = $state(false);

	// Lo caro de ir a una sede no son los datos (~0.3s) sino descargar y evaluar
	// el JS de la ruta /cines/[sede] la primera vez (~2s, con el hilo principal
	// bloqueado). Ese código es el MISMO para todas las sedes, así que lo
	// pedimos apenas se abre el diálogo, mientras el usuario lee la lista.
	$effect(() => {
		if (open) preloadCode('/cines/[sede]');
	});

	// Adelantamos la cartelera de cada sede. En desktop se dispara al pasar el
	// mouse (segundos de ventaja); en tactil no hay hover, asi que `pointerdown`
	// la arranca al apoyar el dedo y gana el hueco hasta que suelta (~100ms).
	// Guardamos las ya pedidas para no repetir fetch si se disparan ambos.
	const calentadas = new SvelteSet<string>();

	function warmUp(cinema: CinemaLocation) {
		if (calentadas.has(cinema.id)) return;
		calentadas.add(cinema.id);
		preloadData(resolve(`/cines/${cinema.id}`));
	}

	// Elegir una sede SIEMPRE navega: es la URL la que define la sede activa,
	// así que quedarse en `/` tras elegir dejaba el header mintiendo.
	// Si venimos de una tarjeta de película llevamos su id como query param
	// para que la sede abra esa ficha; nunca saltamos directo a las butacas,
	// porque sin función elegida `bookingState.movie` está vacío y el selector
	// de butacas rebota de vuelta.
	async function selectCinema(cinema: CinemaLocation) {
		cinemaState.rememberPreference(cinema.id);
		open = false;
		const sedeHome =
			destination === 'cartelera' ? resolve(`/cines/${cinema.id}/cartelera`) : resolve(`/cines/${cinema.id}`);
		const target = pendingMovieId
			? `${sedeHome}?pelicula=${encodeURIComponent(pendingMovieId)}`
			: sedeHome;
		// `sedeHome` ya viene de resolve(); la regla no sigue la variable.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(target);
	}

	onMount(() => {
		cinemaState.verifyCatalog();
	});

	const filteredCinemas = $derived(
		cinemaState.cinemas.filter(c => {
			const term = searchQuery.toLowerCase();
			return (c.name || '').toLowerCase().includes(term) || (c.city || '').toLowerCase().includes(term);
		})
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[500px] bg-black border-none rounded-none shadow-2xl p-0 gap-0">
		<div class="px-6 py-5">
			<Dialog.Title class="text-xl md:text-2xl font-black text-white tracking-tight">Buscar un cine</Dialog.Title>
		</div>

		<div class="p-6 flex flex-col gap-6">
			<!-- Search Input -->
			{#if !showConsent}
				<div class="relative w-full">
					<Input
						type="text"
						placeholder="Buscar por Ciudad, Zona o Cine"
						bind:value={searchQuery}
						class="w-full bg-zinc-900 border-none rounded-sm pl-4 pr-10 py-6 text-base text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-white/20"
					/>
					<Search class="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-zinc-500" />
				</div>
			{/if}

			<!-- Use Current Location / Consent -->
			{#if showConsent}
				<div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 flex flex-col gap-3">
					<div class="flex items-start gap-3">
						<MapPin class="size-5 text-champagne-400 shrink-0 mt-0.5" />
						<div>
							<h4 class="text-white font-bold text-sm">Permiso de Ubicación</h4>
							<p class="text-zinc-400 text-xs mt-1 leading-relaxed">
								Usamos tu ubicación únicamente en este momento para mostrarte el cine más cercano. No almacenamos estos datos en nuestros servidores.
							</p>
						</div>
					</div>
					<div class="flex items-center gap-3 mt-2">
						<button
							class="flex-1 bg-white text-black py-2.5 rounded-sm font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
							disabled={cinemaState.isLoadingLocation}
							onclick={async () => {
								const cinema = await cinemaState.findNearestCinema();
								// Si no hubo permiso o falló la red dejamos el diálogo
								// abierto en la lista para que elija a mano, en vez de
								// cerrarlo asumiendo una sede que el usuario no pidió.
								showConsent = false;
								if (cinema) await selectCinema(cinema);
							}}
						>
							{#if cinemaState.isLoadingLocation}
								<Loader2 class="size-4 animate-spin" /> Buscando...
							{:else}
								Permitir
							{/if}
						</button>
						<button 
							class="flex-1 bg-transparent text-white border border-zinc-700 py-2.5 rounded-sm font-bold text-sm hover:bg-zinc-800 transition-colors"
							disabled={cinemaState.isLoadingLocation}
							onclick={() => { showConsent = false; }}
						>
							Cancelar
						</button>
					</div>
				</div>
			{:else}
				<button 
					class="flex items-center gap-3 text-zinc-300 font-bold hover:text-white transition-colors text-lg text-left"
					onclick={() => { showConsent = true; }}
				>
					<LocateFixed class="size-5" /> Encontrar mi cine más cercano
				</button>
			{/if}

			<!-- Dynamic List -->
			{#if !showConsent}
				<div class="mt-4 flex flex-col gap-2">
					<h4 class="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-1">Cines Disponibles</h4>
					
					{#if cinemaState.isLoadingCinemas}
						<div class="flex items-center gap-2 text-zinc-500 py-4 px-2 text-sm">
							<Loader2 class="size-4 animate-spin" /> Cargando cines...
						</div>
					{:else if filteredCinemas.length === 0}
						<div class="text-zinc-500 py-4 px-2 text-sm">
							No se encontraron cines.
						</div>
					{:else}
						{#each filteredCinemas as cinema (cinema.id)}
							<button class="flex flex-col text-left py-4 hover:bg-zinc-900/30 transition-colors px-2 group"
								onclick={() => selectCinema(cinema)}
								onpointerenter={() => warmUp(cinema)}
								onpointerdown={() => warmUp(cinema)}
								onfocus={() => warmUp(cinema)}>
								<span class="flex items-center gap-2">
									<span class="text-white font-bold text-lg group-hover:text-champagne-400 transition-colors">
										CINEPIC
									</span>
									{#if cinemaState.selectedCinemaId === cinema.id}
										<span class="text-[9px] font-bold uppercase tracking-widest text-champagne-400 border border-champagne-400/40 rounded-sm px-1.5 py-0.5">Aquí</span>
									{:else if cinemaState.preferredCinemaId === cinema.id}
										<span class="text-[9px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-700 rounded-sm px-1.5 py-0.5">Tu último cine</span>
									{/if}
								</span>
								<span class="text-zinc-500 text-sm mt-1">
									{cinema.name}, {cinema.city || 'Caracas'}
								</span>
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
