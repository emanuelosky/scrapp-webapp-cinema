<script lang="ts">
	import { tick } from 'svelte';

	import SiteHeader from '$lib/components/navigation/SiteHeader.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import PriceRef from '$lib/components/dulceria/PriceRef.svelte';
	import { formatPrice } from '$lib/utils/price';
	import type { ComboOption, ComboStep } from '$lib/types';

	let { data } = $props();

	// Derivado de `data` y no una copia en $state: si el load() vuelve a correr
	// (invalidación, cambio de catálogo), los pasos se actualizan solos.
	let pasos = $derived(data.pasos);

	/**
	 * Lo elegido, por paso: `{ [pasoId]: opcionId }`.
	 *
	 * Arranca VACÍO a propósito. Preseleccionar la primera opción de cada paso
	 * obligatorio haría que el visitante entre viendo un total que nadie pidió,
	 * casi siempre más alto que el mínimo real; y peor, lo dejaría creyendo que
	 * ya eligió. Mientras falte algo, el resumen lo dice.
	 */
	let elegidas = $state<Record<string, string>>({});

	/** El botón final no compra: destapa el pedido armado. Ver el bloque #tu-combo. */
	let revelado = $state(false);
	let panelResumen = $state<HTMLElement | null>(null);

	// Las líneas del combo, en el orden de los pasos (no en el orden en que el
	// visitante fue tocando): así el resumen se lee igual que la página.
	let lineas = $derived.by(() => {
		const out: { paso: ComboStep; opcion: ComboOption }[] = [];
		for (const paso of pasos) {
			const opcion = paso.options.find((o) => o.id === elegidas[paso.id]);
			if (opcion) out.push({ paso, opcion });
		}
		return out;
	});

	let total = $derived(lineas.reduce((suma, linea) => suma + linea.opcion.price, 0));

	let faltantes = $derived(
		pasos.filter((paso) => paso.required && paso.options.length > 0 && !elegidas[paso.id])
	);
	// Sin nada elegido no hay combo, aunque no falte ningun paso obligatorio:
	// con la lista de pasos vacia (o con todos opcionales) el total daria
	// 0,00 y la pagina lo presentaria como un pedido valido.
	let completo = $derived(faltantes.length === 0 && lineas.length > 0);

	// El piso real del armador: la opción más barata de cada paso obligatorio.
	// Se muestra mientras el total todavía no significa nada, para que el 0.00
	// del principio no se lea como "esto es gratis".
	let minimo = $derived(
		pasos.reduce((suma, paso) => {
			if (!paso.required || paso.options.length === 0) return suma;
			return suma + Math.min(...paso.options.map((o) => o.price));
		}, 0)
	);

	// El pedido destapado se esconde solo si el combo deja de estar completo
	// (quitaron algo obligatorio): mostrar un resumen incompleto sería peor que
	// no mostrar ninguno.
	let mostrarPedido = $derived(revelado && completo);

	function alternar(paso: ComboStep, opcionId: string) {
		if (elegidas[paso.id] === opcionId) {
			// Volver a tocar lo elegido lo quita, pero solo donde vaciar es una
			// respuesta válida: en un paso obligatorio dejaría el combo roto sin
			// que el visitante lo haya pedido, así que ahí el toque no hace nada.
			if (!paso.required) delete elegidas[paso.id];
			return;
		}
		elegidas[paso.id] = opcionId;
	}

	async function verMiCombo() {
		revelado = true;
		await tick();
		// Mover el foco al panel, no solo la vista: el scroll no arrastra el
		// foco, y este boton no hace ninguna otra cosa.
		panelResumen?.focus({ preventScroll: true });
		panelResumen?.scrollIntoView({
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
			block: 'start'
		});
	}

	function numeroPaso(indice: number) {
		return String(indice + 1).padStart(2, '0');
	}
</script>

<svelte:head>
	<title>CINEPIC | ARMA TU COMBO</title>
</svelte:head>

