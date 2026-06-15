<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import Search from '@lucide/svelte/icons/search';
	import LocateFixed from '@lucide/svelte/icons/locate-fixed';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import { cinemaState } from '$lib/state/cinema.svelte';

	let { open = $bindable(false) } = $props();
	
	let searchQuery = $state('');
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[500px] bg-black border-none rounded-none shadow-2xl p-0 gap-0">
		<div class="px-6 py-5">
			<Dialog.Title class="text-xl md:text-2xl font-black text-white tracking-tight">Buscar un cine</Dialog.Title>
		</div>

		<div class="p-6 flex flex-col gap-6">
			<!-- Search Input -->
			<div class="relative w-full">
				<Input
					type="text"
					placeholder="Buscar por Ciudad, Zona o Cine"
					bind:value={searchQuery}
					class="w-full bg-zinc-900 border-none rounded-sm pl-4 pr-10 py-6 text-base text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-white/20"
				/>
				<Search class="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-zinc-500" />
			</div>

			<!-- Use Current Location -->
			<button 
				class="flex items-center gap-3 text-zinc-300 font-bold hover:text-white transition-colors text-lg text-left"
				onclick={async () => {
					await cinemaState.findNearestCinema();
					open = false;
				}}
			>
				{#if cinemaState.isLoadingLocation}
					<Loader2 class="size-5 animate-spin" /> Buscando ubicación...
				{:else}
					<LocateFixed class="size-5" /> Usar mi ubicación actual
				{/if}
			</button>

			<!-- Hardcoded List -->
			<div class="mt-4 flex flex-col gap-2">
				<h4 class="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-1">Cines Disponibles</h4>
				
				<button class="flex flex-col text-left py-4 hover:bg-zinc-900/30 transition-colors px-2 group"
					onclick={() => { cinemaState.selectedCinema = 'Sambil Candelaria'; open = false; }}>
					<span class="text-white font-bold text-lg group-hover:text-amber-400 transition-colors">CINEPIC</span>
					<span class="text-zinc-500 text-sm mt-1">Sambil Candelaria, Caracas</span>
				</button>

				<button class="flex flex-col text-left py-4 transition-colors px-2 cursor-default opacity-50"
					onclick={(e) => { e.preventDefault(); }}>
					<span class="text-white font-bold text-lg">CINEPIC VVIP</span>
					<span class="text-zinc-500 text-sm mt-1">Centro Lido, Caracas (Próximamente)</span>
				</button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
