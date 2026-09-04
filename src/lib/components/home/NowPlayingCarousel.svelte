<script lang="ts">
	import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import * as Carousel from '$lib/components/ui/carousel';

	import Ticket from '@lucide/svelte/icons/ticket';
	import MoveHorizontal from '@lucide/svelte/icons/move-horizontal';
	import type { Movie } from '$lib/types';
	import AutoScroll from 'embla-carousel-auto-scroll';

	let { movies, openMovieDetails, isPaused = false } = $props<{ movies: Movie[], openMovieDetails: (m: Movie) => void, isPaused?: boolean }>();

	let api = $state<CarouselAPI>();
	let scrollProgress = $state(0);
	let isDraggingScrollbar = $state(false);
	let scrollbarTrack = $state<HTMLElement | null>(null);
	let canScroll = $state(false);

	const plugin = AutoScroll({ speed: 0.4, stopOnInteraction: true, playOnInit: false });

	let safeMovies = $derived.by(() => {
		if (movies.length === 0) return [];
		if (movies.length < 6) return [...movies];

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
		
		const onScroll = () => {
			if (!api) return;
			let rawProg = api.scrollProgress();
			let prog = ((rawProg % 1) + 1) % 1;
			scrollProgress = prog * 100;
		};
		
		api.on('scroll', onScroll);
		api.on('reInit', onScroll);
		api.on('reInit', checkScroll);
		api.on('resize', checkScroll);
		
		onScroll(); // Set initial
		checkScroll();

		let loopTimeout: ReturnType<typeof setTimeout>;
		
		// Solo activar el loop infinito y auto-scroll si hay suficientes películas para llenar la pantalla
		if (movies.length >= 6) {
			loopTimeout = setTimeout(() => {
				if (!api) return;
				try {
					api.plugins().autoScroll?.stop();
					api.reInit({ loop: true });
				} catch (e) {
					void e;
				}
			}, 800);
		} else {
			// Si son menos de 5, desactivamos el auto scroll para evitar problemas visuales
			try {
				api.plugins().autoScroll?.stop();
			} catch (e) { void e; }
		}

		let resumeTimeout: ReturnType<typeof setTimeout>;

		const startAutoScroll = () => {
			if (!api) return;
			try {
				api.plugins().autoScroll?.play();
			} catch (e) {
				void e;
			}
		};

		const handleInteraction = () => {
			if (!api) return;
			try {
				api.plugins().autoScroll?.stop();
			} catch (e) {
				void e;
			}
			clearTimeout(resumeTimeout);
			if (!isPaused) {
				resumeTimeout = setTimeout(startAutoScroll, 40000); // 40 segs para reiniciar auto-scroll tras interactuar
			}
		};

		api.on('pointerDown', handleInteraction);
		// Inicio diferido de 40 segundos al cargar la página
		if (!isPaused) {
			resumeTimeout = setTimeout(startAutoScroll, 40000);
		}

		return () => {
			clearTimeout(loopTimeout);
			clearTimeout(resumeTimeout);
			api?.off('scroll', onScroll);
			api?.off('reInit', onScroll);
			api?.off('reInit', checkScroll);
			api?.off('resize', checkScroll);
			api?.off('pointerDown', handleInteraction);
		};
	});

	$effect(() => {
		if (!api) return;
		if (isPaused) {
			try { api.plugins().autoScroll?.stop(); } catch (e) { void e; }
		} else {
			try { api.plugins().autoScroll?.play(); } catch (e) { void e; }
		}
	});

	function onPointerDown(e: PointerEvent) {
		if (!api || !scrollbarTrack) return;
		isDraggingScrollbar = true;
		scrollbarTrack.setPointerCapture(e.pointerId);
		updateScrollFromEvent(e);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDraggingScrollbar || !api || !scrollbarTrack) return;
		updateScrollFromEvent(e);
	}

	function onPointerUp(e: PointerEvent) {
		if (!isDraggingScrollbar || !scrollbarTrack) return;
		isDraggingScrollbar = false;
		scrollbarTrack.releasePointerCapture(e.pointerId);
	}

	function updateScrollFromEvent(e: PointerEvent) {
		if (!scrollbarTrack || !api) return;
		const rect = scrollbarTrack.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percent = x / rect.width;
		
		const snaps = api.scrollSnapList();
		const targetIndex = Math.round(percent * (snaps.length - 1));
		api.scrollTo(targetIndex, false);
	}
</script>

