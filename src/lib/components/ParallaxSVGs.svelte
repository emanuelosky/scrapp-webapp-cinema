<script lang="ts">
	let { scrollY = 0 } = $props<{ scrollY: number }>();
	
	// Predefined particles with distinct behaviors
	const particles = [
		{ id: 1, type: 'film', top: 10, left: 15, speed: 0.15, rotateSpeed: 0.02, scale: 1.2, opacity: 0.2 },
		{ id: 2, type: 'rocket', top: 25, left: 85, speed: 0.25, rotateSpeed: -0.01, scale: 1.5, opacity: 0.15 },
		{ id: 3, type: 'projector', top: 40, left: 10, speed: 0.1, rotateSpeed: 0.005, scale: 1.8, opacity: 0.1 },
		{ id: 4, type: 'ticket', top: 55, left: 75, speed: 0.2, rotateSpeed: 0.03, scale: 1.1, opacity: 0.2 },
		{ id: 5, type: 'clapperboard', top: 70, left: 20, speed: 0.12, rotateSpeed: -0.02, scale: 1.4, opacity: 0.15 },
		{ id: 6, type: 'star', top: 85, left: 80, speed: 0.08, rotateSpeed: 0.05, scale: 0.9, opacity: 0.25 },
		{ id: 7, type: 'film', top: 90, left: 30, speed: 0.18, rotateSpeed: 0.01, scale: 1.3, opacity: 0.1 },
	];
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
	{#each particles as p (p.id)}
		<div 
			class="absolute text-orange-500/20"
			style="
				top: {p.top}%; 
				left: {p.left}%; 
				opacity: {p.opacity};
				transform: translate3d(0, {scrollY * p.speed}px, 0) rotate({scrollY * p.rotateSpeed}deg) scale({p.scale});
			"
		>
			{#if p.type === 'film'}
				<!-- Film Reel -->
				<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<rect width="18" height="18" x="3" y="3" rx="2"/>
					<path d="M7 3v18"/><path d="M17 3v18"/><path d="M3 7.5h4"/><path d="M3 12h4"/><path d="M3 16.5h4"/><path d="M17 7.5h4"/><path d="M17 12h4"/><path d="M17 16.5h4"/>
				</svg>
			{:else if p.type === 'rocket'}
				<!-- Rocket -->
				<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
					<path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
					<path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
					<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
				</svg>
			{:else if p.type === 'projector'}
				<!-- Projector -->
				<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 7 A3 3 0 0 1 11 7 A3 3 0 0 1 5 7" />
					<path d="M13 7 A3 3 0 0 1 19 7 A3 3 0 0 1 13 7" />
					<rect x="3" y="10" width="18" height="10" rx="2" />
					<path d="M15 15h4" /><path d="M6 20v2" /><path d="M18 20v2" />
				</svg>
			{:else if p.type === 'ticket'}
				<!-- Ticket -->
				<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
					<path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
				</svg>
			{:else if p.type === 'clapperboard'}
				<!-- Clapperboard -->
				<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4Z"/>
					<path d="m4 11-.88-2.87a2 2 0 0 1 1.33-2.5l11.48-3.5a2 2 0 0 1 2.5 1.32l.87 2.87L4 11.01Z"/>
					<path d="m6.6 1.36 4.75 1.54"/><path d="m11.83 3.04 4.75 1.54"/>
				</svg>
			{:else if p.type === 'star'}
				<!-- Star -->
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
				</svg>
			{/if}
		</div>
	{/each}
</div>
