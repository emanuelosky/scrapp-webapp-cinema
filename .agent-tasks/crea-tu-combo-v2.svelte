<script lang="ts">
	import { tick } from 'svelte';
	import CheckIcon from '@lucide/svelte/icons/check';

	import SiteHeader from '$lib/components/navigation/SiteHeader.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import PriceRef from '$lib/components/dulceria/PriceRef.svelte';
	import { formatPrice } from '$lib/utils/price';
	import type { PageData } from './$types';
	import type { ComboOption, ComboStep } from '$lib/types';

	let { data }: { data: PageData } = $props();

	// Derivado de `data` y no una copia en $state: si el load() vuelve a correr
	// (invalidación, cambio de catálogo), los pasos se actualizan solos.
	let pasos: ComboStep[] = $derived(data.pasos ?? []);

	/**
	 * Lo elegido, por paso: `{ [pasoId]: opcionId }`.
	 *
	 * Arranca VACÍO a propósito. Preseleccionar la primera opción de cada paso
	 * obligatorio haría que el visitante entre viendo un total que nadie pidió,
	 * casi siempre más alto que el mínimo real; y peor, lo dejaría creyendo que
	 * ya eligió. Mientras falte algo, el resumen lo dice.
	 */
	let elegidas = $state<Record<string, string>>({});

	let activa = $state('');
	let filaAnclas = $state<HTMLElement | null>(null);
	let isScrollingTo = false;
	let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

	// Marca en la barra pegajosa el paso visible actualmente
	$effect(() => {
		const ids = pasos.map((p) => `paso-${p.id}`);
		if (ids.length === 0) return;

		function actualizarPasoActivo() {
			if (isScrollingTo) return;

			// Solo forzar el último elemento si llegamos al tope físico absoluto del scroll (15px)
			const alFinal =
				window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 15;
			if (alFinal && ids.length > 0) {
				activa = ids[ids.length - 1];
				return;
			}

			// Línea de lectura/enfoque (justo bajo el header sticky: ~200px)
			const focusY = Math.min(220, window.innerHeight * 0.3);
			let pasoCandidato = ids[0];
			let menorDistancia = Infinity;

			for (const id of ids) {
				const el = document.getElementById(id);
				if (!el) continue;
				const rect = el.getBoundingClientRect();

				// Si la línea de foco pasa dentro de esta sección, es la activa indiscutible
				if (rect.top <= focusY && rect.bottom > focusY) {
					pasoCandidato = id;
					break;
				}

				// De respaldo: la sección más cercana a la línea de foco
				const dist = Math.abs(rect.top - focusY);
				if (dist < menorDistancia) {
					menorDistancia = dist;
					pasoCandidato = id;
				}
			}

			activa = pasoCandidato;
		}

		// Ejecutar al inicio y en cada evento de scroll
		actualizarPasoActivo();
		window.addEventListener('scroll', actualizarPasoActivo, { passive: true });
		window.addEventListener('resize', actualizarPasoActivo, { passive: true });

		return () => {
			window.removeEventListener('scroll', actualizarPasoActivo);
			window.removeEventListener('resize', actualizarPasoActivo);
			if (scrollTimeout) clearTimeout(scrollTimeout);
		};
	});

	// En pantallas pequeñas, centra automáticamente el chip del paso activo
	$effect(() => {
		if (!filaAnclas || !activa) return;

		const chip = filaAnclas.querySelector(`[data-paso="${activa}"]`);
		chip?.scrollIntoView({
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
			block: 'nearest',
			inline: 'center'
		});
	});

	function irAPaso(pasoId: string) {
		const pasoAnchorId = `paso-${pasoId}`;
		activa = pasoAnchorId;
		isScrollingTo = true;

		if (scrollTimeout) clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(() => {
			isScrollingTo = false;
		}, 450);

		const target = document.getElementById(pasoAnchorId);
		if (target) {
			target.scrollIntoView({
				behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
				block: 'start'
			});
		}
	}

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
	<title>CINEPIC | CREA TU COMBO</title>
</svelte:head>

<!-- El pb- de abajo es por la barra fija del móvil: sin él, la barra le come el
     final del pie de página. En escritorio no hay barra, así que no hace falta. -->
<div
	class="flex min-h-screen flex-col bg-black pb-[calc(8rem+env(safe-area-inset-bottom))] font-sans text-zinc-50 lg:pb-0"
