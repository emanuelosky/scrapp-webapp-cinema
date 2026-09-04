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
	<div class="w-full border-b border-zinc-800 py-8 mt-12 mb-8">
		<div class="mx-auto max-w-7xl flex flex-col items-center justify-center px-4 md:px-8">
			<h2 class="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">Próximos Estrenos</h2>
			<p class="text-zinc-400 mt-2 text-lg">Pronto en nuestras salas</p>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-4 lg:px-12 mb-24">
		<section class="relative">
			<Carousel.Root plugins={[plugin]} opts={{ align: 'start', loop: false }} setApi={(a) => api = a} class="w-full">
				<div class="w-full">
					<Carousel.Content class="-ml-2 md:-ml-4 {canScroll ? '' : 'justify-center'} py-4">
						{#each safeMovies as movie, i (movie.id + '-' + i)}
							<Carousel.Item class="pl-2 md:pl-4 basis-[45%] sm:basis-[30%] md:basis-[22%] lg:basis-1/5 relative hover:z-50">
								<div role="button" tabindex="0" class="group relative w-full text-left outline-none animate-in fade-in duration-500">
									<!-- Dynamic Hover Glow from Poster -->
									{#if movie.poster}
										<div class="absolute -inset-2 z-[-1] opacity-0 transition-all duration-700 group-hover:opacity-20 pointer-events-none">
											<img src={movie.poster} alt="" class="w-full h-full object-cover blur-[20px] scale-105" />
										</div>
									{/if}

									<div 
										class="relative z-10 w-full overflow-hidden rounded-sm bg-zinc-900 cursor-pointer transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
									>
										{#if movie.poster}
											<img
												src={movie.poster}
												alt={movie.title}
												class="aspect-[2/3] w-full object-cover transition-all duration-500"
											/>
										{:else}
											<div class="flex aspect-[2/3] w-full items-center justify-center bg-zinc-900 text-zinc-600 px-4">
												<span class="font-display text-sm font-bold uppercase text-center">{movie.title}</span>
											</div>
										{/if}
									</div>

									<!-- Movie Info Below Poster -->
									<div class="mt-4 flex flex-col items-center text-center px-1">
										<h4 class="font-display text-sm md:text-base font-black text-white uppercase leading-tight line-clamp-2 tracking-wide">{movie.title}</h4>
										
										<div class="w-2/3 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent my-2"></div>
										
										<div class="flex flex-col items-center gap-1">
											<p class="text-zinc-400 text-[10px] md:text-xs font-medium uppercase tracking-widest">
												{movie.releaseDate ? `Estreno: ${movie.releaseDate}` : 'Pronto en Cines'}
											</p>
											{#if movie.duration}
												<p class="text-zinc-400 text-[9px] font-mono tracking-widest uppercase">
													{movie.duration}
												</p>
											{/if}
										</div>
									</div>
								</div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				</div>
				
				{#if canScroll}
					<!-- Gradient Edge Fades (replaces mask-image to preserve vertical bleeding) -->
					<div class="hidden md:block pointer-events-none absolute inset-y-0 left-0 w-12 lg:w-24 bg-gradient-to-r from-black to-transparent z-30"></div>
					<div class="hidden md:block pointer-events-none absolute inset-y-0 right-0 w-12 lg:w-24 bg-gradient-to-l from-black to-transparent z-30"></div>

					<div class="hidden md:flex absolute inset-y-0 left-4 right-4 lg:left-8 lg:right-8 justify-between pointer-events-none z-40">
						<!-- Lado Izquierdo (Previous) -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div 
							class="w-20 lg:w-24 h-full pointer-events-auto flex items-center justify-start group cursor-pointer pl-2 lg:pl-4"
							onclick={() => {
								api?.scrollPrev();
								api?.plugins().autoplay?.stop();
							}}
						>
							<div class="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:bg-white group-hover:text-black group-hover:scale-110 group-active:scale-95 -translate-x-2 group-hover:translate-x-0">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="size-6 lg:size-7"><path d="m15 18-6-6 6-6"/></svg>
							</div>
						</div>

						<!-- Lado Derecho (Next) -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div 
							class="w-20 lg:w-24 h-full pointer-events-auto flex items-center justify-end group cursor-pointer pr-2 lg:pr-4"
							onclick={() => {
								api?.scrollNext();
								api?.plugins().autoplay?.stop();
							}}
						>
							<div class="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:bg-white group-hover:text-black group-hover:scale-110 group-active:scale-95 translate-x-2 group-hover:translate-x-0">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="size-6 lg:size-7"><path d="m9 18 6-6-6-6"/></svg>
							</div>
						</div>
					</div>
				{/if}
			</Carousel.Root>
		</section>
	</div>
</div>
