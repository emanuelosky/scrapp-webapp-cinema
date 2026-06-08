<script lang="ts">
	import type { Movie } from '$lib/types';
	import { onMount } from 'svelte';

	let { movies = [] }: { movies: Movie[] } = $props();

	let currentIndex = $state(0);

	onMount(() => {
		if (movies.length <= 1) return;
		const interval = setInterval(() => {
			currentIndex = (currentIndex + 1) % movies.length;
		}, 4000);
		return () => clearInterval(interval);
	});

	function getStyle(index: number, current: number, total: number) {
		if (total === 0) return '';
		
		const diff = (index - current + total) % total;
		
		if (diff === 0) {
			// Center Main Poster
			return 'z-30 scale-100 opacity-100 translate-x-0 blur-none';
		} else if (diff === 1) {
			// Right Background Poster
			return 'z-20 scale-[0.80] opacity-50 translate-x-[60%] blur-[2px] brightness-50';
		} else if (diff === total - 1) {
			// Left Background Poster
			return 'z-10 scale-[0.80] opacity-50 -translate-x-[60%] blur-[2px] brightness-50';
		} else {
			// Hidden Posters
			return 'z-0 scale-[0.60] opacity-0 translate-x-0 blur-md';
		}
	}
</script>

<div class="relative w-full h-[288px] md:h-[384px] lg:h-[432px] xl:h-[480px] flex items-center justify-center perspective-[1000px]">
	{#if movies.length === 0}
		<div class="text-zinc-500 animate-pulse">Cargando cartelera...</div>
	{:else}
		{#each movies as movie, i (movie.id)}
			<div 
				class="absolute transition-all duration-700 ease-out w-48 md:w-64 lg:w-72 xl:w-80 aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] {getStyle(i, currentIndex, movies.length)}"
			>
				<img src={movie.poster} alt={movie.title} class="w-full h-full object-cover" />
				
				<!-- Overlay Gradient & Title for Center Item -->
				<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 text-center transition-opacity duration-500 {i === currentIndex ? 'opacity-100' : 'opacity-0'}">
					{#if movie.label}
						<span class="inline-block bg-[#d4af37] text-black text-[10px] font-black tracking-widest py-1 px-2 mb-2 uppercase rounded-sm">
							{movie.label}
						</span>
					{/if}
					<h3 class="text-white font-bold text-lg md:text-xl drop-shadow-md leading-tight">{movie.title}</h3>
				</div>
			</div>
		{/each}
	{/if}
</div>
