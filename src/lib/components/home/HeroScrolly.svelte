<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import AuroraBackground from '$lib/components/AuroraBackground.svelte';
	import ParallaxSVGs from '$lib/components/ParallaxSVGs.svelte';
	import { inview } from '$lib/actions/inview';
	import ft1 from '$lib/assets/events/ft1.jpg';
	import ft2 from '$lib/assets/events/ft2.jpg';
	import ft3 from '$lib/assets/events/ft3.jpg';
	import ft4 from '$lib/assets/events/ft4.jpg';

	let activeEvent = $state(0);
	let scrollY = $state(0);
</script>

<svelte:window bind:scrollY={scrollY} />

<div class="w-full relative h-[600vh] bg-black">
	<!-- Elemento Pegajoso que se queda en pantalla -->
	<div class="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
		<!-- Animated Aurora Background -->
		<AuroraBackground />
		
		<!-- Parallax SVGs for dynamic Anime.js style background -->
		<ParallaxSVGs {scrollY} />

		<!-- Foreground Overlay para contraste -->
		<div class="absolute inset-0 bg-black/60 z-0 transition-opacity duration-1000 {activeEvent === 0 ? 'opacity-40' : 'opacity-85'}"></div>

		<!-- Timeline Indicator (Camino de progreso) -->
		<div class="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-20 transition-opacity duration-1000 {activeEvent > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}">
			{#each [1, 2, 3, 4, 5] as step (step)}
				<div class="w-3 h-3 rounded-full transition-all duration-500 {activeEvent >= step ? 'bg-orange-500 scale-125 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'bg-zinc-700'}"></div>
				{#if step < 5}
					<div class="w-0.5 h-12 md:h-16 transition-all duration-500 {activeEvent > step ? 'bg-orange-500' : 'bg-zinc-800'}"></div>
				{/if}
			{/each}
		</div>

		<div class="relative z-10 w-full max-w-7xl mx-auto px-12 md:px-24 flex flex-col items-center justify-center h-full">
			
			<!-- Slide 0: Título Principal -->
			<div class="absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out {activeEvent === 0 ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0 pointer-events-none'}">
				<h2 class="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter text-center max-w-5xl leading-none drop-shadow-2xl">
					¿Qué historia te gustaría <br class="md:hidden" /><span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600">crear con nosotros?</span>
				</h2>
			</div>

			<!-- Slides 1 a 5 Container -->
			<div class="relative w-full h-[60vh] md:h-[50vh] mt-0 flex items-center justify-center">
				
				<!-- Slide 1: Image Left, Text Right -->
				<div class="absolute inset-0 flex flex-col md:flex-row items-center gap-8 md:gap-16 transition-all duration-1000 ease-in-out {activeEvent === 1 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-12 z-0 pointer-events-none'}">
					<div class="w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden ring-1 ring-white/20 shadow-2xl">
						<img src={ft1} alt="Eventos" class="w-full h-full object-cover" />
					</div>
					<div class="w-full md:w-1/2 flex flex-col items-start text-left">
						<h3 class="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg uppercase tracking-tight">Evento Inimaginable</h3>
						<p class="text-xl md:text-2xl text-zinc-300 mt-4 max-w-lg leading-relaxed">Organiza un evento completamente único en nuestras modernas salas de cine. La mejor tecnología visual a tu disposición.</p>
					</div>
				</div>

				<!-- Slide 2: Text Left, Image Right -->
				<div class="absolute inset-0 flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 transition-all duration-1000 ease-in-out {activeEvent === 2 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-12 z-0 pointer-events-none'}">
					<div class="w-full md:w-1/2 flex flex-col items-start md:items-end text-left md:text-right">
						<h3 class="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg uppercase tracking-tight">Proyección Privada</h3>
						<p class="text-xl md:text-2xl text-zinc-300 mt-4 max-w-lg leading-relaxed">Disfruta de una película de nuestra cartelera en completa exclusividad con tus amigos, familia o empresa.</p>
					</div>
					<div class="w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden ring-1 ring-white/20 shadow-2xl">
						<img src={ft2} alt="Proyecciones" class="w-full h-full object-cover" />
					</div>
				</div>

				<!-- Slide 3: Image Left, Text Right -->
				<div class="absolute inset-0 flex flex-col md:flex-row items-center gap-8 md:gap-16 transition-all duration-1000 ease-in-out {activeEvent === 3 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-12 z-0 pointer-events-none'}">
					<div class="w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden ring-1 ring-white/20 shadow-2xl">
						<img src={ft3} alt="Promociones" class="w-full h-full object-cover" />
					</div>
					<div class="w-full md:w-1/2 flex flex-col items-start text-left">
						<h3 class="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg uppercase tracking-tight">Promoción de Marca</h3>
						<p class="text-xl md:text-2xl text-zinc-300 mt-4 max-w-lg leading-relaxed">Utiliza nuestros enormes espacios y pantallas de alta resolución para promocionar tus productos y alcanzar nuevas audiencias.</p>
					</div>
				</div>

				<!-- Slide 4: Text Left, Image Right -->
				<div class="absolute inset-0 flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 transition-all duration-1000 ease-in-out {activeEvent === 4 ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-12 z-0 pointer-events-none'}">
					<div class="w-full md:w-1/2 flex flex-col items-start md:items-end text-left md:text-right">
						<h3 class="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg uppercase tracking-tight">Cumpleaños Épico</h3>
						<p class="text-xl md:text-2xl text-zinc-300 mt-4 max-w-lg leading-relaxed">Ven y celebra tu día especial de manera épica con nosotros. Combos, películas y un trato VIP inolvidable.</p>
					</div>
					<div class="w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden ring-1 ring-white/20 shadow-2xl">
						<img src={ft4} alt="Cumpleaños" class="w-full h-full object-cover" />
					</div>
				</div>

				<!-- Slide 5: ¿Tienes otra idea? -->
				<div class="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-1000 ease-in-out {activeEvent >= 5 ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0 pointer-events-none'}">
					<h2 class="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter max-w-5xl leading-none drop-shadow-2xl mb-8">
						¿Tienes <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600">otra idea?</span>
					</h2>
					<p class="text-xl md:text-2xl text-zinc-300 max-w-2xl leading-relaxed mb-12">Cuéntanos tu proyecto y lo haremos realidad. Contamos con espacios, tecnología y personal experto a tu disposición.</p>
					
					<div class="flex flex-col md:flex-row items-center justify-center gap-6">
						<a href="https://api.whatsapp.com/send?phone=584221825273" target="_blank" class="w-full md:w-auto">
							<Button class="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-6 px-10 rounded-full text-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all hover:scale-105 w-full">
								Contáctanos Ahora
							</Button>
						</a>
					</div>
				</div>
			</div>

			<!-- Mensaje Inferior: "Sigue deslizando" -->
			<div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30 transition-all duration-1000 {activeEvent >= 5 ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}">
				<span class="text-zinc-400 text-xs md:text-sm font-bold tracking-[0.2em] uppercase animate-pulse">Sigue deslizando</span>
				<div class="w-px h-12 md:h-16 bg-gradient-to-b from-orange-500 to-transparent animate-[bounce_2s_infinite]"></div>
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
