<script lang="ts">
	import { resolve } from '$app/paths';

	import SiteHeader from '$lib/components/navigation/SiteHeader.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ProgressiveImage from '$lib/components/ui/ProgressiveImage.svelte';
	import PriceRef from '$lib/components/dulceria/PriceRef.svelte';
	import { imageVariants } from '$lib/utils/images';
	import type { Promocion } from '$lib/types';

	let { data } = $props();

	// Derivados de `data` y no copias en $state: si el load() vuelve a correr
	// (invalidación, o el catálogo por sede el día que exista), los dos bloques
	// se rearman solos en vez de quedarse con lo que se pintó primero.
	let promociones = $derived(data.promociones.filter((p) => p.kind === 'promocion'));
	let coleccionables = $derived(data.promociones.filter((p) => p.kind === 'coleccionable'));
	let sinNada = $derived(promociones.length === 0 && coleccionables.length === 0);

	/**
	 * Cuál tarjeta de un bloque ocupa el ancho doble.
	 *
	 * La rejilla es de dos columnas, así que destacar la primera solo cuadra
	 * cuando el bloque tiene un número impar de tarjetas: con tres, la ancha
	 * arriba y dos abajo cierran la cuadrícula; con dos, dejaría media fila
	 * vacía y la sección se leería como si faltara algo. Con número par van
	 * todas del mismo tamaño, que se ve deliberado y no incompleto.
	 */
	function destacada(indice: number, total: number) {
		return indice === 0 && total % 2 === 1;
	}

	/**
	 * El contraste de tamaño es lo único que sostiene esta página: no hay arte
	 * para casi ninguna tarjeta. Sin foto, el título ES la ilustración y crece
	 * hasta donde aguante; con foto se achica, porque ahí la imagen ya carga
	 * con el peso visual y dos elementos gritando se pelean. La tarjeta ancha
	 * sube un escalón en los dos casos.
	 */
	function claseTitulo(conFoto: boolean, ancha: boolean) {
		if (conFoto) return ancha ? 'text-4xl md:text-6xl' : 'text-3xl md:text-4xl';
		return ancha ? 'text-5xl md:text-8xl' : 'text-4xl md:text-6xl';
	}
</script>

<svelte:head>
	<title>CINEPIC | PROMOCIONES Y COLECCIONABLES</title>
</svelte:head>

