<script lang="ts">
	import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import * as Carousel from '$lib/components/ui/carousel';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import Ticket from '@lucide/svelte/icons/ticket';
	import MoveHorizontal from '@lucide/svelte/icons/move-horizontal';
	import type { Movie } from '$lib/types';
	import AutoScroll from 'embla-carousel-auto-scroll';

	let { movies, openMovieDetails } = $props<{ movies: Movie[], openMovieDetails: (m: Movie) => void }>();

	let api = $state<CarouselAPI>();
	let scrollProgress = $state(0);
	let isDraggingScrollbar = $state(false);
	let scrollbarTrack = $state<HTMLElement | null>(null);
	let canScroll = $state(false);
	let isLoopReady = $state(false);
	let initialIdleTimeout: ReturnType<typeof setTimeout>;

	const plugin = AutoScroll({ speed: 0.8, stopOnInteraction: true, playOnInit: false });

	let safeMovies = $derived.by(() => {
		if (!movies || movies.length === 0) return [];
		if (movies.length <= 4) return movies; // Si caben en pantalla, no duplicamos
		// Embla carousel glitches with loop: true if there are too few items. 
		// We duplicate the array to ensure seamless infinite looping.
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

		// Truco para evitar el bug de solapamiento de Embla: 
		// activamos el loop en segundo plano después de que se dibujen las tarjetas
		let loopTimeout: ReturnType<typeof setTimeout>;
		if (movies && movies.length > 4) {
			loopTimeout = setTimeout(() => {
				if (api) {
					api.reInit({ loop: true });
				}
				isLoopReady = true;
			}, 800);
		} else {
			isLoopReady = true; // No necesitamos esperar si no hay loop
		}

		// AutoScroll ya inicia apagado gracias a playOnInit: false
		
		initialIdleTimeout = setTimeout(() => {
			if (api) {
				const autoScroll = api.plugins().autoScroll;
				if (autoScroll) {
					autoScroll.play();
				}
			}
		}, 90000); // 1 min 30 seg

		const handleInteraction = () => {
			// Si el usuario interactúa, detenemos el autoplay y cancelamos el inicio diferido
			if (api) {
				const autoScroll = api.plugins().autoScroll;
				if (autoScroll) {
					autoScroll.stop();
				}
			}
			clearTimeout(initialIdleTimeout);
		};

		api.on('pointerDown', handleInteraction);

		return () => {
			if (loopTimeout) clearTimeout(loopTimeout);
			clearTimeout(initialIdleTimeout);
			api?.off('scroll', onScroll);
			api?.off('reInit', onScroll);
			api?.off('reInit', checkScroll);
			api?.off('resize', checkScroll);
			api?.off('pointerDown', handleInteraction);
		};
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

<Carousel.Root class="w-full relative" opts={{ align: 'start', loop: false }} plugins={[plugin]} setApi={(a) => api = a}>
	<Carousel.Content class="-ml-4 py-4 {canScroll ? '' : 'justify-center'}">
		{#each safeMovies as movie, i (movie.id + '-' + i)}
			<Carousel.Item class="pl-4 basis-[55%] md:basis-[30%] lg:basis-[22%] xl:basis-[18%]">
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
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						role="button"
						tabindex="0"
						class="group relative flex w-full cursor-pointer flex-col text-center focus:outline-none animate-in fade-in duration-500"
						onclick={() => openMovieDetails(movie)}
					>
						<div class="relative w-full overflow-hidden rounded-none shadow-lg transition-all duration-300 group-hover:shadow-[0_8px_40px_rgb(255,255,255,0.15)]">
							{#if movie.label}
								<div class="absolute top-4 left-[-4px] z-20 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
									<div class="ticket-shape relative flex items-center justify-center py-1.5 px-4 
										{movie.label === 'PREVENTA' ? 'bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-400' : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500'}">
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
									
									<button class="w-full bg-zinc-200 hover:bg-white text-black font-bold py-2.5 rounded-full transition-colors text-sm shadow-xl" onclick={(e) => { e.stopPropagation(); openMovieDetails(movie); }}>
										Comprar Entradas
									</button>
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
