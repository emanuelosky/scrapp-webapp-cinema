<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';

	let { open = $bindable(false) } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-sm bg-black border border-zinc-800 shadow-2xl rounded-none p-0 gap-0">
		<div class="px-6 py-5 border-b border-zinc-800 text-center">
			<Dialog.Title class="text-xl font-black text-white tracking-tight uppercase">Oops</Dialog.Title>
		</div>
		<div class="p-6 flex flex-col gap-6 text-center">
			<Dialog.Description class="text-zinc-400 text-[15px] max-w-[240px] mx-auto leading-relaxed">
				Esta función todavía no está disponible.
			</Dialog.Description>
			<div class="w-full">
				<Dialog.Close class="w-full bg-white text-black font-black uppercase tracking-widest hover:bg-zinc-200 transition-all border border-transparent shadow-xl py-3.5 px-8">
					Entendido
				</Dialog.Close>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
