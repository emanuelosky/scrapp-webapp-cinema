<script lang="ts">
	import TrailerBackground from '$lib/components/home/TrailerBackground.svelte';
	import TrailerVolumeControl from '$lib/components/home/TrailerVolumeControl.svelte';
	import TrailerLightbox from '$lib/components/home/TrailerLightbox.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import Play from '@lucide/svelte/icons/play';
	import Pause from '@lucide/svelte/icons/pause';
	import Maximize2 from '@lucide/svelte/icons/maximize-2';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Ticket from '@lucide/svelte/icons/ticket';
	import type { Movie } from '$lib/types';

	let {
		movie,
		onSelectMovie,
		total = 1,
		currentIndex = 0,
		onNext,
		onPrev,
		onGoTo,
		onClipStateChange,
		onClipEnded,
		lightboxOpen = $bindable(false)
	}: {
		movie: Movie;
		onSelectMovie: (m: Movie) => void;
		total?: number;
		currentIndex?: number;
		onNext?: () => void;
		onPrev?: () => void;
		onGoTo?: (i: number) => void;
		onClipStateChange?: (hasClip: boolean) => void;
		onClipEnded?: () => void;
		lightboxOpen?: boolean;
	} = $props();

	let isMuted = $state(true);
	let hasOwnClip = $state(false);
	let hasAudio = $state(false);
	let isPlaying = $state(true);
	let volume = $state(70);

	let startX = $state(0);
	let startY = $state(0);

	function handlePointerDown(e: PointerEvent) {
		startX = e.clientX;
		startY = e.clientY;
	}

	function handlePointerUp(e: PointerEvent) {
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		
		if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
			if (dx > 0) {
				onPrev?.();
			} else {
				onNext?.();
			}
		}
	}

	// Si el lightbox se abre, pausamos el video de fondo
	$effect(() => {
		if (lightboxOpen) isPlaying = false;
	});

	// Avisa al orquestador (NetworkHero) si la película activa tiene clip
	// propio reproduciéndose, para que pause la rotación automática mientras
	// dura — evita cortar el tráiler a la mitad.
	$effect(() => {
		onClipStateChange?.(hasOwnClip);
	});

	// Cada película arranca reproduciéndose — sin esto, pasar a la
	// siguiente (que es una instancia nueva de TrailerBackground, por el
	// {#key movie.id}) arrastraría el "pausado" del estado local de este
	// padre desde la película anterior.
	$effect(() => {
		void movie.id;
		isPlaying = true;
	});

	// TMDB ya no nos da un tamaño fijo (usamos "original", que varía por
	// película) — la columna del banner adopta la proporción real de la
	// imagen/clip cargado en vez de forzar 16:9. Ese valor cae de vuelta a
	// 16/9 mientras la imagen todavía no reporta sus dimensiones.
	let naturalRatio = $state<number | null>(null);
	let bannerRatio = $derived(naturalRatio ?? 16 / 9);

	function youtubeFallbackUrl(m: Movie): string {
		if (m.trailerYoutubeUrl) return m.trailerYoutubeUrl;
		return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${m.title} tráiler oficial`)}`;
	}

	// Fusión hacia negro en ambos bordes del banner (mask-image, no un overlay
	// pintado encima — así el video/imagen se desvanece una sola vez, sin
	// doble oscurecimiento que tape el aura del lado izquierdo).
	const bannerMask =
		'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 10%, black 20%, black 90%, rgba(0,0,0,0.5) 95%, transparent 100%)';
	const bannerOverlayRight =
		'linear-gradient(to left, black 0%, rgba(0,0,0,0.6) 14%, rgba(0,0,0,0.2) 24%, transparent 34%)';

	// Aura: forma un marco — visible detrás del texto pero difuminada hacia los
	// extremos (izquierdo y derecho) para fusionarse con el fondo negro puro.
	const auraMask =
		'linear-gradient(to right, transparent 0%, black 15%, black 60%, transparent 95%, transparent 100%)';
	// El escudo de legibilidad (bg-black/70) antes cubría TODA la zona negra
	// parejo, ahogando el aura incluso donde el auraMask ya la deja visible.
	// Esta máscara es la inversa: concentra el oscurecido en la franja central
	// (donde vive el texto y el aura ya está oculta de todos modos) y lo
	// retira en los extremos, para que el aura se vea a plena intensidad ahí.
	const textShieldMask =
		'linear-gradient(to right, transparent 0%, black 20%, black 60%, transparent 100%)';
</script>

