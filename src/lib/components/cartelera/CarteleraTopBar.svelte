<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { resolve } from '$app/paths';

	// Minimal, no todo el SiteHeader del resto del sitio: esta vista es la
	// cara "premium" enfocada en elegir función, no en navegar el sitio -- el
	// mismo criterio que ya usa AMC en su propia pantalla de horarios. La
	// flecha reemplaza tanto al menú completo como a la barra "Selecciona tu
	// cine preferido" (esa selección ya vive en los chips de sede debajo).
	//
	// `resolve()` vive AQUÍ (no en el string que recibe como prop) porque la
	// regla de lint de navegación exige verlo literal en el sitio del href.
	let { back }: { back: { type: 'home' } | { type: 'sede'; sede: string | undefined } } = $props();

	// `sede` puede llegar `undefined` en el tipo de `$page.params` aunque en
	// este flujo siempre esté presente (la ruta [sede] ya no renderiza sin
	// ella -- el load() de la página devuelve 404 antes). Sin sede, mejor
	// caer al home que armar un link roto.
	let backHref = $derived(
		back.type === 'home' || !back.sede ? resolve('/') : resolve(`/cines/${back.sede}`)
	);
</script>

<header class="sticky top-0 z-40 w-full border-b border-zinc-800 bg-black">
	<div class="flex items-center gap-4 px-4 md:px-8 h-16">
		<a href={backHref} class="flex items-center justify-center size-10 rounded-full hover:bg-zinc-900 text-white transition-colors -ml-2" aria-label="Volver">
			<ArrowLeft class="size-6" />
		</a>
		<div class="h-6 w-px bg-zinc-800"></div>
		<span class="font-display text-2xl md:text-3xl font-black uppercase tracking-wide text-white">Cartelera</span>
	</div>
</header>
