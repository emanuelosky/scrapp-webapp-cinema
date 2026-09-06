<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Button } from '$lib/components/ui/button';
	import Heart from '@lucide/svelte/icons/heart';
	import Star from '@lucide/svelte/icons/star';
	import X from '@lucide/svelte/icons/x';
	import Play from '@lucide/svelte/icons/play';
	import Pause from '@lucide/svelte/icons/pause';
	import Maximize from '@lucide/svelte/icons/maximize';
	import Minimize from '@lucide/svelte/icons/minimize';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import SkipForward from '@lucide/svelte/icons/skip-forward';
	import type { Movie } from '$lib/types';

	let {
		open = $bindable(false),
		movie,
		isMuted = $bindable(true),
		volume = $bindable(70),
		hasAudio = false,
		onSelectMovie,
		onNext
	}: {
		open?: boolean;
		movie: Movie | null;
		isMuted?: boolean;
		volume?: number;
		hasAudio?: boolean;
		onSelectMovie?: () => void;
		onNext?: () => void;
	} = $props();

	// === Storage Logic ===
	function storageKey(kind: 'liked' | 'rating' | 'review', movieId: string | number) {
		return `cinepic:trailer:${kind}:${movieId}`;
	}

	function readLocal<T>(key: string, fallback: T): T {
		try {
			const raw = localStorage.getItem(key);
			return raw === null ? fallback : (JSON.parse(raw) as T);
		} catch {
			return fallback;
		}
	}
	function writeLocal(key: string, value: unknown) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch {
			// ignore
		}
	}

	let liked = $state(false);
	let rating = $state(0);
	let hoverRating = $state(0);
	let reviewDraft = $state('');
	let savedReview = $state<string | null>(null);
	let justSaved = $state(false);

	// Texto propio y genérico -- nada de diálogo citado de otras películas
	// (evita usar líneas con derechos de otros estudios sin licencia).
	const QUOTES = ['¿Listo para vivirlo en la pantalla grande?', '¿Qué esperas para asegurar tu boleto?'];
	let endQuote = $state('');

	let hasShowtimes = $derived(
		(movie?.showtimes && movie.showtimes.length > 0) || 
		(movie?.showtimesByDate && Object.keys(movie.showtimesByDate).length > 0)
	);

	$effect(() => {
		if (movie?.id) {
			const id = movie.id;
			liked = readLocal(storageKey('liked', id), false);
			rating = readLocal(storageKey('rating', id), 0);
			savedReview = readLocal(storageKey('review', id), null);
			reviewDraft = savedReview ?? '';
			justSaved = false;
		}
	});

	function toggleLike() {
		if (!movie) return;
		liked = !liked;
		writeLocal(storageKey('liked', movie.id), liked);
	}

	function setRating(value: number) {
		if (!movie) return;
		rating = value;
		writeLocal(storageKey('rating', movie.id), rating);
	}

	function submitReview() {
		if (!movie) return;
		const text = reviewDraft.trim();
		if (!text) return;
		savedReview = text;
		writeLocal(storageKey('review', movie.id), text);
		justSaved = true;
		setTimeout(() => (justSaved = false), 2000);
	}

	// === Video Player Logic ===
	let videoEl = $state<HTMLVideoElement | null>(null);
	let videoContainer = $state<HTMLDivElement | null>(null);
	let isPlaying = $state(false);
	let isFullscreen = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let bufferedEnd = $state(0);
	let showControls = $state(true);
	let controlsTimeout: ReturnType<typeof setTimeout>;
	let isEnded = $state(false);
	let rafId: number;

	function loopRAF() {
		if (videoEl && !videoEl.paused) {
			currentTime = videoEl.currentTime;
			if (videoEl.buffered.length > 0) {
				bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1);
			}
			rafId = requestAnimationFrame(loopRAF);
		}
	}

	function formatTime(t: number): string {
		if (!isFinite(t) || t < 0) return '00:00';
		const m = Math.floor(t / 60);
		const s = Math.floor(t % 60);
		return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}

	function togglePlay() {
		if (isEnded) {
			isEnded = false;
			currentTime = 0;
			videoEl?.play();
			return;
		}
		if (videoEl) {
			if (videoEl.paused) videoEl.play();
			else videoEl.pause();
		}
	}

	function handleSeek(e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value);
		if (videoEl) videoEl.currentTime = val;
	}

	function toggleMute() {
		isMuted = !isMuted;
	}

	function handleVolume(e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value);
		volume = val;
		if (val > 0) isMuted = false;
	}

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			videoContainer?.requestFullscreen().catch(() => {});
		} else {
			document.exitFullscreen().catch(() => {});
		}
	}

	$effect(() => {
		const onFullscreenChange = () => {
			isFullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', onFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
	});

	$effect(() => {
		if (videoEl) videoEl.volume = volume / 100;
	});

	$effect(() => {
		if (videoEl) videoEl.muted = isMuted;
	});

	// Reset al abrir
	$effect(() => {
		if (open) {
			isEnded = false;
			currentTime = 0;
			bufferedEnd = 0;
			showControls = true;
			if (videoEl) videoEl.play().catch(() => {});
		} else {
			if (videoEl) videoEl.pause();
			cancelAnimationFrame(rafId);
		}
	});

	function resetControlsTimeout() {
		showControls = true;
		clearTimeout(controlsTimeout);
		if (isPlaying && !isEnded) {
			controlsTimeout = setTimeout(() => {
				showControls = false;
			}, 2500);
		}
	}
</script>

<!-- Event listeners globales para mover el mouse -->
<svelte:window onmousemove={resetControlsTimeout} onkeydown={resetControlsTimeout} />

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="bg-black/95 backdrop-blur-xl" />
		<Dialog.Content showCloseButton={false} class="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl w-[95vw] bg-black border-none text-white p-0 overflow-hidden rounded-none shadow-2xl gap-0 flex flex-col h-[90vh]">
			{#if movie && open}
				
				<!-- TOP: Custom Video Player -->
				<div 
					bind:this={videoContainer}
					class="w-full shrink-0 bg-black relative flex flex-col group overflow-hidden"
					onmouseleave={() => isPlaying && !isEnded ? showControls = false : null}
					onmouseenter={resetControlsTimeout}
					role="application"
				>
					<!-- Botón X (Cerrar) - Mate y Discreto -->
					<Dialog.Close class="absolute top-4 right-4 z-50 flex size-9 items-center justify-center rounded-full bg-zinc-900/60 text-zinc-400 border border-zinc-800/50 backdrop-blur-md transition-all hover:bg-zinc-800 hover:text-white hover:scale-105 active:scale-95 {showControls || !isPlaying ? 'opacity-100' : 'opacity-0'} duration-300" aria-label="Cerrar modal">
						<X class="size-4" />
					</Dialog.Close>

					<!-- svelte-ignore a11y_media_has_caption -->
					<video
						bind:this={videoEl}
						src={movie.trailerAssetUrl}
						class="w-full aspect-video object-contain bg-black cursor-pointer"
						autoplay
						playsinline
						onclick={togglePlay}
						onplay={() => { isPlaying = true; isEnded = false; resetControlsTimeout(); rafId = requestAnimationFrame(loopRAF); }}
						onpause={() => { isPlaying = false; showControls = true; cancelAnimationFrame(rafId); }}
						ontimeupdate={() => {
							if (!isPlaying) currentTime = videoEl?.currentTime || 0;
						}}
						onprogress={() => {
							if (videoEl && videoEl.buffered.length > 0) {
								bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1);
							}
						}}
						ondurationchange={() => duration = videoEl?.duration || 0}
						onended={() => { 
							isEnded = true; 
							isPlaying = false; 
							showControls = true; 
							cancelAnimationFrame(rafId); 
							endQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
						}}
					></video>

					<!-- Overlay de "Video Terminado" -->
					{#if isEnded}
						<div 
							class="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-8 z-40 animate-in fade-in duration-300"
							style="mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent); -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);"
						>
							<h3 class="font-display text-xl md:text-2xl uppercase font-black tracking-widest text-white text-center px-4 leading-relaxed max-w-2xl">{endQuote}</h3>
							<div class="flex items-center gap-6">
								<button onclick={togglePlay} class="flex size-14 items-center justify-center rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-md transition-all hover:bg-white hover:border-white hover:text-black hover:scale-105 active:scale-95 shadow-xl" aria-label="Ver de nuevo">
									<RotateCcw class="size-6" />
								</button>

								{#if hasShowtimes}
									<Button onclick={() => { open = false; onSelectMovie?.(); }} variant="default" class="bg-white/10 text-white border border-white/20 backdrop-blur-md h-14 px-8 rounded-full font-bold text-sm tracking-wide shadow-xl transition-all hover:bg-white hover:border-white hover:text-black hover:scale-105 active:scale-95">
										Comprar Boletos
									</Button>
								{/if}

								<button onclick={() => { open = false; onNext?.(); }} class="flex size-14 items-center justify-center rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-md transition-all hover:bg-white hover:border-white hover:text-black hover:scale-105 active:scale-95 shadow-xl" aria-label="Siguiente Tráiler">
									<SkipForward class="size-6" />
								</button>
							</div>
						</div>
					{/if}

					<!-- Controles Superpuestos -->
					<div 
						class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-16 pb-3 px-4 md:px-6 z-30 transition-opacity duration-300 {showControls && !isEnded ? 'opacity-100' : 'opacity-0 pointer-events-none'}"
					>
						<!-- Barra de Progreso (Input Range Nativo) -->
						<div class="flex items-center group/progress cursor-pointer h-4 mb-1 relative">
							<!-- Track Base -->
							<div class="absolute inset-x-0 h-1 bg-zinc-800/80 rounded-full pointer-events-none group-hover/progress:h-1.5 transition-all"></div>
							
							<!-- Buffer Bar -->
							<div class="absolute left-0 h-1 bg-zinc-600/60 rounded-full pointer-events-none group-hover/progress:h-1.5 transition-all" style="width: {(bufferedEnd / (duration || 1)) * 100}%"></div>

							<!-- Played Bar -->
							<div class="absolute left-0 h-1 bg-zinc-400 rounded-full pointer-events-none group-hover/progress:h-1.5 transition-all" style="width: {(currentTime / (duration || 1)) * 100}%"></div>

							<!-- Seeker (solo para interacción y thumb) -->
							<input 
								type="range" 
								min="0" 
								max={duration || 1}
								step="0.01"
								value={currentTime}
								oninput={handleSeek}
								class="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer m-0 p-0"
							/>
							<!-- Thumb visible (dibujado manualmente para coincidir con la barra) -->
							<div 
								class="absolute h-3 w-3 bg-white rounded-full pointer-events-none shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity z-10 -ml-1.5" 
								style="left: {(currentTime / (duration || 1)) * 100}%"
							></div>
						</div>

						<div class="flex items-center justify-between mt-2">
							<div class="flex items-center gap-4">
								<button onclick={togglePlay} class="text-white hover:text-silverplate-300 hover:scale-110 active:scale-95 transition-all">
									{#if isPlaying}
										<Pause class="size-5 md:size-6 fill-current" />
									{:else}
										<Play class="size-5 md:size-6 fill-current" />
									{/if}
								</button>
								{#if hasAudio}
									<button onclick={toggleMute} class="text-white hover:text-silverplate-300 hover:scale-110 active:scale-95 transition-all hidden sm:block">
										{#if isMuted}
											<VolumeX class="size-5" />
										{:else}
											<Volume2 class="size-5" />
										{/if}
									</button>
									<!-- Control de Volumen Horizontal -->
									<input
										type="range"
										min="0" max="100"
										value={isMuted ? 0 : volume}
										oninput={handleVolume}
										class="w-20 h-1 bg-zinc-800/80 rounded-full appearance-none cursor-pointer accent-white hover:accent-silverplate-400 transition-all hidden sm:block"
										style="background: linear-gradient(to right, #fff {(isMuted ? 0 : volume)}%, rgba(39,39,42,0.8) {(isMuted ? 0 : volume)}%);"
									/>
								{/if}
								<span class="text-[13px] font-semibold text-zinc-300 tabular-nums ml-2">
									{formatTime(currentTime)} <span class="text-zinc-600 mx-1">/</span> {formatTime(duration)}
								</span>
							</div>
							
							<div class="flex items-center gap-4">
								<button onclick={toggleFullscreen} class="text-white hover:text-silverplate-300 hover:scale-110 active:scale-95 transition-all">
									{#if isFullscreen}
										<Minimize class="size-5" />
									{:else}
										<Maximize class="size-5" />
									{/if}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- BOTTOM: Metadata and Social -->
				<ScrollArea class="trailer-scroll-area flex-1 w-full min-h-0 bg-black">
					<div class="relative z-20 flex flex-col p-6 md:p-8 lg:px-10 gap-8 max-w-5xl mx-auto w-full">
						
						<!-- Cabecera: Título y Métricas Simétricas -->
						<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-900 pb-6">
							
							<!-- Izquierda: Título y Badges -->
							<div class="flex flex-col gap-2 flex-1">
								<Dialog.Title class="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-none">
									{movie.title}
								</Dialog.Title>
								
								<div class="flex flex-wrap items-center gap-2 mt-1">
									{#if movie.label}
										<span class="bg-zinc-200 text-black text-[10px] font-black px-2 py-1 uppercase tracking-widest">{movie.label}</span>
									{/if}
									{#if movie.rating}
										<span class="text-[11px] font-bold text-zinc-400 border border-zinc-700 px-2 py-0.5">{movie.rating}</span>
									{/if}
									{#if movie.duration}
										<span class="text-[11px] font-bold text-zinc-400 bg-zinc-900/50 px-2 py-0.5">{movie.duration}</span>
									{/if}
									{#if movie.formats?.video}
										<span class="text-[11px] font-bold text-zinc-400 border border-zinc-700 px-2 py-0.5">{movie.formats.video}</span>
									{/if}
									{#if movie.formats?.audio}
										<span class="text-[11px] font-bold text-zinc-400 border border-zinc-700 px-2 py-0.5">{movie.formats.audio}</span>
									{/if}
								</div>
							</div>

							<!-- Derecha: Corazón -->
							<div class="flex items-center gap-4 shrink-0">
								<!-- Nota: aquí vivían métricas de TMDB/Rotten Tomatoes con números
								     fijos (8.5/10, 92%) iguales para cualquier película -- se
								     quitaron por ser datos inventados presentados como reales,
								     atribuidos a marcas de terceros. Si se quiere mostrar esto de
								     verdad, hace falta traer el dato real (TMDB sí expone su
								     rating por película vía su API; Rotten Tomatoes no tiene una
								     pública) en vez de un número fijo. -->
								<button
									type="button"
									onclick={toggleLike}
									class="flex size-11 shrink-0 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-900/80 text-white transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
									aria-label={liked ? 'Quitar de favoritos' : 'Me gusta'}
									aria-pressed={liked}
								>
									<Heart class="size-5 {liked ? 'fill-red-500 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : ''}" />
								</button>
							</div>
						</div>

						<!-- Contenido Principal: 2 Columnas -->
						<div class="grid md:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 w-full relative">
							
							<!-- Separador difuminado vertical (solo Desktop) -->
							<div class="hidden md:block absolute left-[54.5%] top-0 bottom-0 w-px bg-gradient-to-b from-zinc-800 via-zinc-800/50 to-transparent"></div>

							<!-- Columna Izquierda: Sinopsis -->
							<div class="flex flex-col gap-3">
								<h4 class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sinopsis</h4>
								{#if movie.synopsis}
									<div class="text-zinc-300 text-sm md:text-[15px] leading-relaxed font-medium">
										{movie.synopsis}
									</div>
								{:else}
									<p class="text-zinc-600 text-sm italic">Sinopsis no disponible.</p>
								{/if}
							</div>

							<!-- Columna Derecha: Interacción -->
							<div class="flex flex-col gap-6">
								<!-- Dar Estrellas -->
								<div class="flex flex-col gap-2">
									<h4 class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tu Calificación</h4>
									<div class="flex items-center gap-1" role="radiogroup" aria-label="Calificar">
										{#each [1, 2, 3, 4, 5] as value (value)}
											<button
												type="button"
												onclick={() => setRating(value)}
												onmouseenter={() => (hoverRating = value)}
												onmouseleave={() => (hoverRating = 0)}
												class="p-1 text-zinc-700 transition-colors hover:text-silverplate-400 focus:outline-none"
												aria-label={`Calificar con ${value} de 5 estrellas`}
												aria-pressed={rating >= value}
											>
												<Star class="size-6 {(hoverRating || rating) >= value ? 'fill-silverplate-300 text-silverplate-300 drop-shadow-[0_0_8px_rgba(224,224,224,0.3)]' : ''}" />
											</button>
										{/each}
									</div>
								</div>

								<!-- Cajón de Comentarios -->
								<div class="flex flex-col gap-3">
									<h4 class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Añadir Comentario</h4>
									<textarea
										bind:value={reviewDraft}
										rows={3}
										maxlength={280}
										placeholder="¿Qué te pareció este tráiler?"
										class="w-full resize-none border border-zinc-800/60 bg-zinc-900/30 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-silverplate-500/50 focus:bg-zinc-900 focus:outline-none transition-colors rounded-lg"
									></textarea>
									<div class="flex items-center justify-between">
										<span class="text-[11px] font-medium text-zinc-500">
											{#if justSaved}
												<span class="text-silverplate-400 font-bold">¡Publicado!</span>
											{:else if savedReview}
												<span class="text-zinc-400">Ya publicaste una opinión</span>
											{/if}
										</span>
										<Button
											onclick={submitReview}
											disabled={!reviewDraft.trim()}
											class="rounded-md border border-zinc-700 bg-zinc-800 hover:bg-silverplate-300 hover:text-black hover:border-transparent h-8 px-5 text-[11px] font-bold transition-all disabled:opacity-40"
										>
											Publicar
										</Button>
									</div>
								</div>
							</div>
						</div>

					</div>
				</ScrollArea>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	/* Visibilidad constante del scrollbar en el modal */
	:global(.trailer-scroll-area [data-slot="scroll-area-thumb"]) {
		background-color: #52525b; /* zinc-600 */
		border-radius: 9999px;
	}
	:global(.trailer-scroll-area [data-slot="scroll-area-thumb"]:hover) {
		background-color: #a1a1aa; /* zinc-400 */
	}

	/* Nota: el <input type="range"> de la barra de progreso ya vive dentro
	   de un contenedor con opacity-0 permanente (el "thumb" visible real es
	   el div dibujado a mano al lado) -- no hace falta (ni tiene efecto)
	   ninguna regla de opacidad sobre su ::-webkit-slider-thumb/::-moz-range-thumb
	   aquí, así que se quitaron por ser CSS muerto. */
</style>