{#if movies && movies.length > 0}
	<Carousel.Root class="w-full relative" opts={{ align: 'start', loop: true }} plugins={[plugin]} setApi={(a) => api = a}>
		<Carousel.Content class="-ml-4 py-4 {canScroll ? '' : 'justify-center'}">
			{#each safeMovies as movie, i (movie.id + '-' + i)}
				<Carousel.Item class="pl-4 basis-[55%] md:basis-[30%] lg:basis-[22%] xl:basis-[18%] relative hover:z-50">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							role="button"
							tabindex="0"
							class="group relative flex w-full cursor-pointer flex-col text-center focus:outline-none animate-in fade-in duration-500"
							onclick={() => openMovieDetails(movie)}
						>
							<!-- Dynamic Hover Glow from Poster -->
							{#if movie.poster}
								<div class="absolute -inset-4 z-[-1] opacity-0 transition-all duration-700 group-hover:opacity-30 pointer-events-none">
									<img src={movie.poster} alt="" class="w-full h-full object-cover blur-[30px] scale-[1.15]" />
								</div>
							{/if}

							<div 
								class="relative z-10 w-full overflow-hidden rounded-none bg-black group cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transform-gpu will-change-transform"
							>
								{#if movie.label}
									<div class="absolute top-4 left-[-4px] z-20 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
										<div class="ticket-shape relative flex items-center justify-center py-1.5 px-4 
											{movie.label === 'PREVENTA' ? 'bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-400' : 'bg-gradient-to-r from-champagne-400 via-champagne-500 to-champagne-500'}">
											<div class="absolute left-2.5 top-1 bottom-1 border-l-[1.5px] border-dashed border-black/30"></div>
											<div class="absolute right-2.5 top-1 bottom-1 border-r-[1.5px] border-dashed border-black/30"></div>
											
											<Ticket class="size-3.5 mr-1.5 text-black ml-1 opacity-90" />
											<span class="text-[10px] md:text-xs font-black text-black uppercase tracking-widest mr-1">
												{movie.label}
											</span>
										</div>
									</div>
								{/if}
								
								{#if movie.poster}
									<img
										src={movie.poster}
										alt={movie.title}
										class="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
									/>
								{:else}
									<div class="flex aspect-[2/3] w-full items-center justify-center bg-zinc-900 text-zinc-600 px-4">
										<span class="font-display text-sm font-bold uppercase">{movie.title}</span>
									</div>
								{/if}

								<!-- Anti-aliasing edge bleed fix -->
								<div class="absolute inset-0 border border-black/80 z-20 pointer-events-none"></div>
							</div>

							<!-- Movie Info Below Poster -->
							<div class="mt-3 flex flex-col items-center text-center px-1">
								<h4 class="font-display text-base md:text-lg font-black text-white uppercase leading-tight line-clamp-2 tracking-wide">{movie.title}</h4>
								
								<div class="w-2/3 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent my-1.5"></div>
								
								<div class="flex items-center justify-center gap-2 text-zinc-400 text-[10px] md:text-xs font-semibold mb-2">
									<span class="tracking-widest">{movie.duration || '2 HR 15 MIN'}</span>
									<span class="w-px h-2.5 bg-zinc-600"></span>
									<span class="tracking-widest">{movie.rating || 'B'}</span>
								</div>
								
								<button class="w-full max-w-[180px] bg-zinc-200 hover:bg-white text-black font-bold py-2 rounded-full transition-colors text-[10px] md:text-xs shadow-xl uppercase tracking-wider" onclick={(e) => { e.stopPropagation(); openMovieDetails(movie); }}>
									Comprar Boletos
								</button>
							</div>
						</div>
				</Carousel.Item>
			{/each}
		</Carousel.Content>
		
		{#if canScroll}
			<!-- Gradient Edge Fades (replaces mask-image to preserve vertical bleeding) -->
			<div class="hidden md:block pointer-events-none absolute -inset-y-32 -left-8 w-24 lg:w-40 bg-gradient-to-r from-black via-black/80 to-transparent z-40"></div>
			<div class="hidden md:block pointer-events-none absolute -inset-y-32 -right-8 w-24 lg:w-40 bg-gradient-to-l from-black via-black/80 to-transparent z-40"></div>

			<!-- Controles de navegación laterales flotantes -->
			<div class="hidden md:flex absolute inset-y-0 left-4 right-4 lg:left-8 lg:right-8 justify-between pointer-events-none z-40">
				<!-- Lado Izquierdo (Previous) -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div 
					class="w-20 lg:w-24 h-full pointer-events-auto flex items-center justify-start group cursor-pointer pl-2 lg:pl-4"
					onclick={() => {
						api?.scrollPrev();
						api?.plugins().autoScroll?.stop(); // Pausar auto-scroll si el usuario interactúa
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
						api?.plugins().autoScroll?.stop();
					}}
				>
					<div class="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:bg-white group-hover:text-black group-hover:scale-110 group-active:scale-95 translate-x-2 group-hover:translate-x-0">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="size-6 lg:size-7"><path d="m9 18 6-6-6-6"/></svg>
					</div>
				</div>
			</div>
		{/if}
	</Carousel.Root>

	{#if canScroll}
		<div class="mt-8 md:mt-12 w-full flex flex-col items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both">
			<div class="flex items-center gap-2 text-zinc-500 uppercase tracking-widest text-[10px] md:text-xs font-bold">
				<MoveHorizontal class="size-4 animate-pulse" />
				<span>Desliza para explorar</span>
			</div>
			
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div 
				bind:this={scrollbarTrack}
				onpointerdown={onPointerDown}
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
				onpointercancel={onPointerUp}
				class="w-full max-w-sm md:max-w-2xl h-2 bg-zinc-800 rounded-full relative cursor-grab touch-none {isDraggingScrollbar ? 'cursor-grabbing' : ''}"
			>
				<div 
					class="absolute top-0 bottom-0 w-[20%] bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300 rounded-full transition-transform duration-75 ease-out origin-center {isDraggingScrollbar ? 'scale-y-[2.5] scale-x-105 shadow-[0_0_15px_rgba(212,212,216,0.8)]' : ''}" 
					style="transform: translate3d({scrollProgress * 4}%, 0, 0)"
				></div>
			</div>
		</div>
	{/if}

{/if}

<style>
	.ticket-shape {
		-webkit-mask-image: 
			radial-gradient(circle at 0% 50%, transparent 4px, black 4.5px), 
			radial-gradient(circle at 100% 50%, transparent 4px, black 4.5px);
		-webkit-mask-size: 51% 100%;
		-webkit-mask-position: left, right;
		-webkit-mask-repeat: no-repeat;
		mask-image: 
			radial-gradient(circle at 0% 50%, transparent 4px, black 4.5px), 
			radial-gradient(circle at 100% 50%, transparent 4px, black 4.5px);
		mask-size: 51% 100%;
		mask-position: left, right;
		mask-repeat: no-repeat;
	}
</style>
