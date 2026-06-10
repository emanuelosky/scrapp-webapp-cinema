<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel';
	import type { Movie } from '$lib/types';

	let { movies } = $props<{ movies: Movie[] }>();
	
	import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
	let api = $state<CarouselAPI>();
	let canScroll = $state(false);

	$effect(() => {
		if (!api) return;
		const checkScroll = () => {
			if (!api) return;
			canScroll = api.canScrollNext() || api.canScrollPrev();
		};
		api.on('reInit', checkScroll);
		api.on('resize', checkScroll);
		checkScroll();
		
		return () => {
			api?.off('reInit', checkScroll);
			api?.off('resize', checkScroll);
		};
	});
</script>

<div class="w-full bg-[#000000] relative z-20">
	<div class="mx-auto max-w-7xl px-4 py-16 md:py-24">
		<div class="mb-12 text-center flex flex-col items-center">
			<h2 class="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">Próximos Estrenos</h2>
			<p class="text-zinc-400 mt-2 text-lg">Pronto en nuestras salas</p>
		</div>

		<section class="relative">
			<Carousel.Root opts={{ align: 'center', loop: false }} setApi={(a) => api = a} class="w-full">
				<Carousel.Content class="-ml-2 md:-ml-4 {canScroll ? '' : 'justify-center'}">
					{#each movies as movie (movie.id)}
						<Carousel.Item class="pl-2 md:pl-4 basis-[45%] sm:basis-[30%] md:basis-[22%] lg:basis-1/5">
							<div role="button" tabindex="0" class="group relative w-full text-left outline-none">
								<div class="relative w-full overflow-hidden rounded-none shadow-lg">
									{#if movie.poster}
										<img
											src={movie.poster}
											alt={movie.title}
											class="aspect-[2/3] w-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-80"
										/>
									{:else}
										<div class="flex aspect-[2/3] w-full items-center justify-center bg-zinc-900 text-zinc-600 px-4">
											<span class="font-display text-sm font-bold uppercase">{movie.title}</span>
										</div>
									{/if}
									
									<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12 text-left transition-opacity duration-300 group-hover:opacity-0 z-20">
										<h4 class="font-sans font-bold text-white uppercase leading-tight line-clamp-2 drop-shadow-md">{movie.title}</h4>
									</div>

									<!-- Hover Overlay (AMC Style) -->
									<div class="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4 text-center z-30 pointer-events-none group-hover:pointer-events-auto">
										<div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
											<h3 class="text-xl md:text-2xl font-black text-white tracking-tight mb-2 leading-tight drop-shadow-md">{movie.title}</h3>
											
											<div class="flex items-center justify-center gap-3 text-zinc-300 text-[11px] md:text-xs font-semibold mb-2">
												<span class="tracking-widest">{movie.duration || '2 HR 15 MIN'}</span>
												<span class="w-px h-3 bg-zinc-500"></span>
												<span class="tracking-widest">{movie.rating || 'B'}</span>
											</div>
											
											<p class="text-zinc-400 text-[10px] md:text-xs font-medium mb-4 tracking-wider uppercase">
												Estreno {movie.releaseDate || '25 JUL 2026'}
											</p>
											
											<button class="w-full bg-zinc-200 hover:bg-white text-black font-bold py-2.5 rounded-full transition-colors text-sm shadow-xl">
												Comprar Entradas
											</button>
										</div>
									</div>
								</div>
							</div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				
				{#if canScroll}
					<div class="hidden md:flex absolute -left-12 -right-12 top-[40%] justify-between pointer-events-none">
						<div class="pointer-events-auto">
							<Carousel.Previous class="relative left-0 bg-white/5 backdrop-blur-md hover:bg-white hover:text-black text-white border-white/20 transition-all" />
						</div>
						<div class="pointer-events-auto">
							<Carousel.Next class="relative right-0 bg-white/5 backdrop-blur-md hover:bg-white hover:text-black text-white border-white/20 transition-all" />
						</div>
					</div>
				{/if}
			</Carousel.Root>
		</section>
	</div>
</div>
