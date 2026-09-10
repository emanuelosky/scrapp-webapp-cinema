<script lang="ts">
	import { splitPrice } from '$lib/utils/price';

	// El bloque de precio de la señalética: REF pequeño, entero grande,
	// centavos volados. Todo escala desde el `font-size` del contenedor (las
	// medidas van en `em`), así que para cambiar el tamaño se le pasa una
	// clase de texto y las tres piezas se reacomodan solas.
	let {
		value,
		class: className = 'text-4xl',
		muted = false
	}: {
		value: number;
		class?: string;
		/** Para precios secundarios: mismo bloque, menos peso visual. */
		muted?: boolean;
	} = $props();

	let parts = $derived(splitPrice(value));
</script>

<span
	class="inline-flex items-start font-display leading-none {muted
		? 'text-zinc-400'
		: 'text-white'} {className}"
	aria-label="Precio de referencia {parts.whole},{parts.cents} dólares"
>
	<span aria-hidden="true" class="mt-[0.34em] mr-[0.08em] text-[0.42em] tracking-[0.08em]">REF</span
	>
	<span aria-hidden="true">{parts.whole}</span>
	<span aria-hidden="true" class="mt-[0.06em] text-[0.5em]">{parts.cents}</span>
</span>
