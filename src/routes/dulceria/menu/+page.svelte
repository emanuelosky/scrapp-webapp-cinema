<script lang="ts">
	import { resolve } from '$app/paths';

	import Footer from '$lib/components/Footer.svelte';
	import SiteHeader from '$lib/components/navigation/SiteHeader.svelte';
	import ComboCard from '$lib/components/dulceria/ComboCard.svelte';
	import PriceRef from '$lib/components/dulceria/PriceRef.svelte';

	let { data } = $props();

	// Derivados de `data` y no copias en $state: si el load() vuelve a correr
	// (invalidación, o el catálogo por sede el día que exista), la carta se
	// actualiza sola en vez de quedarse con la versión que se pintó primero.
	let combos = $derived(data.combos);
	let menu = $derived(data.menu);

	// Los combos entran en la fila de anclas como una parada más: para quien
	// llega buscando "lo que ya está armado" son la primera categoría de la
	// carta, aunque en la página vivan en su propia sección.
	let secciones = $derived([
		...(combos.length > 0 ? [{ id: 'combos', nombre: 'Combos' }] : []),
		...menu.map((categoria) => ({ id: categoria.id, nombre: categoria.name }))
	]);

	let activa = $state('');
	let filaAnclas = $state<HTMLElement | null>(null);

	// Marca en la fila la sección que se está leyendo. La franja de observación
	// arranca por debajo del grupo pegajoso (cabecera del sitio + esta fila):
	// sin descontarlo, una categoría se daría por activa mientras todavía está
	// tapada por la barra.
	$effect(() => {
		const ids = secciones.map((seccion) => seccion.id);
		if (ids.length === 0) return;

		const visible: Record<string, boolean> = {};
		const observador = new IntersectionObserver(
			(entradas) => {
				for (const entrada of entradas) visible[entrada.target.id] = entrada.isIntersecting;
				// Con dos secciones dentro de la franja gana la de más arriba:
				// es la que el visitante tiene delante de los ojos. El orden lo
				// da `ids`, que es el de la página, no el de las notificaciones.
				activa = ids.find((id) => visible[id]) ?? activa;
			},
			{ rootMargin: '-160px 0px -65% 0px' }
		);

		for (const id of ids) {
			const elemento = document.getElementById(id);
			if (elemento) observador.observe(elemento);
		}

		return () => observador.disconnect();
	});

	// En móvil la fila no entra completa, así que el chip activo se trae solo.
	// `block: 'nearest'` es lo que impide que esto arrastre además el scroll
	// vertical de la página mientras el visitante baja leyendo.
	$effect(() => {
		if (!filaAnclas || !activa) return;

		const chip = filaAnclas.querySelector(`[data-seccion="${activa}"]`);
		chip?.scrollIntoView({
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
			block: 'nearest',
			inline: 'center'
		});
	});

	function numeroCategoria(indice: number) {
		return String(indice + 1).padStart(2, '0');
	}
</script>

<svelte:head>
	<title>CINEPIC | NUESTRO MENÚ</title>
</svelte:head>

