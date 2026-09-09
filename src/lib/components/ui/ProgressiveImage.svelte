<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';

	// Carga progresiva ("blur-up") para pósters y banners.
	//
	// Recibe la miniatura ya resuelta en `placeholderSrc`; NO sabe de dónde
	// sale. Esa decisión vive en `$lib/utils/images`, que contempla que el
	// backend la provea, que se derive de una URL de TMDB, o que no exista.
	// Sin `placeholderSrc` esto se comporta exactamente como un <img> normal,
	// que es lo que hay que asumir si el backend termina siendo uno que
	// entrega una sola imagen (Vista, por ejemplo).
	//
	// La miniatura va como `background-image` del MISMO <img>, no como un
	// elemento aparte: así el componente conserva exactamente las clases y el
	// layout de quien lo use (aspect-*, object-cover, bordes...) sin envolturas
	// que cambien el diseño. Mientras la grande no ha pintado, el <img> es
	// transparente y se ve su fondo.
	//
	// El destape usa una `animation`, NO `transition`, y no toca `transform`:
	// varios usos traen `transition-transform` y `hover:scale-105` de Tailwind,
	// y un `transition`/`transform` en línea los pisaría (los estilos en línea
	// ganan) rompiendo el hover de los carruseles.
	let {
		src,
		alt = '',
		class: className = '',
		placeholderSrc,
		onload,
		...rest
	}: {
		src: string | undefined;
		alt?: string;
		class?: string;
		/** Miniatura del mismo encuadre. Sin ella no hay destape progresivo. */
		placeholderSrc?: string;
	} & Omit<HTMLImgAttributes, 'src' | 'alt' | 'class'> = $props();

	let imgEl = $state<HTMLImageElement | null>(null);
	let loaded = $state(false);
	let usedPlaceholder = $state(false);

	// Al cambiar de imagen hay que volver a esperar. Y si la nueva ya estaba en
	// caché, `load` no vuelve a dispararse: `complete` lo detecta.
	$effect(() => {
		void src;
		const el = imgEl;
		loaded = !!el?.complete && el.naturalWidth > 0;
		usedPlaceholder = false;
	});

	// Una miniatura igual a la imagen final no aporta nada (y haría parpadear).
	let usable = $derived(!!placeholderSrc && placeholderSrc !== src);
	let showPlaceholder = $derived(usable && !loaded);
	$effect(() => {
		if (showPlaceholder) usedPlaceholder = true;
	});
</script>

<!-- `{...rest}` va primero a propósito: así los atributos de abajo no pueden
     ser pisados por quien use el componente (sobre todo `onload`, del que
     depende el efecto). Un `onload` propio del llamador se encadena. -->
<img
	{...rest}
	bind:this={imgEl}
	{src}
	{alt}
	class="{className}{showPlaceholder ? '' : usedPlaceholder ? ' pi-reveal' : ''}"
	style={showPlaceholder
		? `background-image:url("${placeholderSrc}");background-size:cover;background-position:center;filter:blur(12px)`
		: undefined}
	onload={(e) => {
		loaded = true;
		onload?.(e);
	}}
/>

<style>
	.pi-reveal {
		animation: pi-unblur 400ms ease;
	}
	@keyframes pi-unblur {
		from {
			filter: blur(12px);
		}
		to {
			filter: blur(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pi-reveal {
			animation: none;
		}
	}
</style>
