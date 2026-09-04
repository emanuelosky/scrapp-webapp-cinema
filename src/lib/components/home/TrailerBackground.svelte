<script lang="ts">
	import type { Movie } from '$lib/types';

	let {
		movie,
		isMuted = $bindable(true),
		hasOwnClip = $bindable(false),
		mode = 'contain'
	}: { movie: Movie | null; isMuted?: boolean; hasOwnClip?: boolean; mode?: 'contain' | 'cover' } = $props();

	let fitClass = $derived(mode === 'cover' ? 'object-cover' : 'object-contain');

	let containerEl = $state<HTMLDivElement | null>(null);
	let shouldLoadVideo = $state(false);
	let videoEl = $state<HTMLVideoElement | null>(null);

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

	$effect(() => {
		hasOwnClip = !!movie?.trailerAssetUrl && shouldLoadVideo;
	});

	$effect(() => {
		if (videoEl) videoEl.muted = isMuted;
	});
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
			loop
			playsinline
		></video>
	{:else if movie?.banner}
		{#key movie.id}
			<img
				src={movie.banner}
				alt={movie.title}
				class="w-full h-full {fitClass} transition-opacity duration-700 animate-in fade-in"
			/>
		{/key}
	{/if}
</div>