>
	<SiteHeader />

	<!-- Header con imagen de fondo ambiental integrada y difuminada en los bordes -->
	<div class="relative w-full overflow-hidden border-b border-zinc-800 bg-black pt-14 pb-8 md:pt-20 md:pb-12">
		<!-- Imagen de fondo colocada a un extremo (derecha en desktop) -->
		<div
			class="pointer-events-none absolute inset-y-0 right-0 w-full overflow-hidden opacity-30 md:w-1/2 md:opacity-65 lg:w-5/12"
			aria-hidden="true"
		>
			<img
				src="/img/crea-combo/crea-tu-combo-hero.jpg"
				alt=""
				loading="lazy"
				decoding="async"
				class="h-full w-full object-cover object-center md:object-[center_30%]"
			/>
			<!-- Difuminados graduales en los 4 extremos para fundirse naturalmente en el fondo negro -->
			<div class="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
			<div class="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black to-transparent"></div>
			<div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent"></div>
			<div class="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black to-transparent"></div>
		</div>

		<div class="relative z-10 mx-auto flex max-w-7xl flex-col items-start justify-center px-4 md:px-8 lg:px-12">
			<p class="text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase">
				Mejora tu experiencia
			</p>
			<h1
				class="mt-2 font-display text-4xl leading-[0.9] tracking-wide text-white uppercase md:text-6xl lg:text-7xl"
			>
				CREA TU <span
					class="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-400 bg-clip-text text-transparent"
					>COMBO</span
				>
			</h1>
			<p class="mt-3 max-w-lg text-base leading-relaxed text-zinc-300 md:text-lg">
				Paso a paso, a tu manera. Selecciona las cotufas y bebidas que necesites, y acompáñalas con lo que más te gusta.
			</p>
		</div>
	</div>

	{#if pasos.length > 1}
		<!-- Barra interactiva con anclas a cada paso del armador -->
		<nav
			bind:this={filaAnclas}
			aria-label="Pasos de personalización de combo"
			class="sticky top-24 z-30 mb-8 w-full border-b border-zinc-800 bg-black/85 backdrop-blur-md md:top-26"
		>
			<div class="mx-auto max-w-7xl px-4 lg:px-12">
				<ul
					class="flex [scrollbar-width:none] gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
				>
					{#each pasos as paso, indice (paso.id)}
						{@const pasoAnchorId = `paso-${paso.id}`}
						{@const isActivo = activa === pasoAnchorId}
						{@const isSeleccionado = !!elegidas[paso.id]}
						<li class="shrink-0">
							<button
								type="button"
								onclick={() => irAPaso(paso.id)}
								data-paso={pasoAnchorId}
								aria-current={isActivo ? 'location' : undefined}
								class="flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-200 {isActivo
									? 'border-white bg-white text-black shadow-sm'
									: isSeleccionado
										? 'border-zinc-700 bg-zinc-900/80 text-zinc-200 hover:border-zinc-500'
										: 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'}"
							>
								{#if isSeleccionado}
									<span
										class="flex size-3.5 items-center justify-center rounded-full {isActivo
											? 'bg-black text-white'
											: 'bg-white text-black'}"
									>
										<CheckIcon class="size-2.5 stroke-[3]" />
									</span>
								{/if}
								<span>{paso.title}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</nav>
	{/if}

	<main class="mx-auto w-full max-w-7xl px-4 lg:px-12">
		<div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
			<div>
				{#each pasos as paso, indice (paso.id)}
					<!-- Un paso por bloque, separados por la línea fina: el borde hace
					     el trabajo de una tarjeta sin encerrar nada. -->
					<section
						id={`paso-${paso.id}`}
						class="scroll-mt-36 border-t border-zinc-900 py-8 first:border-t-0 first:pt-0 md:scroll-mt-40"
					>
						<fieldset class="w-full border-0 p-0">
							<legend class="w-full">
								<span class="block text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">
									{numeroPaso(indice)} · {paso.required ? 'Base del combo' : 'Complemento'}
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
							Muestra este resumen en nuestro módulo de <strong class="text-zinc-200">Pick-up Express</strong> al llegar a tu sede. Tu orden se preparará al instante tal como la personalizaste.
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
								Para continuar, selecciona: <span class="text-white"
									>{faltantes.map((paso) => paso.title).join(' y ')}</span
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
						Pendiente: {faltantes.map((paso) => paso.title).join(', ')}
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
