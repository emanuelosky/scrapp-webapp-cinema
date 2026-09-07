<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import AuroraBackground from '$lib/components/AuroraBackground.svelte';
	import ParallaxSVGs from '$lib/components/ParallaxSVGs.svelte';
	import { inview } from '$lib/actions/inview';
	import { animate, stagger } from 'animejs';
	import ft1 from '$lib/assets/events/ft1.webp';
	import ft2 from '$lib/assets/events/ft2.webp';
	import ft3 from '$lib/assets/events/ft3.webp';
	import ft4 from '$lib/assets/events/ft4.webp';

	let activeEvent = $state(0);
	let scrollY = $state(0);
	let root: HTMLDivElement | undefined = $state();

	// Entrada escalonada real (imagen, luego texto) cada vez que un slide 1-4 se
	// activa — antes ambos aparecían exactamente sincronizados con un fade CSS
	// plano. El contenedor del slide sigue mostrándose/ocultándose por CSS (ya
	// maneja bien pointer-events/z-index); esto añade un remate encima, sobre
	// elementos que hoy no tienen su propia opacidad/transform en CSS, así que
	// no compiten entre sí.
	$effect(() => {
		const n = activeEvent;
		if (!root || n < 1 || n > 4) return;

		const media = root.querySelector(`[data-slide="${n}"] .hero-scrolly-media`);
		const copy = root.querySelector(`[data-slide="${n}"] .hero-scrolly-copy`);
		if (!media || !copy) return;

		const anim = animate([media, copy], {
			opacity: [{ from: 0, to: 1 }],
			scale: [{ from: 0.92, to: 1 }],
			translateY: [{ from: 24, to: 0 }],
			ease: 'outElastic(1, .7)',
			duration: 900,
			delay: stagger(120)
		});

		return () => anim.revert();
	});
</script>

<svelte:window bind:scrollY={scrollY} />

