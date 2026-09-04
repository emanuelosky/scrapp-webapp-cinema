<script lang="ts">
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	let scrollY = $state(0);
</script>

<svelte:window bind:scrollY={scrollY} />

<button
	onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
	class="fixed bottom-6 right-6 md:right-9 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-champagne-400 to-champagne-600 text-white shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-champagne-300/50 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] {scrollY > 800 ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}"
	aria-label="Volver arriba"
>
	<ChevronUp class="h-8 w-8" />
</button>
