<script lang="ts">
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	let scrollY = $state(0);
</script>

<svelte:window bind:scrollY={scrollY} />

<button
	onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
	class="fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-xl ring-2 ring-white/20 transition-all duration-300 hover:scale-110 hover:bg-orange-500 {scrollY > 800 ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}"
	aria-label="Volver arriba"
>
	<ChevronUp class="h-8 w-8" />
</button>