{#snippet tarjeta(item: Promocion, numero: string, ancha: boolean)}
	{@const v = imageVariants(item.image?.full, item.image)}
	<!-- Sin recuadro: una línea arriba y el contenido colgando de ella. Una caja
	     gris alrededor de un texto sin foto se ve como un hueco esperando una
	     imagen que no va a llegar; la línea, en cambio, ordena la rejilla sin
	     prometer nada. -->
	<article class="flex flex-col border-t border-zinc-800 pt-6 {ancha ? 'md:col-span-2' : ''}">
		<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">
			{numero} — {item.kind === 'promocion' ? 'Promoción' : 'Coleccionable'}
		</p>

		{#if v}
			<!-- Las fotos vienen con fondo negro puro, igual que la página, así que
			     en vez de encerrarlas se las disuelve por los cuatro lados con
			     degradados al negro (divs encima, no mask-image: la máscara recorta
			     el sangrado). El título entra pisando la base ya apagada, para que
			     foto y texto se lean como una sola pieza. -->
			<div
				class="relative mt-6 w-full overflow-hidden {ancha
					? 'aspect-[4/3] md:aspect-[21/9]'
					: 'aspect-[4/3]'}"
			>
				<ProgressiveImage
					src={v.card ?? v.full}
					placeholderSrc={v.thumb}
					alt={item.title}
					loading="lazy"
					class="h-full w-full object-cover"
				/>
				<div
					class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-black/70 to-transparent"
					aria-hidden="true"
				></div>
				<div
					class="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-black to-transparent"
					aria-hidden="true"
				></div>
				<div
					class="pointer-events-none absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-black to-transparent"
					aria-hidden="true"
				></div>
				<div
					class="pointer-events-none absolute inset-x-0 top-0 h-1/6 bg-gradient-to-b from-black to-transparent"
					aria-hidden="true"
				></div>
			</div>
		{/if}

		<h3
			class="font-display leading-[0.85] tracking-wide text-white uppercase {claseTitulo(
				!!v,
				ancha
			)} {v ? '-mt-4' : 'mt-4'}"
		>
			{item.title}
		</h3>

		<div
			class="my-5 h-px w-2/3 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
			aria-hidden="true"
		></div>

		<p class="max-w-prose text-sm leading-relaxed text-zinc-300 {ancha ? 'md:text-lg' : ''}">
			{item.description}
		</p>

		{#if item.price !== undefined || item.terms}
			<!-- `mt-auto` alinea los precios abajo entre las tarjetas de una misma
			     fila, aunque las descripciones tengan largos distintos. -->
			<div class="mt-auto pt-6">
				{#if item.price !== undefined}
					<PriceRef
						value={item.price}
						class={ancha ? 'text-4xl md:text-6xl' : 'text-3xl md:text-4xl'}
					/>
				{/if}

				{#if item.terms}
					<p class="mt-3 max-w-prose text-[11px] leading-relaxed text-zinc-400">
						{item.terms}
					</p>
				{/if}
			</div>
		{/if}
	</article>
{/snippet}

{#snippet bloque(items: Promocion[], titulo: string, subtitulo: string)}
	<section class="w-full">
		<div class="mt-12 mb-8 w-full border-b border-zinc-800 py-8">
			<div class="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 md:px-8">
				<h2 class="text-3xl font-black tracking-tight text-white uppercase md:text-5xl">
					{titulo}
				</h2>
				<p class="mt-2 text-lg text-zinc-400">{subtitulo}</p>
			</div>
		</div>

		<div class="mx-auto max-w-7xl px-4 lg:px-12">
			<div class="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2">
				{#each items as item, indice (item.id)}
					{@render tarjeta(
						item,
						String(indice + 1).padStart(2, '0'),
						destacada(indice, items.length)
					)}
				{/each}
			</div>
		</div>
	</section>
{/snippet}

<div class="flex min-h-screen flex-col bg-black font-sans text-zinc-50">
	<SiteHeader />

	<!-- Portada corta: quien entra acá viene a ver la lista, no a leer una
	     presentación. Sin imagen de fondo tampoco, por lo mismo que las
	     tarjetas: no hay arte, y un fondo genérico lo delataría. -->
	<section class="mx-auto w-full max-w-7xl px-4 pt-14 pb-4 md:pt-20 lg:px-12">
		<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">Lo que hay ahora</p>
		<h1
			class="mt-3 font-display text-6xl leading-[0.85] tracking-wide text-white uppercase md:text-8xl"
		>
			Promociones y <span
				class="bg-gradient-to-r from-goldenrose-300 to-goldenrose-700 bg-clip-text text-transparent"
				>coleccionables</span
			>
		</h1>
		<div
			class="my-6 h-px w-2/3 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
			aria-hidden="true"
		></div>
		<p class="max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
			Aquí van las dos cosas: lo que te baja el precio cuando vienes al cine y lo que te puedes
			llevar a casa. Todo lo que está vigente, en una sola página.
		</p>
	</section>

	{#if sinNada}
		<section class="mx-auto w-full max-w-7xl px-4 pt-10 pb-24 lg:px-12">
			<div class="flex flex-col items-center border-t border-zinc-800 px-6 py-20 text-center">
				<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">
					Nada vigente por ahora
				</p>
				<h2
					class="mt-3 font-display text-4xl leading-none tracking-wide text-white uppercase md:text-6xl"
				>
					Vuelve en unos días
				</h2>
				<p class="mt-4 max-w-lg text-base leading-relaxed text-zinc-300">
					En este momento no hay ninguna promoción ni coleccionable en curso. Cuando entre algo
					nuevo, lo vas a ver aquí de primero.
				</p>
				<a
					href={resolve('/dulceria/menu')}
					class="mt-8 rounded-full bg-white px-6 py-3 text-sm font-bold tracking-wider text-black uppercase transition-all hover:scale-105 hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
				>
					Ver el menú
				</a>
			</div>
		</section>
	{:else}
		{#if promociones.length > 0}
			{@render bloque(promociones, 'Promociones', 'Lo que te sale más barato')}
		{/if}

		{#if coleccionables.length > 0}
			{@render bloque(coleccionables, 'Coleccionables', 'Para llevarte el cine a casa')}
		{/if}

		<section class="mx-auto w-full max-w-7xl px-4 pt-20 pb-24 lg:px-12">
			<div class="flex flex-col items-center border-t border-zinc-800 px-6 py-14 text-center">
				<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">
					Todo esto se pide en la confitería
				</p>
				<a
					href={resolve('/dulceria/menu')}
					class="mt-6 rounded-full border border-zinc-700 px-6 py-3 text-sm font-bold tracking-wider text-white uppercase transition-all hover:border-white hover:bg-white hover:text-black focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none motion-reduce:transition-none"
				>
					Ver el menú
				</a>
			</div>
		</section>
	{/if}

	<Footer />
</div>
