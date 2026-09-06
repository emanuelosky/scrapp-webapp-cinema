<script lang="ts">
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import Volume1 from '@lucide/svelte/icons/volume-1';
	import { Slider } from '$lib/components/ui/slider';

	let {
		isMuted = $bindable(true),
		volume = $bindable(70),
		size = 'md'
	}: {
		isMuted?: boolean;
		volume?: number;
		size?: 'sm' | 'md';
	} = $props();

	let expanded = $state(false);
	let hideTimer: ReturnType<typeof setTimeout> | null = null;

	function show() {
		expanded = true;
		if (hideTimer) clearTimeout(hideTimer);
	}
	function scheduleHide() {
		if (hideTimer) clearTimeout(hideTimer);
		hideTimer = setTimeout(() => (expanded = false), 1000);
	}

	function toggleMute() {
		isMuted = !isMuted;
	}

	function onVolumeChange(v: number) {
		volume = v;
		if (v > 0 && isMuted) isMuted = false;
		if (v === 0 && !isMuted) isMuted = true;
	}

	let Icon = $derived(isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2);
	let btnSize = $derived(size === 'sm' ? 'size-11' : 'size-12 xl:size-14');
	let iconSize = $derived(size === 'sm' ? 'size-4' : 'size-4 xl:size-5');
</script>

<!--
	Botón de sonido con control de volumen "elástico": el slider vertical
	solo aparece al pasar el mouse o enfocar el botón (no ocupa espacio
	permanente), con estética plateada/glassmorphism sutil acorde al resto
	del hero. Se usa tanto en el overlay del hero como en el reproductor
	centrado (TrailerLightbox) — mismo componente, mismo estado compartido.
-->
<div
	class="relative flex flex-col items-center"
	role="group"
	onmouseenter={show}
	onmouseleave={scheduleHide}
	onfocusin={show}
	onfocusout={scheduleHide}
>
	{#if expanded}
		<div
			class="absolute bottom-full left-1/2 mb-2 flex h-24 -translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-gradient-to-b from-silverplate-500/20 via-black/40 to-black/40 px-1.5 py-3 shadow-xl backdrop-blur-md duration-150 animate-in fade-in zoom-in-95"
		>
			<Slider
				type="single"
				orientation="vertical"
				min={0}
				max={100}
				step={1}
				value={isMuted ? 0 : volume}
				onValueChange={onVolumeChange}
				class="h-full [&_[data-slot=slider-range]]:from-silverplate-300 [&_[data-slot=slider-range]]:to-silverplate-600 [&_[data-slot=slider-range]]:bg-gradient-to-t [&_[data-slot=slider-thumb]]:border-silverplate-200 [&_[data-slot=slider-thumb]]:bg-silverplate-200 [&_[data-slot=slider-track]]:bg-white/15"
			/>
		</div>
	{/if}
	<button
		type="button"
		onclick={toggleMute}
		class="flex {btnSize} shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white/40"
		aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
	>
		<Icon class={iconSize} />
	</button>
</div>
