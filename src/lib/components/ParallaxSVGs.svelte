<script lang="ts">
	import { animate, stagger, svg } from 'animejs';
	import { onMount } from 'svelte';

	let { scrollY = 0 } = $props<{ scrollY: number }>();

	let container: HTMLDivElement | undefined = $state();

	// Ilustraciones propias (no íconos genéricos de Lucide): cinta de película
	// perforada, boleto troquelado, cubo de cotufas, cono de luz de proyector y
	// una ráfaga de estrellas. viewBox uniforme de 100x100 para poder mezclarlas
	// libremente. Cada una alterna entre "golden rose" (el acento real de la
	// sede VVIP, ver layout.css) y plateado (frío) — antes todo era un ámbar
	// genérico de un solo tono, sin origen en ningún theme real ni variedad.
	type Tone = 'rose' | 'silver';
	interface Particle {
		id: number;
		svg: 'filmstrip' | 'ticket' | 'popcorn' | 'projector' | 'stars';
		top: number;
		left: number;
		speed: number;
		rotateSpeed: number;
		scale: number;
		opacity: number;
		tone: Tone;
		size: number;
		desktopOnly?: boolean;
	}

	const particles: Particle[] = [
		{ id: 1, svg: 'filmstrip', top: 8, left: 12, speed: 0.15, rotateSpeed: 0.02, scale: 1, opacity: 0.5, tone: 'rose', size: 72 },
		{ id: 2, svg: 'stars', top: 22, left: 88, speed: 0.25, rotateSpeed: -0.015, scale: 1, opacity: 0.55, tone: 'silver', size: 56 },
		{ id: 3, svg: 'projector', top: 42, left: 6, speed: 0.1, rotateSpeed: 0.006, scale: 1, opacity: 0.4, tone: 'silver', size: 88 },
		{ id: 4, svg: 'ticket', top: 58, left: 80, speed: 0.2, rotateSpeed: 0.025, scale: 1, opacity: 0.5, tone: 'rose', size: 64 },
		{ id: 5, svg: 'popcorn', top: 74, left: 22, speed: 0.12, rotateSpeed: -0.018, scale: 1, opacity: 0.45, tone: 'rose', size: 68 },
		{ id: 6, svg: 'stars', top: 88, left: 68, speed: 0.08, rotateSpeed: 0.03, scale: 0.7, opacity: 0.5, tone: 'silver', size: 40 },
		{ id: 7, svg: 'filmstrip', top: 92, left: 34, speed: 0.18, rotateSpeed: 0.012, scale: 0.8, opacity: 0.35, tone: 'silver', size: 56 },
		// Solo en desktop: hay canvas de sobra que en mobile se vería saturado.
		{ id: 8, svg: 'ticket', top: 14, left: 55, speed: 0.14, rotateSpeed: -0.02, scale: 1, opacity: 0.4, tone: 'silver', size: 60, desktopOnly: true },
		{ id: 9, svg: 'popcorn', top: 65, left: 45, speed: 0.22, rotateSpeed: 0.015, scale: 0.9, opacity: 0.4, tone: 'rose', size: 52, desktopOnly: true },
		{ id: 10, svg: 'projector', top: 35, left: 92, speed: 0.16, rotateSpeed: -0.01, scale: 0.85, opacity: 0.35, tone: 'rose', size: 60, desktopOnly: true }
	];

	function toneClass(tone: Tone) {
		return tone === 'rose' ? 'text-goldenrose-500' : 'text-silverplate-300';
	}

	onMount(() => {
		if (!container) return;

		// Vida propia: antes los íconos solo se movían si el usuario scrolleaba;
		// en reposo estaban completamente quietos. Este loop infinito los hace
		// respirar (flotar/rotar/pulsar) todo el tiempo, independiente del scroll.
		//
		// Ojo: esto anima el envoltorio INTERNO (.hero-particle-idle), nunca el
		// externo que lleva el transform ligado al scroll — anime.js escribe la
		// propiedad `transform` completa al animar translateY/rotate, así que si
		// ambos apuntaran al mismo elemento se pisarían entre sí. La opacidad se
		// anima como un rango fijo relativo (0.7↔1) que se multiplica sobre la
		// opacidad base de cada partícula (puesta en el envoltorio externo), en
		// vez de un valor por-elemento — más simple y sin pelear con los tipos.
		const idle = animate('.hero-particle-idle', {
			translateY: [
				{ to: -14, duration: 2600 },
				{ to: 0, duration: 2600 }
			],
			rotate: [
				{ to: 4, duration: 3200 },
				{ to: -4, duration: 3200 }
			],
			opacity: [
				{ to: 0.7, duration: 2200 },
				{ to: 1, duration: 2200 }
			],
			ease: 'inOutSine',
			loop: true,
			delay: stagger(180)
		});

		// Efecto de "dibujarse" al aparecer: en vez de solo hacer fade-in, cada
		// trazo se traza progresivamente. Esto es lo que de verdad aprovecha el
		// módulo SVG de anime.js, no solo mover un contenedor.
		const drawables = svg.createDrawable('.hero-particle-path');
		const draw = animate(drawables, {
			draw: ['0 0', '0 1'],
			ease: 'inOutQuad',
			duration: 1400,
			delay: stagger(120, { start: 300 })
		});

		return () => {
			idle.revert();
			draw.revert();
		};
	});
</script>

