<script lang="ts">
	import type { Movie } from '$lib/types';

	let {
		movie,
		isMuted = $bindable(true),
		hasOwnClip = $bindable(false)
	}: { movie: Movie | null; isMuted?: boolean; hasOwnClip?: boolean } = $props();

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
	Zócalo de medios del hero: banner o clip propio, siempre a su proporción
	natural (16:9, igual que los backdrops de TMDB) y SIN overlays ni
	desenfoques — las distribuidoras no permiten cubrir su información.
-->
<div bind:this={containerEl} class="relative w-full aspect-video bg-black overflow-hidden">
	{#if hasOwnClip && movie}
		<video
			bind:this={videoEl}
			src={movie.trailerAssetUrl}
			class="w-full h-full object-cover"
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
				class="w-full h-full object-cover transition-opacity duration-700 animate-in fade-in"
			/>
		{/key}
	{/if}
</div>
