<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import { page } from '$app/stores';
	import { chatState } from '$lib/state/chat.svelte';

	// Botón flotante + burbuja proactiva. Es lo único del chat que se monta en
	// todas las páginas, así que tiene que ser barato: sin @ai-sdk, sin marked,
	// sin DOMPurify. El panel de conversación (EpikWidget, ~800 líneas y las
	// librerías pesadas) se descarga solo cuando el visitante abre el chat.
	//
	// Por eso la burbuja se pinta como TEXTO PLANO: antes pasaba por
	// marked+DOMPurify solo para poner una negrita, y eso arrastraba ~60 KB a
	// todas las páginas. Los asteriscos de Markdown se limpian con un reemplazo.
	let { onwarm }: { onwarm?: () => void } = $props();

	const quotes = [
		'Hola, soy EPIK. Pregúntame lo que necesites.',
		'Que la Fuerza te acompañe... a elegir película.',
		'Hasta la vista, baby... ¡Ah no, acabo de llegar! ¿Te ayudo?',
		'E.T. llama a casa... o mejor compra boletos aquí.',
		'Soy el rey del mundo... y de los horarios de cine.'
	];

	let scrollY = $state(0);
	let isCheckoutFlow = $derived(
		$page.url.pathname.includes('/booking') ||
			$page.url.pathname.includes('/checkout') ||
			$page.url.pathname.includes('/concessions')
	);

	// Texto sin marcas de Markdown (**negrita**, *cursiva*, `código`).
	let bubbleText = $derived(
		chatState.bubbleText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/[*_`]/g, '').trim()
	);

	// Frases cada tanto: una a los 3 s y luego cada 2 min, mientras el chat
	// esté cerrado.
	$effect(() => {
		const trigger = () => {
			if (chatState.isOpen) return;
			chatState.showBubble(quotes[Math.floor(Math.random() * quotes.length)]);
		};
		const initial = setTimeout(trigger, 3000);
		const interval = setInterval(trigger, 120000);
		return () => {
			clearTimeout(initial);
			clearInterval(interval);
		};
	});

	// La burbuja se esconde sola 8 s después de aparecer, la haya disparado el
	// lanzador o el panel.
	$effect(() => {
		if (!chatState.bubbleVisible) return;
		void chatState.bubbleText;
		const timer = setTimeout(() => chatState.hideBubble(), 8000);
		return () => clearTimeout(timer);
	});
</script>

<svelte:window bind:scrollY />

{#if !chatState.isOpen}
	<div
		class="fixed right-6 md:right-8 z-[90] flex items-end justify-end gap-4 pointer-events-none transition-all duration-300 {isCheckoutFlow
			? 'bottom-32 md:bottom-40'
			: scrollY > 800
				? 'bottom-[5.5rem] md:bottom-[6.5rem]'
				: 'bottom-6 md:bottom-8'}"
	>
		{#if chatState.bubbleVisible && bubbleText}
			<div
				class="mb-3 relative max-w-[220px] bg-white border-2 border-black text-black font-bold px-4 py-3 shadow-[4px_4px_0_rgba(0,0,0,1)] pointer-events-auto rounded-sm"
				transition:fly={{ y: 20, opacity: 0, duration: 300 }}
			>
				{bubbleText}
				<!-- Triángulo apuntando al botón -->
				<div class="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-l-[8px] border-l-white border-b-[8px] border-b-transparent filter drop-shadow-[2px_0_0_rgba(0,0,0,1)]"></div>
			</div>
		{/if}

		<button
			class="pointer-events-auto flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-500 border border-zinc-400 text-white shadow-[0_0_30px_rgba(228,228,231,0.25)] hover:scale-105 hover:shadow-[0_0_40px_rgba(228,228,231,0.4)] transition-all group shrink-0 relative"
			aria-label="Abrir chat con EPIK"
			onmouseenter={() => onwarm?.()}
			onfocus={() => onwarm?.()}
			ontouchstart={() => onwarm?.()}
			onclick={() => {
				chatState.hideBubble();
				chatState.open();
			}}
			transition:scale={{ start: 0.9, duration: 200 }}
		>
			<div class="relative flex items-center justify-center w-full h-full">
				<img src="/favicon.png" alt="" class="w-8 h-8 md:w-10 md:h-10 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />

				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] pointer-events-none z-10 opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" aria-hidden="true">
					<path d="M 65 20 Q 80 20 80 5 Q 80 20 95 20 Q 80 20 80 35 Q 80 20 65 20 Z" fill="white" class="animate-pulse origin-center" style="animation-duration: 1.5s;" />
					<path d="M 5 80 Q 18 80 18 67 Q 18 80 31 80 Q 18 80 18 93 Q 18 80 5 80 Z" fill="white" class="animate-pulse origin-center" style="animation-duration: 2.5s;" />
					<path d="M 10 25 Q 18 25 18 17 Q 18 25 26 25 Q 18 25 18 33 Q 18 25 10 25 Z" fill="white" class="animate-pulse origin-center" style="animation-duration: 2s;" />
				</svg>
			</div>
		</button>
	</div>
{/if}