<div bind:this={root} class="w-full relative h-[600vh] bg-black">
	<!-- Elemento Pegajoso que se queda en pantalla -->
	<div class="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
		<!-- Animated Aurora Background -->
		<AuroraBackground />

		<!-- Parallax SVGs for dynamic Anime.js style background -->
		<ParallaxSVGs {scrollY} />

		<!-- Viñeteado radial: más oscuro en los bordes (se funde con el negro
		     plano del carrusel arriba y el footer abajo), más claro al centro
		     (deja ver el color del Aurora en vez de aplastarlo con un rectángulo
		     de opacidad fija). Antes esto era un panel negro liso. -->
		<div
			class="absolute inset-0 z-0 transition-opacity duration-1000"
			style="background: radial-gradient(ellipse 70% 65% at 50% 50%, rgba(0,0,0,{activeEvent === 0 ? 0.35 : 0.6}) 0%, rgba(0,0,0,0.8) 55%, rgba(0,0,0,0.97) 100%);"
		></div>

		<!-- Entrada en negro absoluto: el viñeteado de arriba nunca llega a 1.0 de
		     opacidad (queda en 0.97 en los bordes), así que el aura de colores que
		     sangra desde los pósters del carrusel de arriba dejaba una línea
		     visible justo en el borde superior. Esta franja sí llega a negro
		     puro arriba del todo y se desvanece hacia el contenido, absorbiendo
		     ese sangrado en vez de chocar con él. -->
		<div class="absolute inset-x-0 top-0 h-40 md:h-56 z-[1] bg-gradient-to-b from-black from-0% via-black/70 via-40% to-transparent pointer-events-none"></div>

		<!-- Timeline Indicator (Camino de progreso) -->
		<div class="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-20 transition-opacity duration-1000 {activeEvent > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}">
			{#each [1, 2, 3, 4, 5] as step (step)}
				<div class="w-3 h-3 rounded-full transition-all duration-500 {activeEvent >= step ? 'bg-silverplate-300 scale-125 shadow-[0_0_10px_rgba(220,225,230,0.8)]' : 'bg-zinc-700'}"></div>
				{#if step < 5}
					<div class="w-0.5 h-12 md:h-16 transition-all duration-500 {activeEvent > step ? 'bg-silverplate-300' : 'bg-zinc-800'}"></div>
				{/if}
			{/each}
		</div>

		<div class="relative z-10 w-full max-w-7xl mx-auto px-12 md:px-24 flex flex-col items-center justify-center h-full">
			
			<!-- Slide 0: Título Principal -->
			<div class="absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out {activeEvent === 0 ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0 pointer-events-none'}">
				<h2 class="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter text-center max-w-5xl leading-none drop-shadow-2xl">
					¿Qué historia te gustaría <br class="md:hidden" /><span class="text-transparent bg-clip-text bg-gradient-to-r from-goldenrose-300 to-goldenrose-700">crear con nosotros?</span>
				</h2>
			</div>

			<!-- Slides 1 a 5 Container -->
			<div class="relative w-full h-[60vh] md:h-[50vh] mt-0 flex items-center justify-center">
				
				<!-- Slide 1: Image Left, Text Right -->
				<div data-slide="1" class="absolute inset-0 flex flex-col md:flex-row items-center gap-8 md:gap-16 transition-all duration-1000 ease-in-out {activeEvent === 1 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-12 z-0 pointer-events-none'}">
					<div class="hero-scrolly-media w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden ring-1 ring-white/20 shadow-2xl">
						<img src={ft1} alt="Eventos" class="w-full h-full object-cover" />
					</div>
					<div class="hero-scrolly-copy w-full md:w-1/2 flex flex-col items-start text-left">
						<h3 class="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg uppercase tracking-tight">Evento Inimaginable</h3>
						<p class="text-xl md:text-2xl text-zinc-300 mt-4 max-w-lg leading-relaxed">Organiza un evento completamente único en nuestras modernas salas de cine. La mejor tecnología visual a tu disposición.</p>
					</div>
				</div>

				<!-- Slide 2: Text Left, Image Right -->
				<div data-slide="2" class="absolute inset-0 flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 transition-all duration-1000 ease-in-out {activeEvent === 2 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-12 z-0 pointer-events-none'}">
					<div class="hero-scrolly-copy w-full md:w-1/2 flex flex-col items-start md:items-end text-left md:text-right">
						<h3 class="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg uppercase tracking-tight">Proyección Privada</h3>
						<p class="text-xl md:text-2xl text-zinc-300 mt-4 max-w-lg leading-relaxed">Disfruta de una película de nuestra cartelera en completa exclusividad con tus amigos, familia o empresa.</p>
					</div>
					<div class="hero-scrolly-media w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden ring-1 ring-white/20 shadow-2xl">
						<img src={ft2} alt="Proyecciones" class="w-full h-full object-cover" />
					</div>
				</div>

				<!-- Slide 3: Image Left, Text Right -->
				<div data-slide="3" class="absolute inset-0 flex flex-col md:flex-row items-center gap-8 md:gap-16 transition-all duration-1000 ease-in-out {activeEvent === 3 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-12 z-0 pointer-events-none'}">
					<div class="hero-scrolly-media w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden ring-1 ring-white/20 shadow-2xl">
						<img src={ft3} alt="Promociones" class="w-full h-full object-cover" />
					</div>
					<div class="hero-scrolly-copy w-full md:w-1/2 flex flex-col items-start text-left">
						<h3 class="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg uppercase tracking-tight">Promoción de Marca</h3>
						<p class="text-xl md:text-2xl text-zinc-300 mt-4 max-w-lg leading-relaxed">Utiliza nuestros enormes espacios y pantallas de alta resolución para promocionar tus productos y alcanzar nuevas audiencias.</p>
					</div>
				</div>

				<!-- Slide 4: Text Left, Image Right -->
				<div data-slide="4" class="absolute inset-0 flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 transition-all duration-1000 ease-in-out {activeEvent === 4 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-12 z-0 pointer-events-none'}">
					<div class="hero-scrolly-copy w-full md:w-1/2 flex flex-col items-start md:items-end text-left md:text-right">
						<h3 class="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg uppercase tracking-tight">Cumpleaños Épico</h3>
						<p class="text-xl md:text-2xl text-zinc-300 mt-4 max-w-lg leading-relaxed">Ven y celebra tu día especial de manera épica con nosotros. Combos, películas y un trato VIP inolvidable.</p>
					</div>
					<div class="hero-scrolly-media w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden ring-1 ring-white/20 shadow-2xl">
						<img src={ft4} alt="Cumpleaños" class="w-full h-full object-cover" />
					</div>
				</div>

				<!-- Slide 5: ¿Tienes otra idea? -->
				<div class="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-1000 ease-in-out {activeEvent >= 5 ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0 pointer-events-none'}">
					<h2 class="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter max-w-5xl leading-none drop-shadow-2xl mb-8">
						¿Tienes <span class="text-transparent bg-clip-text bg-gradient-to-r from-goldenrose-300 to-goldenrose-700">otra idea?</span>
					</h2>
					<p class="text-xl md:text-2xl text-zinc-300 max-w-2xl leading-relaxed mb-12">Cuéntanos tu proyecto y lo haremos realidad. Contamos con espacios, tecnología y personal experto a tu disposición.</p>
					
					<div class="flex flex-col md:flex-row items-center justify-center gap-6">
						<a href="https://api.whatsapp.com/send?phone=584221825273" target="_blank" class="w-full md:w-auto">
							<Button class="bg-white hover:bg-zinc-200 text-black font-bold py-6 px-10 rounded-full text-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all hover:scale-105 w-full">
								Contáctanos Ahora
							</Button>
						</a>
					</div>
				</div>
			</div>

			<!-- Mensaje Inferior: "Sigue deslizando" -->
			<div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30 transition-all duration-1000 {activeEvent >= 5 ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}">
				<span class="text-zinc-400 text-xs md:text-sm font-bold tracking-[0.2em] uppercase animate-pulse">Sigue deslizando</span>
				<div class="w-px h-12 md:h-16 bg-gradient-to-b from-goldenrose-500 to-transparent animate-[bounce_2s_infinite]"></div>
			</div>
		</div>
	</div>

	<!-- Disparadores de Scroll Fantasmas (Invisibles) -->
	<div class="relative z-20 w-full -mt-[100vh] pointer-events-none flex flex-col">
		<div class="h-[100vh] w-full" use:inview={{ threshold: 0.5, once: false, onEnter: () => activeEvent = 0 }}></div>
		<div class="h-[100vh] w-full" use:inview={{ threshold: 0.5, once: false, onEnter: () => activeEvent = 1 }}></div>
		<div class="h-[100vh] w-full" use:inview={{ threshold: 0.5, once: false, onEnter: () => activeEvent = 2 }}></div>
		<div class="h-[100vh] w-full" use:inview={{ threshold: 0.5, once: false, onEnter: () => activeEvent = 3 }}></div>
		<div class="h-[100vh] w-full" use:inview={{ threshold: 0.5, once: false, onEnter: () => activeEvent = 4 }}></div>
		<div class="h-[100vh] w-full" use:inview={{ threshold: 0.5, once: false, onEnter: () => activeEvent = 5 }}></div>
	</div>
</div>
