<script lang="ts">
	import MapPin from '@lucide/svelte/icons/map-pin';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import TheatreSelectorDialog from '$lib/components/TheatreSelectorDialog.svelte';

	// Reemplaza la fila de chips por sede: con 3 sedes una fila de pastillas
	// se veía bien, pero no escala a 100. Este botón + el mismo diálogo con
	// buscador que ya usa el resto del sitio (`TheatreSelectorDialog`) sí
	// escala, y mantiene un solo mecanismo de cambio de sede en toda la app
	// en vez de uno nuevo solo para cartelera.
	let { sedeName, destination }: { sedeName: string; destination: 'home' | 'cartelera' } = $props();

	let open = $state(false);
</script>

<button
	type="button"
	class="flex items-center gap-2 h-11 pl-4 pr-3 rounded-full bg-zinc-900 border border-white/10 text-white font-black uppercase tracking-wide text-sm hover:bg-zinc-800 transition-colors shrink-0"
	onclick={() => (open = true)}
>
	<MapPin class="size-4 text-zinc-400" />
	<span class="truncate max-w-[160px] sm:max-w-none">{sedeName || 'Elegir cine'}</span>
	<ChevronDown class="size-4 text-zinc-400" />
</button>

<TheatreSelectorDialog bind:open {destination} />
