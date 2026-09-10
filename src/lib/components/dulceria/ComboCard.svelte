<script lang="ts">
	import ProgressiveImage from '$lib/components/ui/ProgressiveImage.svelte';
	import PriceRef from './PriceRef.svelte';
	import { imageVariants } from '$lib/utils/images';
	import type { Combo } from '$lib/types';

	// La foto del combo tiene fondo negro puro, igual que la página. En vez de
	// encerrarla en una tarjeta con borde, se la deja "flotar": unos degradados
	// a negro en los bordes disuelven el recorte y el producto queda sobre la
	// página sin costura visible. Es el mismo recurso que usa el hero para el
	// banner, pero acá se hace con divs en vez de `mask-image` -- igual que en
	// los carruseles, porque la máscara recorta el sangrado vertical.
	//
	// Los degradados van sobre la imagen y no en ella: el arte original se
	// procesó limpio a propósito (`scripts/procesar-combos.py`), para poder
	// recomponerlo distinto en cada contexto.
	let {
		combo,
		href,
		eager = false
	}: {
		combo: Combo;
		/** Si se pasa, la tarjeta entera es un enlace. */
		href?: string;
		/** Para las primeras de la lista: sin carga diferida. */
		eager?: boolean;
	} = $props();

	let v = $derived(imageVariants(combo.image.full, combo.image));
</script>

{#snippet contenido()}
	<div class="relative">
		<!-- Aura: la propia foto, ampliada y desenfocada. Solo al pasar por
		     encima, y detrás de todo. -->
		<div
			class="pointer-events-none absolute -inset-4 z-[-1] opacity-0 transition-opacity duration-700 group-hover:opacity-25"
			aria-hidden="true"
		>
			<img
				src={v?.thumb ?? v?.full}
				alt=""
				loading="lazy"
				class="h-full w-full scale-110 object-cover blur-[28px]"
			/>
		</div>

		<div class="relative aspect-[5/6] w-full overflow-hidden">
			<ProgressiveImage
				src={v?.card ?? v?.full}
				placeholderSrc={v?.thumb}
				alt="Combo {combo.name}"
				loading={eager ? 'eager' : 'lazy'}
				class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
			/>
			<!-- Disolución hacia el negro de la página, por los cuatro lados. -->
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

		<!-- El texto arranca solapado sobre la base de la foto, que ya está en
		     negro: así el bloque se lee como una sola pieza y no como una
		     imagen con una ficha debajo. -->
		<div class="relative -mt-8 px-1">
			<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">Combo</p>
			<h3
				class="mt-1 font-display text-3xl leading-none tracking-wide text-white uppercase md:text-4xl"
			>
				{combo.name}
			</h3>

			<div
				class="my-3 h-px w-2/3 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
				aria-hidden="true"
			></div>

			<ul class="space-y-1 text-sm leading-snug text-zinc-300">
				{#each combo.items as item (item)}
					<li>{item}</li>
				{/each}
			</ul>

			{#if combo.addons?.length}
				<p class="mt-3 text-xs leading-snug text-zinc-500">
					<span class="font-bold text-zinc-400 italic">Agrégale a tu experiencia:</span>
					{combo.addons.join(', ')}
				</p>
			{/if}

			<div class="mt-4">
				<PriceRef value={combo.price} class="text-4xl md:text-5xl" />
			</div>
		</div>
	</div>
{/snippet}

<!-- `href` llega ya pasado por resolve() desde quien monta la tarjeta: la regla
     no puede comprobarlo a través de una prop. Resolverlo aquí adentro ataría la
     tarjeta a una ruta fija, y va a necesitar apuntar a la ficha del combo
     cuando esa página exista. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if href}
	<a
		{href}
		class="group block focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
	>
		{@render contenido()}
	</a>
{:else}
	<article class="group block">
		{@render contenido()}
	</article>
{/if}
<!-- eslint-enable svelte/no-navigation-without-resolve -->