<div bind:this={container} class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
	{#each particles as p (p.id)}
		<!-- Envoltorio EXTERNO: transform ligado al scroll, con transición CSS para
		     que la posición se amortigüe en vez de seguir el scroll 1:1 (antes era
		     puramente lineal). anime.js nunca toca este elemento. -->
		<div
			class="absolute {p.desktopOnly ? 'hidden md:block' : ''} transition-transform duration-700 ease-out"
			style="
				top: {p.top}%;
				left: {p.left}%;
				width: {p.size}px;
				height: {p.size}px;
				opacity: {p.opacity};
				transform: translate3d(0, {scrollY * p.speed}px, 0) rotate({scrollY * p.rotateSpeed}deg) scale({p.scale});
			"
		>
			<!-- Envoltorio INTERNO: aquí anima anime.js el loop de vida propia
			     (translateY/rotate/opacity). Separado del externo para que ninguno
			     de los dos se pise la propiedad `transform` del otro. -->
			<div class="hero-particle-idle relative w-full h-full {toneClass(p.tone)}">
				<!-- Duplicado difuminado detrás, mismo tono: da profundidad tipo letrero
				     de neón en vez de un trazo plano. -->
				<svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full blur-md opacity-70" aria-hidden="true">
					{#if p.svg === 'filmstrip'}
						<rect x="15" y="10" width="70" height="80" rx="6" fill="none" stroke="currentColor" stroke-width="4" />
					{:else if p.svg === 'ticket'}
						<path d="M10 30 Q10 20 20 20 H80 Q90 20 90 30 A8 8 0 0 0 90 46 A8 8 0 0 0 90 62 Q90 72 80 72 H20 Q10 72 10 62 A8 8 0 0 0 10 46 A8 8 0 0 0 10 30Z" fill="none" stroke="currentColor" stroke-width="4" />
					{:else if p.svg === 'popcorn'}
						<path d="M28 40 L34 88 H66 L72 40Z" fill="none" stroke="currentColor" stroke-width="4" />
					{:else if p.svg === 'projector'}
						<path d="M20 30 L85 12 L85 78 L20 60Z" fill="none" stroke="currentColor" stroke-width="4" />
					{:else}
						<polygon points="50,8 61,38 92,38 67,57 77,88 50,69 23,88 33,57 8,38 39,38" fill="currentColor" />
					{/if}
				</svg>

				<svg viewBox="0 0 100 100" class="relative w-full h-full" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					{#if p.svg === 'filmstrip'}
						<rect class="hero-particle-path" x="15" y="10" width="70" height="80" rx="6" />
						{#each [0, 1, 2, 3, 4, 5] as row (row)}
							<rect class="hero-particle-path" x="19" y={16 + row * 12.5} width="6" height="6" rx="1.5" fill="currentColor" stroke="none" />
							<rect class="hero-particle-path" x="75" y={16 + row * 12.5} width="6" height="6" rx="1.5" fill="currentColor" stroke="none" />
						{/each}
						<line class="hero-particle-path" x1="32" y1="10" x2="32" y2="90" stroke-dasharray="3 4" opacity="0.6" />
						<line class="hero-particle-path" x1="68" y1="10" x2="68" y2="90" stroke-dasharray="3 4" opacity="0.6" />
					{:else if p.svg === 'ticket'}
						<path class="hero-particle-path" d="M10 30 Q10 20 20 20 H80 Q90 20 90 30 A8 8 0 0 0 90 46 A8 8 0 0 0 90 62 Q90 72 80 72 H20 Q10 72 10 62 A8 8 0 0 0 10 46 A8 8 0 0 0 10 30Z" />
						<line class="hero-particle-path" x1="50" y1="24" x2="50" y2="68" stroke-dasharray="4 5" opacity="0.7" />
						<polygon class="hero-particle-path" points="50,38 53,44 60,44 54,48 56,55 50,51 44,55 46,48 40,44 47,44" fill="currentColor" stroke="none" opacity="0.85" />
					{:else if p.svg === 'popcorn'}
						<path class="hero-particle-path" d="M28 40 L34 88 H66 L72 40Z" />
						<path class="hero-particle-path" d="M22 40 Q28 26 38 36 Q44 22 50 36 Q56 22 62 36 Q72 26 78 40Z" />
						<line class="hero-particle-path" x1="42" y1="44" x2="39" y2="82" opacity="0.6" />
						<line class="hero-particle-path" x1="58" y1="44" x2="61" y2="82" opacity="0.6" />
					{:else if p.svg === 'projector'}
						<rect class="hero-particle-path" x="8" y="24" width="14" height="12" rx="2" />
						<circle class="hero-particle-path" cx="15" cy="30" r="3" fill="currentColor" stroke="none" />
						<path class="hero-particle-path" d="M20 30 L85 12 L85 78 L20 60Z" opacity="0.9" />
						<line class="hero-particle-path" x1="30" y1="33" x2="72" y2="26" stroke-dasharray="2 5" opacity="0.5" />
						<line class="hero-particle-path" x1="30" y1="45" x2="76" y2="45" stroke-dasharray="2 5" opacity="0.5" />
					{:else}
						<polygon class="hero-particle-path" points="50,8 61,38 92,38 67,57 77,88 50,69 23,88 33,57 8,38 39,38" fill="currentColor" opacity="0.9" />
						<polygon class="hero-particle-path" points="78,4 82,15 93,15 84,22 87,33 78,26 69,33 72,22 63,15 74,15" fill="currentColor" opacity="0.6" />
						<polygon class="hero-particle-path" points="20,55 23,63 32,63 25,68 28,76 20,71 12,76 15,68 8,63 17,63" fill="currentColor" opacity="0.5" />
					{/if}
				</svg>
			</div>
		</div>
	{/each}
</div>
