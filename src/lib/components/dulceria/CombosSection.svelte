<script lang="ts">
	import { resolve } from '$app/paths';
	import Autoplay from 'embla-carousel-autoplay';
	import * as Carousel from '$lib/components/ui/carousel';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
	import ProgressiveImage from '$lib/components/ui/ProgressiveImage.svelte';
	import ComboCard from './ComboCard.svelte';
	import { fotoSede } from '$lib/data/fotos-sede';
	import type { Combo } from '$lib/types';

	// La vitrina de combos del home de sede.
	//
	// Va DESPUÉS de los dos carruseles de películas, no entre ellos: "en
	// cartelera" y "próximos estrenos" son la misma idea contada dos veces, y
	// meter comida en el medio rompe esa lectura. Acá cierra la página, que es
	// donde tiene sentido comercial: ya decidiste venir, ahora decides con qué.
	//
	// La foto de ambiente no es relleno. En la de cada sede aparece la bandeja
	// CINEPIC, así que hace de puente entre "gente pasándola bien" y la lista
	// de productos. Sin ella esto sería una lista de precios.
	let {
		combos,
		sede,
		sedeName = '',
		isPaused = false
	}: {
		combos: Combo[];
		sede: string;
		sedeName?: string;
		isPaused?: boolean;
	} = $props();

	let api = $state<CarouselAPI>();
	let canScroll = $state(false);

	const plugin = Autoplay({ delay: 4500, stopOnInteraction: true, playOnInit: false });

	// Si hay pocos marcados como destacados, mejor mostrarlos todos que dejar
	// un carrusel de dos elementos.
	let destacados = $derived.by(() => {
		const marcados = combos.filter((c) => c.featured);
		return marcados.length >= 3 ? marcados : combos;
	});

	let foto = $derived(fotoSede(sede));

	$effect(() => {
		if (!api) return;
		const revisar = () => {
			if (!api) return;
			canScroll = api.canScrollNext() || api.canScrollPrev();
		};
		api.on('reInit', revisar);
		api.on('resize', revisar);
		revisar();
	});

	// El autoplay respeta que haya un modal abierto, igual que los carruseles
	// de película: si el visitante está mirando otra cosa, esto no se mueve.
	$effect(() => {
		if (!api) return;
		try {
			if (isPaused) api.plugins().autoplay?.stop();
			else api.plugins().autoplay?.play();
		} catch (e) {
			void e;
		}
	});
</script>

{#if combos.length > 0}
	<section id="combos" class="relative z-20 w-full bg-black">
		<div class="mb-8 mt-12 w-full border-b border-zinc-800 py-8">
			<div class="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 md:px-8">
				<h2 class="text-3xl font-black uppercase tracking-tight text-white md:text-5xl">
					Para acompañar
				</h2>
				<p class="mt-2 text-lg text-zinc-400">Nadie ve una película con las manos vacías</p>
			</div>
		</div>

		<div class="mx-auto max-w-7xl px-4 lg:px-12">
			<!-- La invitación: foto de la sede y qué se puede hacer. -->
			<div class="mb-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
				{#if foto}
					<div class="relative lg:col-span-4">
						<div
							class="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden lg:max-w-none"
						>
							<ProgressiveImage
								src={foto.full}
								placeholderSrc={foto.thumb}
								alt="Visitantes en {sedeName || 'nuestra sede'}"
								loading="lazy"
								class="h-full w-full object-cover"
							/>
							<div
								class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent"
								aria-hidden="true"
							></div>
							<div
								class="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-black to-transparent"
								aria-hidden="true"
							></div>
							<div
								class="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-black to-transparent"
								aria-hidden="true"
							></div>
						</div>
					</div>
				{/if}

				<div class="lg:col-span-8">
					{#if sedeName}
						<p class="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
							En {sedeName}
						</p>
					{/if}
					<h3
						class="mt-2 font-display text-4xl uppercase leading-none tracking-wide text-white md:text-5xl"
					>
						Combos que <span
							class="bg-gradient-to-r from-goldenrose-300 to-goldenrose-700 bg-clip-text text-transparent"
							>valen la función</span
						>
					</h3>
					<p class="mt-4 max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
						Cotufa recién hecha, algo para picar y con qué bajarlo. Elige uno ya armado o hazte el
						tuyo con lo que de verdad te provoca.
					</p>

					<div class="mt-6 flex flex-wrap items-center gap-3">
						<a
							href={resolve('/dulceria/arma-tu-combo')}
							class="rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-black transition-all hover:scale-105 hover:bg-zinc-200 active:scale-95"
						>
							Arma tu combo
						</a>
						<a
							href={resolve('/dulceria/menu')}
							class="rounded-full border border-zinc-700 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:border-white hover:bg-white hover:text-black"
						>
							Ver el menú
						</a>
					</div>
				</div>
			</div>
		</div>

		<div class="mx-auto mb-24 max-w-7xl px-4 lg:px-12">
			<div class="relative">
				<Carousel.Root
					plugins={[plugin]}
					opts={{ align: 'start', loop: false }}
					setApi={(a) => (api = a)}
					class="w-full"
				>
					<Carousel.Content class="-ml-4 py-4 md:-ml-6 {canScroll ? '' : 'justify-center'}">
						{#each destacados as combo, i (combo.id)}
							<Carousel.Item
								class="relative basis-[78%] pl-4 hover:z-50 sm:basis-[48%] md:basis-[36%] md:pl-6 lg:basis-[28%]"
							>
								<ComboCard {combo} href={resolve('/dulceria/menu')} eager={i < 2} />
							</Carousel.Item>
						{/each}
					</Carousel.Content>
				</Carousel.Root>

				{#if canScroll}
					<div
						class="pointer-events-none absolute inset-y-0 left-0 z-30 hidden w-12 bg-gradient-to-r from-black to-transparent md:block lg:w-24"
						aria-hidden="true"
					></div>
					<div
						class="pointer-events-none absolute inset-y-0 right-0 z-30 hidden w-12 bg-gradient-to-l from-black to-transparent md:block lg:w-24"
						aria-hidden="true"
					></div>

					<div
						class="pointer-events-none absolute inset-y-0 left-4 right-4 z-40 hidden justify-between md:flex lg:left-8 lg:right-8"
					>
						<button
							type="button"
							aria-label="Combos anteriores"
							class="group pointer-events-auto flex h-full w-20 cursor-pointer items-center justify-start pl-2 lg:w-24 lg:pl-4"
							onclick={() => {
								api?.scrollPrev();
								api?.plugins().autoplay?.stop();
							}}
						>
							<div
								class="flex h-12 w-12 -translate-x-2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white opacity-40 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 group-hover:translate-x-0 group-hover:scale-110 group-hover:bg-white group-hover:text-black group-hover:opacity-100 group-active:scale-95 lg:h-14 lg:w-14"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="size-6 lg:size-7"><path d="m15 18-6-6 6-6" /></svg
								>
							</div>
						</button>

						<button
							type="button"
							aria-label="Más combos"
							class="group pointer-events-auto flex h-full w-20 cursor-pointer items-center justify-end pr-2 lg:w-24 lg:pr-4"
							onclick={() => {
								api?.scrollNext();
								api?.plugins().autoplay?.stop();
							}}
						>
							<div
								class="flex h-12 w-12 translate-x-2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white opacity-40 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 group-hover:translate-x-0 group-hover:scale-110 group-hover:bg-white group-hover:text-black group-hover:opacity-100 group-active:scale-95 lg:h-14 lg:w-14"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="size-6 lg:size-7"><path d="m9 18 6-6-6-6" /></svg
								>
							</div>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</section>
{/if}
