<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel';
	import type { Movie } from '$lib/types';


	let { movies, isPaused = false } = $props<{ movies: Movie[], isPaused?: boolean }>();
	
	import Autoplay from 'embla-carousel-autoplay';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
	
	let api = $state<CarouselAPI>();
	let canScroll = $state(false);

	const plugin = Autoplay({ delay: 3000, stopOnInteraction: true, playOnInit: false });

	let safeMovies = $derived.by(() => {
		if (!movies || movies.length === 0) return [];
		let arr = [...movies];
		while (arr.length < 12) {
			arr = [...arr, ...movies];
		}
		return arr;
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

		// Truco para inicializar loop de forma segura sin glitchear Embla
		let loopTimeout = setTimeout(() => {
			if (!api) return;
			try {
				api.plugins().autoplay?.stop();
				api.reInit({ loop: true });
			} catch (e) {
				void e;
			}
		}, 800);

		let resumeTimeout: ReturnType<typeof setTimeout>;

		const startAutoplay = () => {
			if (!api) return;
			try {
				api.plugins().autoplay?.play();
			} catch (e) {
				void e;
			}
		};

		const handleInteraction = () => {
			if (!api) return;
			try {
				api.plugins().autoplay?.stop();
			} catch (e) {
				void e;
			}
			clearTimeout(resumeTimeout);
			if (!isPaused) {
				resumeTimeout = setTimeout(startAutoplay, 40000);
			}
		};

		api.on('pointerDown', handleInteraction);
		if (!isPaused) {
			resumeTimeout = setTimeout(startAutoplay, 40000);
		}

		return () => {
			clearTimeout(loopTimeout);
			clearTimeout(resumeTimeout);
			api?.off('reInit', checkScroll);
			api?.off('resize', checkScroll);
			api?.off('pointerDown', handleInteraction);
		};
	});

	$effect(() => {
		if (!api) return;
		if (isPaused) {
			try { api.plugins().autoplay?.stop(); } catch (e) { void e; }
		} else {
			try { api.plugins().autoplay?.play(); } catch (e) { void e; }
		}
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
								<div role="button" tabindex="0" class="group relative w-full text-left outline-none animate-in fade-in duration-500">
									<!-- Dynamic Hover Glow from Poster -->
									{#if movie.poster}
										<div class="absolute -inset-6 z-0 opacity-0 transition-all duration-700 group-hover:opacity-100 pointer-events-none">
											<img src={movie.poster} alt="" class="w-full h-full object-cover blur-3xl opacity-70 scale-[1.5]" />
										</div>
									{/if}

									<div class="relative z-10 group-hover:z-50 w-full overflow-hidden rounded-lg border border-transparent group-hover:border-white/10 shadow-lg transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] bg-black">
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
										
										<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12 text-center transition-opacity duration-300 group-hover:opacity-0 z-20 flex flex-col items-center justify-end">
											<h4 class="font-sans font-bold text-white uppercase leading-tight line-clamp-2 drop-shadow-md text-center">{movie.title}</h4>
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
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				
				{#if canScroll}
					<div class="hidden md:flex absolute -left-12 -right-12 top-[40%] justify-between pointer-events-none z-40">
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
