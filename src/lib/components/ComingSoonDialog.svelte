<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';

	let { open = $bindable(false) } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-sm bg-black border border-zinc-800 text-center flex flex-col items-center py-12 px-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-none">
		<Dialog.Title class="text-2xl font-black text-white tracking-tight uppercase">Oops</Dialog.Title>
		<Dialog.Description class="text-zinc-400 mt-4 text-[15px] max-w-[240px] mx-auto leading-relaxed">
			Esta función todavía no está disponible.
		</Dialog.Description>
		<div class="mt-10 w-full">
			<Dialog.Close class="w-full bg-zinc-900 text-white hover:bg-zinc-800 font-bold py-3.5 px-8 rounded-none transition-all border border-zinc-800 hover:border-zinc-700">
				Entendido
			</Dialog.Close>
		</div>
	</Dialog.Content>
</Dialog.Root>
