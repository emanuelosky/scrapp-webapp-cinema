<script lang="ts">
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { cinemaState } from '$lib/state/cinema.svelte';
	import { onMount } from 'svelte';

	let heroButtonTextIndex = $state(0);
	const heroButtonTexts = [
		{ text: '¿Todavía no sabes qué hacer?', duration: 30000, isLink: false },
		{ text: '¡Compra tus entradas!', duration: 90000, isLink: true }
	];
	
	onMount(() => {
		let timeoutId: ReturnType<typeof setTimeout>;
		
		function cycleText() {
			const current = heroButtonTexts[heroButtonTextIndex];
			timeoutId = setTimeout(() => {
				heroButtonTextIndex = (heroButtonTextIndex + 1) % heroButtonTexts.length;
				cycleText();
			}, current.duration);
		}
		
		cycleText();
		return () => clearTimeout(timeoutId);
	});
</script>

<div class="relative z-10 container mx-auto flex sm:hidden w-full flex-col items-center justify-center px-2 py-4 gap-4">
	<img
		src="/logo.svg"
		alt="Cinepic Logo"
		class="mx-auto h-20 w-auto object-contain drop-shadow-2xl mb-[-4px]"
	/>

	<h2
		class="font-display text-2xl leading-tight font-black tracking-widest text-white uppercase drop-shadow-2xl text-center"
	>
		{cinemaState.selectedCinema ? `SEDE ${cinemaState.selectedCinema}` : 'SEDE SAMBIL CANDELARIA'}
	</h2>

	<div class="relative flex h-10 w-full items-center justify-center overflow-hidden mt-2">
		{#key heroButtonTextIndex}
			<div class="absolute animate-in slide-in-from-bottom-2 fade-in duration-500 flex items-center gap-2">
				<Sparkles class="size-3 text-white drop-shadow-md" />
				{#if heroButtonTexts[heroButtonTextIndex].isLink}
					<button class="font-black tracking-widest uppercase text-xs border-b border-white hover:border-white/50 pb-0.5 transition-colors group cursor-pointer">
						<span class="text-white drop-shadow-md group-hover:opacity-80 transition-all">
							{heroButtonTexts[heroButtonTextIndex].text}
						</span>
					</button>
				{:else}
					<span class="font-black tracking-widest text-white uppercase text-xs drop-shadow-md">
						{heroButtonTexts[heroButtonTextIndex].text}
					</span>
				{/if}
				<Sparkles class="size-3 text-white drop-shadow-md" />
			</div>
		{/key}
	</div>
</div>