{#snippet vacio(mensaje: string)}
	<div class="flex flex-col items-center gap-3 border-t border-zinc-800 px-6 py-20 text-center">
		<p class="text-[10px] font-black tracking-[0.3em] text-zinc-600 uppercase">Nada por ahora</p>
		<p class="max-w-md text-sm leading-relaxed text-zinc-600">{mensaje}</p>
	</div>
{/snippet}

<div class="flex min-h-screen flex-col bg-black font-sans text-zinc-50">
	<SiteHeader />

	<!-- Portada corta a propósito: esta página se abre para buscar algo
	     concreto, así que la lista tiene que asomar sin scrollear. Nada de
	     imagen de fondo: la única foto que vale acá es la del producto, y esa
	     ya la pone cada tarjeta de combo. -->
	<section class="mx-auto w-full max-w-7xl px-4 pt-14 pb-4 md:pt-20 lg:px-12">
		<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">Confitería</p>
		<h1
			class="mt-3 font-display text-6xl leading-[0.85] tracking-wide text-white uppercase md:text-8xl"
		>
			Nuestro <span
				class="bg-gradient-to-r from-goldenrose-300 to-goldenrose-700 bg-clip-text text-transparent"
				>menú</span
			>
		</h1>
		<div
			class="my-6 h-px w-2/3 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
			aria-hidden="true"
		></div>
		<p class="max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
			Cotufa recién hecha, algo para picar y con qué bajarlo. Elige un combo ya armado o pide suelto
			lo que de verdad te provoca.
		</p>
	</section>

	{#if secciones.length > 1}
		<!-- Salto entre categorías. Va pegajosa bajo la cabecera del sitio (96 px
		     en móvil, 104 px de md en adelante: esta ruta no lleva [sede], así
		     que el aviso de promoción nunca aparece encima y el alto no cambia). -->
		<nav
			bind:this={filaAnclas}
			aria-label="Categorías de la carta"
			class="sticky top-24 z-30 w-full border-y border-zinc-800 bg-black/85 backdrop-blur-md md:top-26"
		>
			<div class="mx-auto max-w-7xl px-4 lg:px-12">
				<ul
					class="flex [scrollbar-width:none] gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
				>
					{#each secciones as seccion (seccion.id)}
						<li class="shrink-0">
							<a
								href={`#${seccion.id}`}
								data-seccion={seccion.id}
								aria-current={activa === seccion.id ? 'location' : undefined}
								class="block rounded-full border px-4 py-2 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors {activa ===
								seccion.id
									? 'border-white bg-white text-black'
									: 'border-zinc-800 text-zinc-400 hover:border-white hover:text-white'}"
							>
								{seccion.nombre}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</nav>
	{/if}

	<!-- `isolate` crea contexto de apilamiento: sin el, el aura de hover de
	     ComboCard (z-[-1]) se pinta DETRAS del fondo negro de la pagina y no se
	     ve. En el home no pasa porque CombosSection ya vive dentro de un z-20. -->
	<section id="combos" class="isolate w-full scroll-mt-40 md:scroll-mt-44">
		<div class="mt-12 mb-8 w-full border-b border-zinc-800 py-8">
			<div class="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 md:px-8">
				<h2 class="text-3xl font-black tracking-tight text-white uppercase md:text-5xl">Combos</h2>
				<p class="mt-2 text-lg text-zinc-400">Ya pensados, ya armados, ya listos</p>
			</div>
		</div>

		<div class="mx-auto max-w-7xl px-4 lg:px-12">
			{#if combos.length > 0}
				<!-- Cada tarjeta lleva el slug como ancla para poder enlazarla de
				     afuera (/dulceria/menu#accion) sin pasar por una página propia
				     de combo, que hoy no existe. -->
				<div class="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
					{#each combos as combo, indice (combo.id)}
						<div id={combo.slug} class="scroll-mt-40 md:scroll-mt-44">
							<ComboCard {combo} eager={indice < 2} />
						</div>
					{/each}
				</div>
			{:else}
				{@render vacio(
					'Estamos actualizando los combos de la temporada. Mientras tanto, en la confitería te arman lo que quieras.'
				)}
			{/if}
		</div>
	</section>

	<section class="w-full">
		<div class="mt-16 mb-8 w-full border-b border-zinc-800 py-8">
			<div class="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 md:px-8">
				<h2 class="text-3xl font-black tracking-tight text-white uppercase md:text-5xl">El menú</h2>
				<p class="mt-2 text-lg text-zinc-400">Todo lo que sale del mostrador</p>
			</div>
		</div>

		<div class="mx-auto max-w-7xl px-4 lg:px-12">
			{#if menu.length > 0}
				{#each menu as categoria, indice (categoria.id)}
					<section id={categoria.id} class="scroll-mt-40 pt-14 first:pt-0 md:scroll-mt-44">
						<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">
							{numeroCategoria(indice)}
						</p>
						<h3
							class="mt-2 font-display text-4xl leading-none tracking-wide text-white uppercase md:text-5xl"
						>
							{categoria.name}
						</h3>
						{#if categoria.tagline}
							<p class="mt-2 text-base text-zinc-400">{categoria.tagline}</p>
						{/if}
						<div
							class="mt-6 h-px w-2/3 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
							aria-hidden="true"
						></div>

						{#if categoria.products.length > 0}
							<ul>
								{#each categoria.products as producto (producto.id)}
									<li
										class="grid grid-cols-1 gap-3 border-b border-zinc-900 py-6 last:border-0 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-10"
									>
										<div>
											<h4 class="text-base font-bold text-white md:text-lg">{producto.name}</h4>
											{#if producto.description}
												<p class="mt-1 max-w-prose text-sm leading-relaxed text-zinc-400">
													{producto.description}
												</p>
											{/if}
										</div>

										<!-- El precio del producto suelto es información secundaria: mismo
										     bloque REF que los combos, pero apagado y más chico, para que la
										     carta no compita con la vitrina de arriba. Cuando hay tamaños, el
										     precio suelto se calla: repite el del primero y confundiría. -->
										{#if producto.sizes?.length}
											<div class="flex flex-wrap items-end gap-x-8 gap-y-4 sm:justify-end">
												{#each producto.sizes as tamano (tamano.label)}
													<div class="sm:text-right">
														<p
															class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase"
														>
															{tamano.label}
														</p>
														<PriceRef muted value={tamano.price} class="mt-1 text-xl" />
													</div>
												{/each}
											</div>
										{:else}
											<div class="sm:text-right">
												<PriceRef muted value={producto.price} class="text-2xl" />
											</div>
										{/if}
									</li>
								{/each}
							</ul>
						{:else}
							<p class="mt-6 text-sm leading-relaxed text-zinc-600">
								Esta categoría todavía no tiene productos cargados.
							</p>
						{/if}
					</section>
				{/each}
			{:else}
				{@render vacio(
					'La carta completa está en camino. En el mostrador de la sede te cuentan todo lo que hay hoy.'
				)}
			{/if}
		</div>
	</section>

	<section class="mx-auto w-full max-w-7xl px-4 pt-20 pb-24 lg:px-12">
		<div class="flex flex-col items-center border-t border-zinc-800 px-6 py-16 text-center">
			<p class="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase">
				¿Nada te convence del todo?
			</p>
			<h2
				class="mt-3 font-display text-4xl leading-none tracking-wide text-white uppercase md:text-6xl"
			>
				Arma el tuyo
			</h2>
			<p class="mt-4 max-w-lg text-base leading-relaxed text-zinc-300">
				Elige la cotufa, la bebida y lo que quieras sumarle. El precio se arma contigo, paso a paso.
			</p>
			<a
				href={resolve('/dulceria/arma-tu-combo')}
				class="mt-8 rounded-full bg-white px-6 py-3 text-sm font-bold tracking-wider text-black uppercase transition-all hover:scale-105 hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
			>
				Arma tu combo
			</a>
		</div>
	</section>

	<Footer />
</div>
