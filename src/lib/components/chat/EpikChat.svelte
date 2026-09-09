<script lang="ts">
	import { chatState } from '$lib/state/chat.svelte';
	import EpikLauncher from './EpikLauncher.svelte';
	import type { Component } from 'svelte';

	// Frontera de carga del chat. El lanzador (botón + burbuja) va siempre; el
	// panel de conversación se pide en cuanto el visitante muestra intención
	// (pasar el mouse / tocar el botón) o lo abre. Un visitante que nunca usa
	// EPIK no descarga @ai-sdk, `ai`, marked ni DOMPurify -- eran ~80 KB
	// comprimidos en la ruta crítica de TODAS las páginas.
	//
	// Una vez cargado se queda montado aunque se cierre: el panel guarda la
	// conversación, y desmontarlo la perdería.
	let widget = $state<Component | null>(null);
	let loading = false;

	async function warm() {
		if (widget || loading) return;
		loading = true;
		try {
			widget = (await import('./EpikWidget.svelte')).default;
		} catch (e) {
			console.error('No se pudo cargar el chat de EPIK:', e);
			loading = false;
		}
	}

	// Abrirlo sin haber pasado por el botón (una acción del propio sitio puede
	// llamar a chatState.open()) también dispara la carga.
	$effect(() => {
		if (chatState.isOpen) warm();
	});
</script>

<EpikLauncher onwarm={warm} />

{#if widget}
	{@const Widget = widget}
	<Widget />
{/if}
