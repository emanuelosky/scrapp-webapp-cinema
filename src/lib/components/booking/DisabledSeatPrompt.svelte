<script lang="ts">
	import * as AlertDialog from "$lib/components/ui/alert-dialog";
	import { bookingState } from '$lib/state/booking.svelte';

	let { show, pendingSeatId, onCancel }: { show: boolean, pendingSeatId: string | null, onCancel: () => void } = $props();
</script>

<AlertDialog.Root open={show} onOpenChange={(v) => !v && onCancel()}>
	<AlertDialog.Content class="bg-black border-none text-white shadow-2xl rounded-none p-0 gap-0 max-w-sm w-full flex flex-col items-center">
		<div class="w-full px-6 py-5 text-center flex flex-col items-center">
			<div class="flex items-center justify-center w-14 h-14 bg-zinc-900 border-none text-white rounded-full mb-4">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7">
					<circle cx="8" cy="12" r="4" />
					<path d="M12 12h3" />
					<path d="M15 12v-5h3" />
					<path d="M11 6h-2" />
				</svg>
			</div>
			<h2 class="text-xl font-black text-white tracking-tight uppercase">Atención Especial</h2>
		</div>
		
		<div class="p-6 flex flex-col gap-6 w-full text-center">
			<p class="text-zinc-400 text-sm leading-relaxed">
				¿Deseas activar el espacio para discapacitados y agregar la tarifa correspondiente?
			</p>

			<div class="flex flex-col gap-3 w-full">
				<AlertDialog.Action class="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest py-4 transition-all border border-transparent shadow-xl rounded-none m-0" onclick={() => {
					if (pendingSeatId) {
						bookingState.toggleSeat(pendingSeatId, 'DISCAPACITA', true);
					}
					onCancel();
				}}>Activar</AlertDialog.Action>
				<AlertDialog.Cancel class="w-full bg-zinc-900 border-none hover:bg-zinc-800 text-white font-bold uppercase tracking-widest py-3 transition-colors rounded-none m-0" onclick={onCancel}>
					Cancelar
				</AlertDialog.Cancel>
			</div>
		</div>
	</AlertDialog.Content>
</AlertDialog.Root>
