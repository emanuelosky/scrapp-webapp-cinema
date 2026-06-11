<script lang="ts">
	import type { Movie } from '$lib/types';
	import Ticket from '@lucide/svelte/icons/ticket';

	let { movies = [] }: { movies: Movie[] } = $props();

	let currentIndex = $state(0);

	let interval: ReturnType<typeof setInterval>;
	
	$effect(() => {
		if (movies.length <= 1) return;
		interval = setInterval(() => {
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
			return 'z-20 scale-[0.80] opacity-0 md:opacity-50 translate-x-[60%] blur-[2px] brightness-50';
		} else if (diff === total - 1) {
			// Left Background Poster
			return 'z-10 scale-[0.80] opacity-0 md:opacity-50 -translate-x-[60%] blur-[2px] brightness-50';
		} else {
			// Hidden Posters
			return 'z-0 scale-[0.60] opacity-0 translate-x-0 blur-md';
		}
	}
</script>

<div class="relative w-full h-[180px] sm:h-[240px] md:h-[300px] lg:h-[384px] xl:h-[480px] flex items-center justify-center perspective-[1000px]">
	{#if movies.length === 0}
		<div class="text-zinc-500 animate-pulse">Cargando cartelera...</div>
	{:else}
		{#each movies as movie, i (movie.id)}
			<div 
				class="absolute transition-all duration-700 ease-out w-28 sm:w-36 md:w-48 lg:w-64 xl:w-80 aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] {getStyle(i, currentIndex, movies.length)}"
			>
				<img src={movie.poster} alt={movie.title} class="w-full h-full object-cover" />
				
				<!-- Top Left Label -->
				{#if movie.label}
					<div class="absolute top-4 left-[-4px] z-40 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] transition-opacity duration-500 {i === currentIndex ? 'opacity-100' : 'opacity-0'}">
						<div class="ticket-shape relative flex items-center justify-center py-1.5 px-4 
							{movie.label === 'PREVENTA' ? 'bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-400' : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500'}">
							<div class="absolute left-2.5 top-1 bottom-1 border-l-[1.5px] border-dashed border-black/30"></div>
							<div class="absolute right-2.5 top-1 bottom-1 border-r-[1.5px] border-dashed border-black/30"></div>
							
							<Ticket class="size-3.5 mr-1.5 text-black ml-1 opacity-90 shrink-0" />
							<span class="text-[10px] md:text-xs font-black text-black uppercase tracking-widest mr-1">
								{movie.label}
							</span>
						</div>
					</div>
				{/if}

				<!-- Overlay Gradient & Title for Center Item -->
				<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col items-center justify-end text-center transition-opacity duration-500 {i === currentIndex ? 'opacity-100' : 'opacity-0'}">
					<h3 class="text-white font-bold text-xs sm:text-sm md:text-lg lg:text-xl drop-shadow-md leading-tight">{movie.title}</h3>
				</div>
			</div>
		{/each}
	{/if}
</div>
