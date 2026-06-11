<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel';
	import type { Movie } from '$lib/types';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let { movies } = $props<{ movies: Movie[] }>();
	
	import Autoplay from 'embla-carousel-autoplay';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
	
	let api = $state<CarouselAPI>();
	let canScroll = $state(false);
	let isLoopReady = $state(false);
	let resumeTimeout: ReturnType<typeof setTimeout>;

	const plugin = Autoplay({ delay: 3000, stopOnInteraction: true });

	let safeMovies = $derived.by(() => {
		if (!movies || movies.length === 0) return [];
		if (movies.length <= 4) return movies; // Si caben en pantalla, no duplicamos
		if (movies.length < 8) {
			return [...movies, ...movies];
		}
		return movies;
	});

	$effect(() => {
		if (!api) return;
		const checkScroll = () => {
			if (!api) return;
			canScroll = api.canScrollNext() || api.canScrollPrev();
		};
		api.on('reInit', checkScroll);
		api.on('resize', checkScroll);
		checkScroll();
		
		let loopTimeout: ReturnType<typeof setTimeout>;
		if (movies && movies.length > 4) {
			loopTimeout = setTimeout(() => {
				if (api) {
					api.reInit({ loop: true });
				}
				isLoopReady = true;
			}, 800);
		} else {
			isLoopReady = true;
		}

		const handleInteraction = () => {
			if (api) {
				const autoplay = api.plugins().autoplay;
				if (autoplay) {
					autoplay.stop();
				}
			}
			clearTimeout(resumeTimeout);
			resumeTimeout = setTimeout(() => {
				if (api) {
					const autoplay = api.plugins().autoplay;
					if (autoplay) {
						autoplay.play();
					}
				}
			}, 90000); // 1 min 30 seg
		};

		api.on('pointerDown', handleInteraction);

		return () => {
			if (loopTimeout) clearTimeout(loopTimeout);
			clearTimeout(resumeTimeout);
			api?.off('reInit', checkScroll);
			api?.off('resize', checkScroll);
			api?.off('pointerDown', handleInteraction);
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
			<Carousel.Root plugins={[plugin]} opts={{ align: 'start', loop: false }} setApi={(a) => api = a} class="w-full">
				<Carousel.Content class="-ml-2 md:-ml-4 {canScroll ? '' : 'justify-center'}">
					{#each safeMovies as movie, i (movie.id + '-' + i)}
						<Carousel.Item class="pl-2 md:pl-4 basis-[45%] sm:basis-[30%] md:basis-[22%] lg:basis-1/5">
							{#if !isLoopReady}
								<div class="relative w-full aspect-[2/3] overflow-hidden bg-black">
									{#if movie.poster}
										<img
											src={movie.poster}
											alt=""
											class="w-full h-full object-cover blur-sm scale-110 opacity-60 animate-pulse"
										/>
									{:else}
										<Skeleton class="w-full h-full rounded-none bg-zinc-800 animate-pulse" />
									{/if}
								</div>
							{:else}
								<div role="button" tabindex="0" class="group relative w-full text-left outline-none animate-in fade-in duration-500">
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
												<!-- En próximos estrenos ocultamos la duración, la clasificación y el botón de compra -->
												<p class="text-zinc-400 text-xs md:text-sm font-bold mb-4 tracking-widest uppercase">
													Estreno: {movie.releaseDate || 'Próximamente'}
												</p>
											</div>
										</div>
									</div>
								</div>
							{/if}
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
