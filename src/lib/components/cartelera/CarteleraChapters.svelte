<script lang="ts">
	import { untrack } from 'svelte';
	import { animate, utils } from 'animejs';
	import type { Movie } from '$lib/types';
	import CarteleraChapter, { type ChapterFocusGeo } from './CarteleraChapter.svelte';
	import { PEEK } from './carteleraLayout';

	// Snap de página (scroll-snap-type en <html>, el elemento que realmente
	// hace scroll -- en un div sin overflow es un no-op). APAGADO por
	// defecto: con rueda de mouse en escritorio, cada tick (~100px) contra
	// tarjetas de pantalla completa hacía que el navegador devolviera el
	// scroll a la misma tarjeta y se sentía "pegado" aunque el rendimiento
	// fuera bueno. La animación de descarte ya marca el paso de bloque en
	// bloque sin necesitarlo. Poner en `true` para compararlo (`proximity`,
	// nunca `mandatory`: mandatory dejaría inalcanzables el carrusel de
	// Próximamente y el footer).
	const CARTELERA_SNAP: boolean = false;

	let {
		movies,
		sede,
		selectedDateStr,
		onPlayTrailer,
		onMoreInfo,
		headerHeight = 0,
		ambientPaused = false,
		emptyMessage = 'No hay funciones para este filtro.'
	}: {
		movies: Movie[];
		sede?: string;
		selectedDateStr?: string;
		onPlayTrailer: (movie: Movie) => void;
		onMoreInfo: (movie: Movie) => void;
		/** Alto real (px) del grupo sticky de la página -- ver CarteleraChapter. */
		headerHeight?: number;
		/** Pausa el clip ambiental móvil mientras un diálogo tapa la página. */
		ambientPaused?: boolean;
		emptyMessage?: string;
	} = $props();

	$effect(() => {
		if (!CARTELERA_SNAP) return;
		const root = document.documentElement;
		const previous = root.style.scrollSnapType;
		root.style.scrollSnapType = 'y proximity';
		return () => {
			root.style.scrollSnapType = previous;
		};
	});

	// Contador compartido, solo escritorio (lg+): un único número gigante
	// anclado a la esquina inferior del BANNER de la tarjeta enfocada -- a la
	// izquierda cuando el banner va a la izquierda, a la derecha cuando va a
	// la derecha (las tarjetas alternan). Cuando cambia la tarjeta enfocada,
	// los dígitos ruedan como un odómetro (el viejo sube y se va, el nuevo
	// entra desde abajo) y el cambio de lado/altura ocurre justo mientras
	// están invisibles: se ve salir por un lado y entrar por el otro. En
	// móvil/tablet el contador sigue en línea dentro de la ficha (la tarjeta
	// lo oculta con lg:hidden).
	let activeIndex = $state(0);
	let activeGeo = $state<ChapterFocusGeo>({ side: 'left', mediaBottom: null });
	let shown = $state(0);
	let placement = $state<ChapterFocusGeo>({ side: 'left', mediaBottom: null });
	let digitsEl = $state<HTMLSpanElement | null>(null);
	let seq = 0;

	$effect(() => {
		const target = activeIndex;
		const geo = activeGeo;
		const el = digitsEl;
		untrack(() => {
			if (!el || target === shown) {
				placement = geo;
				return;
			}
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				shown = target;
				placement = geo;
				return;
			}
			const dir = target > shown ? 1 : -1;
			const mine = ++seq;
			utils.remove(el);
			animate(el, {
				translateY: ['0%', `${-100 * dir}%`],
				opacity: [1, 0],
				duration: 220,
				ease: 'inQuad'
			}).then(() => {
				// Si llegó otro cambio mientras salía, ese ya tomó el relevo.
				if (mine !== seq) return;
				shown = target;
				placement = geo;
				animate(el, {
					translateY: [`${100 * dir}%`, '0%'],
					opacity: [0, 1],
					duration: 420,
					ease: 'outExpo'
				});
			});
		});
	});

	let shownLabel = $derived(String(Math.min(shown, Math.max(0, movies.length - 1)) + 1).padStart(2, '0'));
	let totalLabel = $derived(String(movies.length).padStart(2, '0'));

	// Borde inferior de los dígitos: 24px por encima del borde inferior del
	// banner de la tarjeta enfocada, tal como queda esa tarjeta en reposo
	// (mediaBottom es relativo al tope de la tarjeta; en reposo ese tope está
	// en headerHeight). Con tope: nunca por debajo de la franja de peek, por
	// si una ficha muy larga estiró el banner más allá de la pantalla.
	let counterTop = $derived(
		placement.mediaBottom === null
			? `calc(100svh - ${PEEK + 28}px)`
			: `min(${headerHeight + placement.mediaBottom - 24}px, calc(100svh - ${PEEK + 28}px))`
	);
</script>

{#if movies.length > 0}
	<div class="relative">
		<!-- Sticky con alto 0 al inicio del bloque: se queda pegado mientras
		     las tarjetas estén en pantalla y se va con ellas al llegar a
		     Próximamente. Los dígitos cuelgan hacia arriba (absolute bottom-0).
		     mix-blend-difference los mantiene legibles tanto sobre negro como
		     sobre un banner claro. -->
		<div class="pointer-events-none sticky z-20 hidden h-0 lg:block" style="top: {counterTop};" aria-hidden="true">
			<div class="absolute bottom-0 flex items-end gap-3 mix-blend-difference {placement.side === 'right' ? 'right-6 xl:right-10' : 'left-6 xl:left-10'}">
				<span class="cartelera-counter relative block overflow-hidden font-display text-[6.5rem] font-black leading-none xl:text-[8rem]" style="height: 1em;">
					<span bind:this={digitsEl} class="block will-change-transform">{shownLabel}</span>
				</span>
				<span class="mb-3 font-mono text-sm tracking-widest text-white/60">/ {totalLabel}</span>
			</div>
		</div>

		{#each movies as movie, i (movie.id)}
			<CarteleraChapter
				{movie}
				index={i}
				total={movies.length}
				{sede}
				{selectedDateStr}
				{headerHeight}
				{ambientPaused}
				{onPlayTrailer}
				{onMoreInfo}
				onFocus={(i, geo) => {
					activeIndex = i;
					activeGeo = geo;
				}}
			/>
		{/each}
	</div>
{:else}
	<p class="border-t border-zinc-900 py-20 text-center text-sm font-bold uppercase tracking-widest text-zinc-500">{emptyMessage}</p>
{/if}

<style>
	/* Solo contorno: con difference, el relleno transparente no aporta y el
	   trazo blanco se invierte solo donde hay imagen clara debajo. */
	.cartelera-counter {
		-webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.75);
		color: transparent;
	}
</style>