<!--
	Desktop estilo AMC + brutalismo cinematográfico: el banner se muestra
	completo, a su proporción real (16:9, nunca recortado), en su propia
	columna de ancho fijo. La zona negra es flexible y absorbe el resto del
	espacio — ahí vive la información, pegada hacia el lado del banner, con
	un aura de color sutil detrás (igual técnica que HeroDesktop en las sedes).

	Nota: la composición ya NO se centra con un max-width — en pantallas
	>1700px eso dejaba un margen negro suelto pegado al borde del banner
	(visible como una barra, porque el banner no es negro como la zona de
	texto). El banner ahora siempre llega hasta el borde real de la pantalla;
	el espacio extra en pantallas anchas lo absorbe la zona de texto (ya
	negra, así que no se nota).
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<section 
	class="relative hidden w-full overflow-hidden border-b border-zinc-900 bg-black md:flex md:h-[300px] xl:h-[440px]"
	onpointerdown={handlePointerDown} 
	onpointerup={handlePointerUp}
>
	<div class="mx-auto flex h-full w-full max-w-[1600px] 2xl:max-w-[1800px]">
	<!-- Zona negra: flexible, absorbe todo el ancho que el banner no necesita -->
	<div class="relative flex flex-1 items-center justify-end overflow-hidden px-6 xl:px-16">
		<!--
			Aura: glow de color derivado del banner, contenido cerca del lado
			del banner (donde ya vive la fusión) — detrás del título/info debe
			quedar negro absoluto, para que no compita con el linear-gradient
			ni deje un tinte raro sin resolver.
		-->
		{#key movie.id}
			{#if movie.banner}
				<!-- La máscara vive en este contenedor (inset-0 exacto = los bordes
				     reales de la zona visible); la imagen sobredimensionada de
				     adentro solo existe para que el blur no muestre su propio
				     borde recto. Aplicar la máscara directo a la imagen agrandada
				     desalineaba el 0%/100% respecto a lo que realmente se ve. -->
				<div
					class="pointer-events-none absolute inset-0 overflow-hidden"
					style="mask-image: {auraMask}; -webkit-mask-image: {auraMask};"
				>
					<img
						src={movie.banner}
						alt=""
						class="absolute -inset-20 h-[calc(100%+10rem)] w-[calc(100%+10rem)] scale-125 object-cover opacity-25 blur-3xl"
					/>
				</div>
			{/if}
		{/key}
		<div
			class="pointer-events-none absolute inset-0 bg-black/70"
			style="mask-image: {textShieldMask}; -webkit-mask-image: {textShieldMask};"
		></div>

		<div class="relative z-10 flex w-full max-w-xl flex-col gap-6">
			<div class="min-w-0">
				{#if movie.label}
					<span
						class="mb-3 inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black xl:text-xs {movie.label ===
						'PREVENTA'
							? 'bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-400'
							: 'bg-gradient-to-r from-champagne-400 via-champagne-500 to-champagne-500'}"
					>
						<Ticket class="size-3" />
						{movie.label}
					</span>
				{/if}
				<h2 class="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-white xl:text-6xl">
					{movie.title}
				</h2>
				{#if movie.formats || movie.rating || movie.duration}
					{@const formatParts = [movie.formats?.video, movie.formats?.language, movie.duration].filter(
						Boolean
					)}
					<!-- Separadores: líneas verticales sutiles con extremos difuminados en
					     vez de solo espaciado — marcan mejor dónde termina cada dato
					     (clasificación, formato, idioma, duración). -->
					<div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-300">
						{#if movie.rating}
							<span class="flex size-6 items-center justify-center rounded-sm bg-white text-[11px] font-black text-black">{movie.rating}</span>
							{#if formatParts.length > 0}
								<span class="h-4 w-px shrink-0 bg-gradient-to-b from-transparent via-zinc-500 to-transparent" aria-hidden="true"></span>
							{/if}
						{/if}
						{#each formatParts as part, i (i)}
							<span>{part}</span>
							{#if i < formatParts.length - 1}
								<span class="h-4 w-px shrink-0 bg-gradient-to-b from-transparent via-zinc-500 to-transparent" aria-hidden="true"></span>
							{/if}
						{/each}
					</div>
				{/if}
				{#if movie.synopsis}
					<!-- Cajón con su propio scroll en vez de "leer más": el texto
					     completo siempre está ahí, sin competir por espacio con los
					     botones de abajo. El mask-image difumina el final hacia
					     transparente cuando el texto no entra — se funde con el fondo
					     negro en vez de cortarse en seco justo antes de "Comprar
					     Boletos". El scrollbar (ScrollArea de shadcn) es invisible por
					     defecto y se tiñe de plateado solo al pasar el mouse (`group`). -->
					<ScrollArea
						class="group mt-4 h-24 pr-3 xl:h-32"
						style="mask-image: linear-gradient(to bottom, black 65%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 65%, transparent 100%);"
					>
						<p class="text-sm leading-relaxed text-zinc-300 xl:text-base">
							{movie.synopsis}
						</p>
					</ScrollArea>
				{/if}
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<Button
					onclick={() => onSelectMovie(movie)}
					class="h-12 flex-none rounded-full border border-white/10 bg-white/5 px-6 text-sm font-bold tracking-wide text-white/90 backdrop-blur-md transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white xl:h-14 xl:px-10 xl:text-base"
				>
					Comprar Boletos
				</Button>

				{#if !hasOwnClip}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a
						href={youtubeFallbackUrl(movie)}
						target="_blank"
						rel="noopener noreferrer"
						class="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white/40 xl:size-14"
						aria-label="Ver tráiler"
					>
						<Play class="size-4 xl:size-5" />
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Banner: columna a la proporción real de la imagen/clip cargado (ya no
	     un 16:9 fijo, porque TMDB "original" varía por película), nunca
	     recortado. Ambos bordes se disuelven hacia negro con un solo mask
	     (izquierdo: fusión con la zona de texto; derecho: viñeta contra el
	     borde real de la pantalla, reforzada por bannerOverlayRight). -->
	<div
		class="relative hidden h-full shrink-0 md:block"
		style="aspect-ratio: {bannerRatio}; mask-image: {bannerMask}; -webkit-mask-image: {bannerMask};"
	>
		{#key movie.id}
			<TrailerBackground
				{movie}
				mode="cover"
				bind:isMuted
				bind:hasOwnClip
				bind:hasAudio
				bind:naturalRatio
				bind:isPlaying
				loop={false}
				onEnded={onClipEnded}
			/>
		{/key}
		<div class="pointer-events-none absolute inset-y-0 right-0 w-[15%]" style="background: {bannerOverlayRight};"></div>

		<!-- Controles del tráiler: viven sobre el propio banner/video (no en
		     la columna de texto) — pausa, volumen (si el clip trae audio) y
		     abrir el reproductor centrado. -->
		{#if hasOwnClip}
			<div class="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-center justify-end gap-2 px-4 xl:px-6">
				<button
					type="button"
					onclick={() => (isPlaying = !isPlaying)}
					class="pointer-events-auto flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white/40 xl:size-12"
					aria-label={isPlaying ? 'Pausar tráiler' : 'Reproducir tráiler'}
				>
					{#if isPlaying}<Pause class="size-4" />{:else}<Play class="size-4" />{/if}
				</button>
				{#if hasAudio}
					<TrailerVolumeControl bind:isMuted bind:volume />
				{/if}
				<button
					type="button"
					onclick={() => (lightboxOpen = true)}
					class="pointer-events-auto flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white/40 xl:size-12"
					aria-label="Ver tráiler en reproductor grande"
				>
					<Maximize2 class="size-4" />
				</button>
			</div>
		{/if}
	</div>
	</div>

	<TrailerLightbox 
		bind:open={lightboxOpen} 
		{movie} 
		bind:isMuted 
		bind:volume 
		{hasAudio} 
		onSelectMovie={() => { lightboxOpen = false; onSelectMovie(movie); }}
		onNext={() => { lightboxOpen = false; onNext?.(); }}
	/>

	{#if total > 1}
		<!-- Navegación: flechas laterales grandes + indicadores abajo -->
		
		<!-- Lado Izquierdo (Previous) -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div 
			class="absolute inset-y-0 left-4 xl:left-8 z-20 w-20 xl:w-24 pointer-events-auto flex items-center justify-start group cursor-pointer"
			onclick={onPrev}
			aria-label="Película anterior"
		>
			<div class="flex items-center justify-center w-12 h-12 xl:w-14 xl:h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:bg-white group-hover:text-black group-hover:scale-110 group-active:scale-95 -translate-x-2 group-hover:translate-x-0">
				<ChevronLeft class="size-6 xl:size-7" strokeWidth={2.5} />
			</div>
		</div>

		<!-- Lado Derecho (Next) -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div 
			class="absolute inset-y-0 right-4 xl:right-8 z-20 w-20 xl:w-24 pointer-events-auto flex items-center justify-end group cursor-pointer"
			onclick={onNext}
			aria-label="Siguiente película"
		>
			<div class="flex items-center justify-center w-12 h-12 xl:w-14 xl:h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:bg-white group-hover:text-black group-hover:scale-110 group-active:scale-95 translate-x-2 group-hover:translate-x-0">
				<ChevronRight class="size-6 xl:size-7" strokeWidth={2.5} />
			</div>
		</div>

		<!-- Puntos indicadores abajo -->
		<div class="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-2">
			{#each Array(total) as _, i}
				<button
					type="button"
					onclick={() => onGoTo?.(i)}
					class="pointer-events-auto h-1.5 transition-all hover:bg-white/80 {i === currentIndex
						? 'w-6 rounded-full bg-white'
						: 'w-1.5 rounded-full bg-white/40'}"
					aria-label={`Ir a la película ${i + 1}`}
				></button>
			{/each}
		</div>
	{/if}
</section>
