<script lang="ts">
	import type { Movie } from '$lib/types';

	let {
		movie,
		isMuted = $bindable(true),
		hasOwnClip = $bindable(false),
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

	// Carga asíncrona: el clip solo se pide cuando el hero entra en pantalla,
	// nunca bloquea el render inicial de la página.
	$effect(() => {
		if (!containerEl || !movie?.trailerAssetUrl) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					shouldLoadVideo = true;
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	// Reinicia el estado de falla al cambiar de película o de clip candidato.
	$effect(() => {
		void movie?.trailerAssetUrl;
		videoFailed = false;
	});

	$effect(() => {
		hasOwnClip = !!movie?.trailerAssetUrl && shouldLoadVideo && !videoFailed;
	});

	function onVideoError() {
		// El emparejamiento de clips es aproximado (ver localTrailers.ts) —
		// si el archivo no existe o falla, volvemos silenciosamente al banner.
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
