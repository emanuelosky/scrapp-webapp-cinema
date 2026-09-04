<script lang="ts">
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import Play from '@lucide/svelte/icons/play';
	import type { Movie } from '$lib/types';

	let { movie }: { movie: Movie | null } = $props();

	let containerEl = $state<HTMLDivElement | null>(null);
	let shouldLoadVideo = $state(false);
	let isMuted = $state(true);
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

	function toggleMute() {
		isMuted = !isMuted;
		if (videoEl) videoEl.muted = isMuted;
	}

	function youtubeFallbackUrl(m: Movie): string {
		if (m.trailerYoutubeUrl) return m.trailerYoutubeUrl;
		return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${m.title} tráiler oficial`)}`;
	}

	let hasOwnClip = $derived(!!movie?.trailerAssetUrl && shouldLoadVideo);
</script>

<div bind:this={containerEl} class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
	{#if hasOwnClip && movie}
		<video
			bind:this={videoEl}
			src={movie.trailerAssetUrl}
			class="w-full h-full object-cover opacity-80"
			autoplay
			muted={isMuted}
			loop
			playsinline
		></video>
		<div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30"></div>

		<button
			onclick={toggleMute}
			class="pointer-events-auto absolute bottom-6 right-6 z-20 flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70"
			aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
		>
			{#if isMuted}
				<VolumeX class="size-4" />
			{:else}
				<Volume2 class="size-4" />
			{/if}
		</button>
	{:else if movie}
		{#key movie.id}
			<img
				src={movie.banner || movie.poster}
				class="w-full h-full object-cover blur-2xl opacity-70 scale-110 transition-opacity duration-1000 animate-in fade-in"
				alt=""
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40"></div>
		{/key}

		<a
			href={youtubeFallbackUrl(movie)}
			target="_blank"
			rel="noopener noreferrer"
			class="pointer-events-auto absolute bottom-6 right-6 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md transition-colors hover:bg-black/70"
		>
			<Play class="size-3.5" />
			Ver Tráiler
		</a>
	{/if}
</div>
