<script module lang="ts">
	/** Dónde queda el banner de la tarjeta enfocada, para que el contador
	 * gigante de CarteleraChapters se ancle a su esquina inferior. */
	export type ChapterFocusGeo = {
		/** Lado del banner (las tarjetas alternan). */
		side: 'left' | 'right';
		/** Borde inferior de la columna de medios, en px desde el tope de la
		 * tarjeta (medida de layout, inmune a los transforms del descarte).
		 * null en móvil, donde no hay contador gigante. */
		mediaBottom: number | null;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { animate, onScroll, svg, utils } from 'animejs';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteMap } from 'svelte/reactivity';
	import Play from '@lucide/svelte/icons/play';
	import Pause from '@lucide/svelte/icons/pause';
	import Info from '@lucide/svelte/icons/info';
	import { bookingState } from '$lib/state/booking.svelte';
	import TrailerBackground from '$lib/components/home/TrailerBackground.svelte';
	import { PEEK, MOBILE_QUERY } from './carteleraLayout';
	import { blurSource, imageThumb } from '$lib/utils/images';
	import ProgressiveImage from '$lib/components/ui/ProgressiveImage.svelte';
	import type { Movie, ShowtimeDetails } from '$lib/types';

	// Cada película es un "slide": al bajar, esta tarjeta se descarta (se
	// achica, se atenúa y sube fuera de vista) mientras la siguiente aparece
	// desde abajo -- ligado 1:1 a la posición real de scroll, no a un timeline
	// aparte, así el gesto del usuario siempre manda.
	//
	// Dos ramas de marcado, UNA sola viva en el DOM (decidida en JS, no con
	// clases hidden: una rama con display:none seguiría montada y podría
	// cargar imágenes o clip a escondidas):
	//   - Escritorio/tablet: banner a un lado, ficha al otro; el tráiler solo
	//     con clic (lightbox). Ningún <video> montado.
	//   - Móvil (< sm, mismo corte que el home): zona hero con el medio de
	//     fondo y la data encima, como NetworkHeroMobile. Solo la tarjeta
	//     ENFOCADA monta TrailerBackground (clip ambiental); al perder el foco
	//     se desmonta -- un único clip vivo en toda la página.
	let {
		movie,
		index,
		total,
		sede,
		selectedDateStr,
		onPlayTrailer,
		onMoreInfo,
		onFocus,
		headerHeight = 0,
		ambientPaused = false
	}: {
		movie: Movie;
		index: number;
		/** Cuántas películas hay en la lista -- para el contador "N°01 / 12". */
		total: number;
		sede?: string;
		selectedDateStr?: string;
		onPlayTrailer: (movie: Movie) => void;
		onMoreInfo: (movie: Movie) => void;
		/** Avisa cuando esta tarjeta pasa a ser la enfocada (la que ocupa la
		 * zona de reposo) -- CarteleraChapters mueve el contador gigante a la
		 * esquina de su banner. */
		onFocus?: (index: number, geo: ChapterFocusGeo) => void;
		/** Alto real (px) del grupo sticky de la página: define la "línea de
		 * reposo" bajo la que asienta cada tarjeta. Medido, no adivinado. */
		headerHeight?: number;
		/** Pausa el clip ambiental móvil mientras un diálogo tapa la página. */
		ambientPaused?: boolean;
	} = $props();

	let isMobile = $state(false);
	$effect.pre(() => {
		const mq = window.matchMedia(MOBILE_QUERY);
		const update = () => (isMobile = mq.matches);
		update();
		mq.addEventListener('change', update);
		return () => mq.removeEventListener('change', update);
	});

	let reversed = $derived(index % 2 === 1);
	let chapterEl = $state<HTMLElement | null>(null);
	let stageEl = $state<HTMLDivElement | null>(null);
	let mediaEl = $state<HTMLDivElement | null>(null);
	let synopsisEl = $state<HTMLDivElement | null>(null);
	let synopsisExpanded = $state(false);
	let synopsisTruncated = $state(false);

	// Foco + clip ambiental (solo móvil). `focused` lo decide el mismo cálculo
	// de scroll que dibuja el anillo del play: la tarjeta que ocupa la zona de
	// reposo. Como las tarjetas se apilan sin solaparse, solo una a la vez.
	let focused = $state(false);
	let ambientPlaying = $state(true);
	let ambientHasClip = $state(false);
	let ambientOn = $derived(isMobile && focused && !!movie.trailerAssetUrl);

	// Tope fijo en px (no flex-1 ni max-h de Tailwind): llenar "lo que sobre"
	// estiraba el ENVOLTORIO pero no el texto, así que el hueco solo se movía
	// de sitio. El alto vive en `style.height` para poder animarlo con
	// animate() al abrir/cerrar en vez de saltar de golpe -- "Leer más" solo
	// aparece si de verdad no entra en el tope. Más corto en móvil.
	let synopsisCollapsedHeight = $derived(isMobile ? 72 : 120);

	$effect(() => {
		if (!synopsisEl) return;
		const el = synopsisEl;
		const limit = synopsisCollapsedHeight;
		const measure = () => {
			if (synopsisExpanded) return;
			synopsisTruncated = el.scrollHeight > limit + 1;
			el.style.height = `${Math.min(el.scrollHeight, limit)}px`;
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	});

	function toggleSynopsis() {
		if (!synopsisEl) return;
		const el = synopsisEl;
		if (!synopsisExpanded) {
			synopsisExpanded = true;
			animate(el, { height: [el.clientHeight, el.scrollHeight], ease: 'outQuad', duration: 350 });
		} else {
			const from = el.scrollHeight;
			animate(el, { height: [from, Math.min(from, synopsisCollapsedHeight)], ease: 'outQuad', duration: 300 }).then(
				() => {
					synopsisExpanded = false;
				}
			);
		}
	}

	let groupedShowtimes = $derived.by(() => {
		if (!selectedDateStr) return [];
		const entries = movie.showtimesByDate?.[selectedDateStr] || [];
		const byFormat = new SvelteMap<string, ShowtimeDetails[]>();
		for (const entry of entries) {
			const key = entry.format || 'DIGITAL';
			if (!byFormat.has(key)) byFormat.set(key, []);
			byFormat.get(key)!.push(entry);
		}
		return Array.from(byFormat.entries());
	});

	function bookShowtime(showtime: ShowtimeDetails) {
		if (!sede || !selectedDateStr) return;
		bookingState.startBooking(movie, selectedDateStr, showtime, sede);
		goto(resolve(`/cines/${sede}/booking/${movie.id}`));
	}

	// Cuánto se ve cada tarjeta se decide por DÓNDE está el <article> respecto
	// a la "línea de reposo" (justo bajo el header sticky), no por el
	// progress crudo de animejs. Así:
	//   - En reposo está 100% visible sin importar cuán alta sea (si tiene
	//     muchísimos horarios, se lee completa antes de descartarse).
	//   - Aparición: mientras su borde superior baja hacia la línea de reposo.
	//   - Descarte: arranca cuando su borde INFERIOR entra en pantalla (o sea,
	//     cuando ya se leyó hasta el final) y termina al cruzar la línea.
	// Los transforms viven en `stageEl`, no en el article, para poder medir
	// el article sin que su propio translate/scale ensucie la medida.
	const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
	let applyFrame: (() => void) | null = null;

	$effect(() => {
		const el = chapterEl;
		const stage = stageEl;
		// Rastreado a propósito: al cambiar de rama (móvil <-> escritorio)
		// cambia el marcado y hay que volver a buscar el anillo del play.
		void isMobile;
		if (!el || !stage) return;

		// Todo lo demás se lee sin rastrear: este efecto debe correr una sola
		// vez por montaje, no cada vez que el filtro de fecha reemplaza el
		// objeto `movie` (mismo id, misma tarjeta).
		return untrack(() => {
			const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

			let wasInView = false;
			let ringDrawn = false;
			let lastFrame = '';
			const ringPath = el.querySelector<SVGPathElement>('.chapter-ring-path');
			const ring = ringPath ? svg.createDrawable(ringPath) : null;
			if (ring) utils.set(ring, { draw: '0 0' });

			const apply = () => {
				const rect = el.getBoundingClientRect();
				const vpH = window.innerHeight;
				const restTop = headerHeight;
				const visibleH = Math.max(1, vpH - restTop);
				// Alto de una tarjeta en reposo: lo visible menos el peek (en
				// móvil no hay peek: la tarjeta mide lo que su contenido).
				const restH = Math.max(1, visibleH - (isMobile ? 0 : PEEK));
				const inView = rect.bottom > 0 && rect.top < vpH;

				if (motion) {
					// Capa de composición (will-change) solo mientras está en
					// pantalla: pedirla en las N tarjetas a la vez era memoria de
					// GPU del tamaño de la pantalla por cada una, incluidas las que
					// estaban a cinco pantallas de distancia.
					if (inView !== wasInView) {
						wasInView = inView;
						stage.style.willChange = inView ? 'transform, opacity' : '';
					}

					if (inView) {
						// t: 1 = está asomando (posición de peek), 0 = llegó a la línea
						// de reposo. Recorre exactamente restH de scroll.
						const t = clamp01((rect.top - restTop) / restH);
						// Recesiva mientras asoma (0.55 de opacidad, 0.96 de escala);
						// completa desde t <= 0.25 (meseta).
						const vin = clamp01((1 - t) / 0.75);
						// d: 0 = su final aún no llegó a la línea de peek (o está en
						//    reposo), 1 = su final cruzó la línea de reposo (ya se fue).
						const d = clamp01(1 - (rect.bottom - restTop) / restH);
						// Aguanta completa hasta d <= 0.1 y desaparece del todo en
						// d >= 0.6: se va antes de que la siguiente termine de asentarse.
						const vout = clamp01((0.6 - d) / 0.5);

						const opacity = Math.min(0.55 + 0.45 * vin, vout).toFixed(3);
						const translateY = (-80 * (1 - vout)).toFixed(1);
						const scale = (1 - 0.04 * (1 - vin) - 0.1 * (1 - vout)).toFixed(4);
						const frame = `${opacity}|${translateY}|${scale}`;
						// Estilos directos, no utils.set(): ese crea y registra una
						// JSAnimation completa por llamada (ver animejs
						// utils/target.js), y esto corre por tarjeta en cada frame.
						if (frame !== lastFrame) {
							lastFrame = frame;
							stage.style.opacity = opacity;
							stage.style.transform = `translateY(${translateY}px) scale(${scale})`;
						}
					}
				}

				// Enfocada = la que ocupa un punto fijo bajo la línea de reposo.
				const probe = restTop + visibleH * 0.4;
				const active = rect.top <= probe && rect.bottom > probe;
				if (active !== focused) {
					focused = active;
					if (active) {
						ambientPlaying = true;
						// offsetTop/offsetHeight son medidas de layout (el article es
						// `relative`, así que son relativas a él) y no las mueve el
						// translate/scale del escenario, al contrario que getBoundingClientRect.
						const media = mediaEl;
						onFocus?.(index, {
							side: reversed ? 'right' : 'left',
							mediaBottom: media ? media.offsetTop + media.offsetHeight : null
						});
					} else {
						// TrailerBackground se desmonta con el foco; el estado
						// enlazado no se resetea solo.
						ambientHasClip = false;
					}
				}
				// El anillo del botón play (escritorio/tablet) se dibuja una sola
				// vez, la primera vez que la tarjeta queda enfocada.
				if (active && ring && !ringDrawn) {
					ringDrawn = true;
					animate(ring, { draw: ['0 0', '0 1'], ease: 'inOutQuad', duration: 900 });
				}
			};

			applyFrame = apply;
			apply();
			// enter/leave por defecto de animejs ('end start' → 'start end'):
			// dispara mientras cualquier parte de la tarjeta esté en pantalla.
			const observer = onScroll({ target: el, onUpdate: apply, onResize: apply });

			return () => {
				applyFrame = null;
				observer.revert();
			};
		});
	});

	// Re-aplica sin esperar un scroll cuando algo mueve la tarjeta por su
	// cuenta: el header termina de medirse, aparece el PromoBanner, o el
	// filtro quita/pone tarjetas (nuevo objeto `movie`, nuevo `index`) y las
	// demás se corren de sitio.
	$effect(() => {
		void headerHeight;
		void movie;
		void index;
		applyFrame?.();
	});
</script>

<!-- Piezas compartidas por las dos ramas de marcado -->
{#snippet tagline(onHero: boolean)}
	<div class="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] {onHero ? 'text-zinc-300' : 'text-zinc-500'}">
		<!-- "N°01 / 12": de un vistazo se sabe cuántas películas hay. En
		     escritorio (lg+) se oculta: ahí vive gigante en CarteleraChapters. -->
		<span class="font-mono lg:hidden {onHero ? 'text-zinc-300' : 'text-zinc-500'}">
			N°{String(index + 1).padStart(2, '0')}
			<span class="text-zinc-600">/</span>
			{String(total).padStart(2, '0')}
		</span>
		{#if movie.label}<span class="bg-white px-2 py-0.5 text-black">{movie.label}</span>{/if}
		{#if movie.duration}<span>{movie.duration}</span>{/if}
		{#if movie.rating}<span class="h-3 w-px bg-zinc-700"></span><span>{movie.rating}</span>{/if}
	</div>
{/snippet}

{#snippet synopsis()}
	{#if movie.synopsis}
		<div>
			<div bind:this={synopsisEl} class="relative overflow-hidden">
				<p class="text-sm leading-relaxed text-zinc-300 md:text-base">{movie.synopsis}</p>
				{#if !synopsisExpanded && synopsisTruncated}
					<div class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black to-transparent"></div>
				{/if}
			</div>
			{#if synopsisTruncated || synopsisExpanded}
				<button
					type="button"
					class="mt-2 self-start text-[11px] font-black uppercase tracking-widest text-zinc-400 transition-colors hover:text-white"
					aria-expanded={synopsisExpanded}
					onclick={toggleSynopsis}
				>
					{synopsisExpanded ? 'Leer menos' : 'Leer más'}
				</button>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet showtimes()}
	<div class="flex flex-col gap-5 pt-2">
		{#each groupedShowtimes as [format, times] (format)}
			<div>
				<p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{format}</p>
				<div class="flex flex-wrap gap-3">
					{#each times as showtime (showtime.id)}
						<button
							type="button"
							class="rounded-full border border-zinc-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-white hover:bg-white hover:text-black"
							onclick={() => bookShowtime(showtime)}
						>
							{showtime.time}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<p class="text-xs italic text-zinc-600">No hay funciones para esta fecha.</p>
		{/each}
	</div>
{/snippet}

{#snippet fichaButton()}
	<button
		type="button"
		class="flex items-center gap-2 self-start text-[11px] font-black uppercase tracking-widest text-zinc-400 transition-colors hover:text-white"
		onclick={() => onMoreInfo(movie)}
	>
		<Info class="size-4" /> Ficha completa
	</button>
{/snippet}

<article
	bind:this={chapterEl}
	class="cartelera-chapter relative border-t border-zinc-900 {isMobile ? 'pb-10' : 'flex flex-col justify-center py-12'}"
	style={isMobile
		? ''
		: `scroll-snap-align: start; scroll-margin-top: ${headerHeight}px; min-height: calc(100svh - ${headerHeight + PEEK}px);`}
>
	<!-- Los transforms del descarte van en este escenario, no en el <article>:
	     así el article se mide (getBoundingClientRect) sin que su propio
	     translate/scale contamine la medida. -->
	<div bind:this={stageEl}>
		{#if isMobile}
			<!-- Zona hero: medio de fondo + degradado + data encima, igual que
			     NetworkHeroMobile. Solo con foco se monta TrailerBackground; el
			     resto del tiempo es el banner (misma imagen, cambio invisible). -->
			<div class="relative h-[440px] w-full overflow-hidden bg-black">
				<div class="absolute inset-0">
					{#if ambientOn}
						<TrailerBackground {movie} mode="cover" loop={true} isPlaying={ambientPlaying && !ambientPaused} bind:hasOwnClip={ambientHasClip} />
					{:else if movie.banner}
						<ProgressiveImage src={movie.banner} alt="" placeholderSrc={imageThumb(movie.banner, movie.bannerSizes, 'w300')} loading="lazy" decoding="async" class="h-full w-full object-cover" />
					{:else if movie.poster}
						<img src={blurSource(movie.poster, movie.posterSizes)} alt="" aria-hidden="true" loading="lazy" decoding="async" class="h-full w-full object-cover blur-2xl scale-110 opacity-50" />
					{/if}
					<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10"></div>
				</div>

				<div class="relative z-10 flex h-full flex-col justify-end gap-4 p-5">
					<div class="flex items-end gap-4">
						{#if movie.poster}
							<button type="button" class="shrink-0" onclick={() => onMoreInfo(movie)} aria-label="Ficha completa de {movie.title}">
								<ProgressiveImage src={movie.poster} alt={movie.title} placeholderSrc={imageThumb(movie.poster, movie.posterSizes)} loading="lazy" decoding="async" class="aspect-[2/3] w-20 border border-zinc-800 object-cover shadow-2xl" />
							</button>
						{/if}
						<div class="min-w-0 flex-1">
							{@render tagline(true)}
							<h2 class="mt-1.5 font-display text-2xl font-black uppercase leading-tight text-white drop-shadow-lg">
								{movie.title}
							</h2>
						</div>
					</div>

					<div class="flex items-center gap-3">
						<button
							type="button"
							class="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-md transition-colors hover:bg-white/20"
							onclick={() => onPlayTrailer(movie)}
						>
							<Play class="size-3.5 fill-current" /> Ver tráiler
						</button>
						{#if ambientHasClip}
							<button
								type="button"
								class="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md"
								onclick={() => (ambientPlaying = !ambientPlaying)}
								aria-label={ambientPlaying ? 'Pausar tráiler' : 'Reproducir tráiler'}
							>
								{#if ambientPlaying}<Pause class="size-4" />{:else}<Play class="size-4" />{/if}
							</button>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-5 px-5 pt-5">
				{@render synopsis()}
				{@render showtimes()}
				{@render fichaButton()}
			</div>
		{:else}
			<div class="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-2 lg:gap-16">
				<!-- Columna de medios: SOLO imagen estática; el clip se abre con el
				     botón play (TrailerLightbox). `loading="lazy"`: los banners de
				     TMDB en tamaño original pesan varios MB cada uno. En tablet
				     (una sola columna) el alto se topa para que la ficha se vea
				     sin hacer scroll. -->
				<div bind:this={mediaEl} class="relative order-1 aspect-video max-h-[42svh] overflow-hidden bg-black lg:max-h-none {reversed ? 'lg:order-2' : 'lg:order-1'}">
					{#if movie.banner}
						<ProgressiveImage src={movie.banner} alt="" placeholderSrc={imageThumb(movie.banner, movie.bannerSizes, 'w300')} loading="lazy" decoding="async" class="absolute inset-0 h-full w-full object-cover" />
					{:else if movie.poster}
						<img src={blurSource(movie.poster, movie.posterSizes)} alt="" aria-hidden="true" loading="lazy" decoding="async" class="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-50" />
					{/if}
					<div class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent"></div>
					<div class="pointer-events-none absolute inset-y-0 hidden w-1/3 lg:block {reversed ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'} from-black to-transparent"></div>

					<button
						type="button"
						class="group absolute inset-0 flex items-center justify-center"
						aria-label="Ver tráiler de {movie.title}"
						onclick={() => onPlayTrailer(movie)}
					>
						<span class="relative flex size-20 items-center justify-center text-white transition-transform group-hover:scale-105">
							<svg viewBox="0 0 100 100" class="absolute inset-0 size-full" aria-hidden="true">
								<path class="chapter-ring-path" d="M50 6a44 44 0 1 1-0.01 0" fill="none" stroke="currentColor" stroke-width="2" />
							</svg>
							<Play class="ml-1 size-7 fill-current" />
						</span>
					</button>
				</div>

				<!-- Ficha -- items-center para que el bloque entero (póster + texto)
				     quede centrado verticalmente contra el alto real del banner. -->
				<div class="order-2 flex min-h-0 items-center gap-6 px-4 md:px-8 lg:gap-8 lg:px-0 {reversed ? 'lg:order-1 lg:pl-8 xl:pl-12' : 'lg:order-2 lg:pr-8 xl:pr-12'}">
					<div class="relative w-36 shrink-0 sm:w-44 xl:w-56">
						{#if movie.poster}
							<button type="button" class="block w-full" onclick={() => onMoreInfo(movie)} aria-label="Ficha completa de {movie.title}">
								<ProgressiveImage src={movie.poster} alt={movie.title} placeholderSrc={imageThumb(movie.poster, movie.posterSizes)} loading="lazy" decoding="async" class="aspect-[2/3] w-full border border-zinc-800 object-cover" />
							</button>
						{:else}
							<div class="flex aspect-[2/3] w-full items-center justify-center border border-zinc-800 bg-zinc-900 px-3 text-center">
								<span class="font-display text-xs font-bold uppercase text-zinc-500">{movie.title}</span>
							</div>
						{/if}
					</div>

					<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
						{@render tagline(false)}
						<h2 class="font-display text-3xl font-black uppercase leading-[0.95] text-white md:text-4xl xl:text-5xl">
							{movie.title}
						</h2>
						{@render synopsis()}
						{@render showtimes()}
						{@render fichaButton()}
					</div>
				</div>
			</div>
		{/if}
	</div>
</article>
