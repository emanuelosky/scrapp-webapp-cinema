<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/ui/button';
	import * as InputGroup from '$lib/components/ui/input-group';

	// Arranca como una simple lupa en las tres resoluciones (no solo mobile):
	// menos "pastillas" compitiendo en la barra todo el tiempo. Se expande al
	// tocarla, aprovechando el espacio que haya -- en pantallas angostas,
	// w-full la hace ocupar toda la fila y el resto de los controles (sede,
	// fecha) simplemente bajan a la siguiente gracias al flex-wrap del
	// contenedor, sin necesitar lógica aparte por breakpoint.
	let { query = $bindable('') }: { query?: string } = $props();

	let expanded = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	function expand() {
		expanded = true;
		requestAnimationFrame(() => inputEl?.focus());
	}

	// Colapsa sola al perder el foco SOLO si quedó vacía -- una búsqueda
	// activa debe seguir visible y editable, nunca desaparecer en silencio.
	function onBlur() {
		if (!query.trim()) expanded = false;
	}

	function clear() {
		query = '';
		inputEl?.focus();
	}
</script>

{#if !expanded}
	<Button
		type="button"
		variant="ghost"
		size="icon"
		onclick={expand}
		class="size-11 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:bg-zinc-800 hover:text-white shrink-0"
		aria-label="Buscar película"
	>
		<Search class="size-4" />
	</Button>
{:else}
	<InputGroup.Root class="h-11 rounded-full bg-zinc-900 border-white/10 w-full sm:w-64 shrink-0">
		<InputGroup.Addon class="pl-4 text-zinc-500">
			<Search class="size-4" />
		</InputGroup.Addon>
		<InputGroup.Input
			bind:ref={inputEl}
			bind:value={query}
			placeholder="BUSCAR PELÍCULA..."
			onblur={onBlur}
			class="text-white placeholder:text-zinc-600 font-black uppercase tracking-wide text-sm"
		/>
		{#if query}
			<InputGroup.Addon align="inline-end" class="pr-1.5">
				<InputGroup.Button
					type="button"
					size="icon-xs"
					onclick={clear}
					aria-label="Limpiar búsqueda"
					class="text-zinc-500 hover:text-white"
				>
					<X class="size-3.5" />
				</InputGroup.Button>
			</InputGroup.Addon>
		{/if}
	</InputGroup.Root>
{/if}
