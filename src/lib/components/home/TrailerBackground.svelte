<script lang="ts">
	import type { Movie } from '$lib/types';
	import { HERO_TRAILERS_ENABLED, HERO_BANNER_MIN_MS } from '$lib/config/heroTrailers';

	let {
		movie,
		isMuted = $bindable(true),
		hasOwnClip = $bindable(false),
		hasAudio = $bindable(false),
		mode = 'contain',
		naturalRatio = $bindable(null),
		loop = true,
		isPlaying = $bindable(true),
		videoEl = $bindable(null),
		onEnded
	}: {
		movie: Movie | null;
		isMuted?: boolean;
		hasOwnClip?: boolean;
		hasAudio?: boolean;
		mode?: 'contain' | 'cover';
		naturalRatio?: number | null;
		loop?: boolean;
		isPlaying?: boolean;
		videoEl?: HTMLVideoElement | null;
		onEnded?: () => void;
	} = $props();

	let fitClass = $derived(mode === 'cover' ? 'object-cover' : 'object-contain');

	let containerEl = $state<HTMLDivElement | null>(null);
	let shouldLoadVideo = $state(false);
	let videoFailed = $state(false);
	let isIntersecting = $state(false);
	let hasFocus = $state(typeof document !== 'undefined' ? document.hasFocus() : true);
	let bannerMinTimeElapsed = $state(false);

	// Ahorro de cuota del bucket: además de esperar a que el hero esté en
	// pantalla, esperamos a que la pestaña tenga el foco real del usuario
	// (document.hasFocus() — nativo del navegador, nada clickeable/tocable
	// para el visitante). Sin esto, cada reload durante desarrollo (con la
	// pestaña de fondo mientras se trabaja en el editor) vuelve a descargar
	// el clip completo aunque nadie lo esté viendo. Un visitante real casi
	// siempre tiene la pestaña enfocada, así que esto nunca le agrega demora.
	$effect(() => {
		function onFocus() {
			hasFocus = true;
		}
		function onBlur() {
			hasFocus = false;
		}
		window.addEventListener('focus', onFocus);
		window.addEventListener('blur', onBlur);
		return () => {
			window.removeEventListener('focus', onFocus);
			window.removeEventListener('blur', onBlur);
		};
	});

	// Carga asíncrona: el clip solo se pide cuando el hero entra en pantalla
	// Y la pestaña tiene foco, nunca bloquea el render inicial de la página.
	$effect(() => {
		if (!HERO_TRAILERS_ENABLED || !containerEl || !movie?.trailerAssetUrl) return;
		const observer = new IntersectionObserver(
			(entries) => {
				isIntersecting = !!entries[0]?.isIntersecting;
			},
			{ rootMargin: '200px' }
		);
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (isIntersecting && hasFocus) shouldLoadVideo = true;
	});

	// El banner se ve primero SIEMPRE, un tiempo mínimo fijo, para que el
	// paso a video sea consistente en todas las películas y nunca dependa
	// de qué tan rápido cargó el clip (evita el "flash" de pasar directo
	// al video apenas está listo). Se reinicia solo al cambiar de película
	// porque el padre remonta este componente entero (`{#key movie.id}`).
	$effect(() => {
		const timer = setTimeout(() => {
			bannerMinTimeElapsed = true;
		}, HERO_BANNER_MIN_MS);
		return () => clearTimeout(timer);
	});

	// Reinicia el estado de falla al cambiar de película o de clip candidato.
	$effect(() => {
		void movie?.trailerAssetUrl;
		videoFailed = false;
		hasAudio = false;
	});

	// Detección de audio: no existe una API estándar única para esto entre
	// navegadores, así que combinamos las señales disponibles. Nuestros
	// clips actuales se procesan con -an (sin audio) a propósito — esto
	// hace que el control de volumen desaparezca solo mientras sea así, y
	// aparezca automáticamente el día que un clip sí traiga audio.
	function detectAudio(video: HTMLVideoElement): boolean {
		const v = video as HTMLVideoElement & {
			mozHasAudio?: boolean;
			audioTracks?: { length: number };
			webkitAudioDecodedByteCount?: number;
		};
		if (typeof v.mozHasAudio === 'boolean') return v.mozHasAudio;
		if (v.audioTracks && v.audioTracks.length > 0) return true;
		if (typeof v.webkitAudioDecodedByteCount === 'number' && v.webkitAudioDecodedByteCount > 0) return true;
		return false;
	}

	$effect(() => {
		hasOwnClip =
			HERO_TRAILERS_ENABLED &&
			!!movie?.trailerAssetUrl &&
			shouldLoadVideo &&
			!videoFailed &&
			bannerMinTimeElapsed;
	});

	function onVideoError() {
		// Si trailerAssetUrl falla al cargar (archivo borrado del bucket, red,
		// etc.), volvemos silenciosamente al banner estático.
		videoFailed = true;
	}

	$effect(() => {
		if (videoEl) videoEl.muted = isMuted;
	});

	// Control manual de reproducción (pausa/reanuda) desde el hero.
	$effect(() => {
		if (!videoEl) return;
		if (isPlaying) videoEl.play().catch(() => {});
		else videoEl.pause();
	});

	// El banner/clip ya no viene en un tamaño fijo (TMDB "original" varía por
	// película). En vez de forzar 16:9, leemos la proporción real una vez
	// carga y la exponemos hacia arriba para que el contenedor se ajuste.
	// Se resetea al cambiar de película para no arrastrar la proporción
	// anterior mientras la nueva imagen todavía está cargando.
	$effect(() => {
		void movie?.id;
		naturalRatio = null;
	});

	function onImageLoad(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		if (img.naturalWidth && img.naturalHeight) {
			naturalRatio = img.naturalWidth / img.naturalHeight;
		}
	}
	function onVideoMeta(e: Event) {
		const video = e.currentTarget as HTMLVideoElement;
		if (video.videoWidth && video.videoHeight) {
			naturalRatio = video.videoWidth / video.videoHeight;
		}
		hasAudio = detectAudio(video);
		// webkitAudioDecodedByteCount solo refleja datos reales una vez que
		// arrancó a decodificar — reintentamos un momento después de que
		// empieza a reproducir para no perder un falso negativo temprano.
		setTimeout(() => {
			if (videoEl && !hasAudio) hasAudio = detectAudio(videoEl);
		}, 500);
	}
</script>

<!--
	Medio del hero (banner o clip propio). Llena el contenedor que le dé el
	padre. mode="contain" (default, usado en el layout de escritorio) nunca
	recorta el banner. mode="cover" es solo para el fondo ambiental de
	mobile, donde el banner actúa como decoración detrás del póster/texto
	(estos banners no traen texto/logos propios que se puedan tapar).
-->
<div bind:this={containerEl} class="relative w-full h-full bg-black overflow-hidden">
	{#if hasOwnClip && movie}
		<video
			bind:this={videoEl}
			src={movie.trailerAssetUrl}
			class="w-full h-full {fitClass}"
			autoplay
			muted={isMuted}
			{loop}
			playsinline
			onloadedmetadata={onVideoMeta}
			onerror={onVideoError}
			onended={() => onEnded?.()}
		></video>
	{:else if movie?.banner}
		{#key movie.id}
			<img
				src={movie.banner}
				alt={movie.title}
				class="w-full h-full {fitClass}"
				onload={onImageLoad}
			/>
		{/key}
	{/if}
</div>