<!-- El pb- de abajo es por la barra fija del móvil: sin él, la barra le come el
     final del pie de página. En escritorio no hay barra, así que no hace falta. -->
<div
	class="flex min-h-screen flex-col bg-black pb-[calc(8rem+env(safe-area-inset-bottom))] font-sans text-zinc-50 lg:pb-0"
>
	<SiteHeader />

	<div class="mt-12 mb-8 w-full border-b border-zinc-800 py-8">
		<div class="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 md:px-8">
			<h1 class="text-3xl font-black tracking-tight text-white uppercase md:text-5xl">
				ARMA TU COMBO
			</h1>
			<p class="mt-2 text-lg text-zinc-400">Paso por paso, a tu manera</p>
		</div>
	</div>

	<main class="mx-auto w-full max-w-7xl px-4 lg:px-12">
		<div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
			<div>
				{#each pasos as paso, indice (paso.id)}
					<!-- Un paso por bloque, separados por la línea fina: el borde hace
					     el trabajo de una tarjeta sin encerrar nada. -->
					<section class="border-t border-zinc-900 py-8 first:border-t-0 first:pt-0">
						<fieldset class="w-full border-0 p-0">
							<legend class="w-full">
								<span class="block text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">
									{numeroPaso(indice)} · {paso.required ? 'Obligatorio' : 'Opcional'}
								</span>
								<span
									class="mt-2 block font-display text-3xl leading-none tracking-wide text-white uppercase md:text-4xl"
								>
									{paso.title}
								</span>
								{#if paso.hint}
									<span class="mt-2 block text-sm text-zinc-400">{paso.hint}</span>
								{/if}
							</legend>

							<div class="mt-5 flex flex-wrap gap-3">
								{#each paso.options as opcion (opcion.id)}
									{@const elegida = elegidas[paso.id] === opcion.id}
									<!-- Botón de dos estados en vez de radio nativo: en los pasos
									     opcionales el visitante tiene que poder DESmarcar, y un radio
									     no se desmarca. `aria-pressed` dice el estado sin mentir sobre
									     el control. -->
									<button
										type="button"
										aria-pressed={elegida}
										onclick={() => alternar(paso, opcion.id)}
										class="flex items-baseline gap-2.5 rounded-full border px-5 py-3 text-sm font-bold tracking-wider uppercase transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 {elegida
											? 'border-white bg-white text-black'
											: 'border-zinc-700 text-white hover:border-white hover:bg-white hover:text-black'}"
									>
										<span>{opcion.name}</span>
										<span
											class="font-display text-base tracking-wide {elegida
												? 'text-zinc-600'
												: 'text-zinc-500'}"
										>
											{opcion.price === 0 ? 'Incluido' : `+${formatPrice(opcion.price)}`}
										</span>
									</button>
								{/each}
							</div>
						</fieldset>
					</section>
				{/each}

				{#if mostrarPedido}
					<!-- ACÁ VA A ENCHUFARSE EL CARRITO cuando exista. Hoy la webapp no
					     vende confitería (`$lib/api` todavía devuelve la maqueta y no hay
					     ninguna ruta de compra para estos productos), así que el botón
					     destapa el pedido y nada más: prometer "comprar" sería inventarle
					     al visitante un flujo que no existe. Cuando haya carrito, `lineas`
					     ya tiene los artículos y este bloque pasa a ser el paso previo a
					     agregarlos. -->
					<section
						bind:this={panelResumen}
						id="tu-combo"
						tabindex="-1"
						class="mt-4 mb-10 scroll-mt-28 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md motion-safe:animate-in motion-safe:fade-in md:p-8"
					>
						<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">Tu combo</p>

						<ul class="mt-4 divide-y divide-zinc-800">
							{#each lineas as linea (linea.paso.id)}
								<li class="flex items-center justify-between gap-4 py-3">
									<div class="min-w-0">
										<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">
											{linea.paso.title}
										</p>
										<p class="mt-1 truncate text-base text-zinc-100">{linea.opcion.name}</p>
									</div>
									<PriceRef value={linea.opcion.price} class="text-xl" muted />
								</li>
							{/each}
						</ul>

						<div
							class="my-5 h-px w-2/3 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
							aria-hidden="true"
						></div>

						<div class="flex items-end justify-between gap-4">
							<span class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">
								Total
							</span>
							<PriceRef value={total} class="text-5xl" />
						</div>

						<p class="mt-6 text-sm leading-relaxed text-zinc-400">
							Todavía no vendemos confitería por la web, así que esto no es una compra. Pide tu
							combo tal cual en la confitería del cine (puedes mostrar esta pantalla) y te lo arman
							igualito.
						</p>
					</section>
				{/if}
			</div>

			<!-- Resumen pegajoso de escritorio. En móvil no se muestra: allá el
			     mismo total vive en la barra fija de abajo. -->
			<aside class="hidden lg:block">
				<div class="lg:sticky lg:top-26">
					<div class="border-t border-zinc-800 pt-6">
						<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">Tu total</p>

						<div class="mt-3">
							<PriceRef value={total} class="text-6xl" />
						</div>

						{#if lineas.length > 0}
							<ul class="mt-5 space-y-2 text-sm text-zinc-300">
								{#each lineas as linea (linea.paso.id)}
									<li class="flex items-baseline justify-between gap-3">
										<span class="min-w-0 truncate">{linea.opcion.name}</span>
										<span class="shrink-0 font-display text-base tracking-wide text-zinc-500">
											{formatPrice(linea.opcion.price)}
										</span>
									</li>
								{/each}
							</ul>
						{/if}

						<div
							class="my-6 h-px w-2/3 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
							aria-hidden="true"
						></div>

						{#if completo}
							<p class="text-sm text-zinc-400">Tu combo está listo.</p>
						{:else}
							<p id="faltantes-escritorio" class="text-sm text-zinc-400">
								Te falta elegir: <span class="text-white"
									>{faltantes.map((paso) => paso.title).join(', ')}</span
								>.
							</p>
							<p class="mt-2 text-xs text-zinc-500">
								El más económico arranca en REF {formatPrice(minimo)}.
							</p>
						{/if}

						<button
							type="button"
							onclick={verMiCombo}
							disabled={!completo}
							aria-describedby={completo ? undefined : 'faltantes-escritorio'}
							aria-expanded={mostrarPedido}
							aria-controls="tu-combo"
							class="mt-6 w-full rounded-full bg-white px-6 py-3 text-sm font-bold tracking-wider text-black uppercase transition-all hover:scale-105 hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:hover:scale-100 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
						>
							Ver mi combo
						</button>
					</div>
				</div>
			</aside>
		</div>
	</main>

	<!-- Barra fija de móvil: el mismo total y el mismo botón que la columna de
	     escritorio, sin repetir el detalle (para eso está el pedido destapado). -->
	<div
		class="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
	>
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
			<div class="min-w-0">
				<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">Tu total</p>
				<PriceRef value={total} class="text-3xl" />
				{#if !completo && minimo > 0}
					<p class="mt-0.5 text-[11px] text-zinc-500">Desde REF {formatPrice(minimo)}</p>
				{/if}
			</div>

			<div class="flex min-w-0 flex-col items-end gap-1">
				{#if !completo}
					<p id="faltantes-movil" class="truncate text-[11px] text-zinc-400">
						Falta: {faltantes.map((paso) => paso.title).join(', ')}
					</p>
				{/if}
				<button
					type="button"
					onclick={verMiCombo}
					disabled={!completo}
					aria-describedby={completo ? undefined : 'faltantes-movil'}
					aria-expanded={mostrarPedido}
					aria-controls="tu-combo"
					class="rounded-full bg-white px-6 py-3 text-sm font-bold tracking-wider text-black uppercase transition-all hover:scale-105 hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:hover:scale-100 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
				>
					Ver mi combo
				</button>
			</div>
		</div>
	</div>

	<Footer />
</div>
