<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	let status = $derived($page.status);
	let message = $derived($page.error?.message ?? 'Algo salió mal en nuestros servidores.');

	const frases404 = [
		'«Toto, tengo la sensación de que ya no estamos en la cartelera.»',
		'«¿Me estás hablando a mí? Porque aquí no hay ninguna página.»',
		'«Estos no son los enlaces que estás buscando.»',
		'«¡Que la Fuerza te acompañe! Porque esta página ya no existe.»'
	];

	const frases500 = [
		'«Houston, tenemos un problema.»',
		'«Siempre nos quedará París... pero no este servidor.»',
		'«Voy a hacerle una oferta que no podrá rechazar... arreglar este error.»'
	];

	const frasesGenerales = [
		'«Hasta la vista, página.»',
		'«Volveré... cuando el enlace funcione.»',
		'«Francamente, querida, me importa un bledo este error.»'
	];

	// Título predeterminado para el renderizado del servidor (evita errores de hidratación)
	let tituloDefault = $derived(
		status === 404 ? frases404[0] : status >= 500 ? frases500[0] : frasesGenerales[0]
	);

	// Estado reactivo que se llenará con la frase aleatoria en el cliente
	let tituloCine = $state('');

	$effect(() => {
		// Usamos el tiempo en bloques de 5 minutos (300,000 ms).
		// Así, si el usuario recarga frenéticamente, verá la misma frase.
		// Solo rotará si pasa a un nuevo bloque de 5 minutos.
		const timeSeed = Math.floor(Date.now() / (1000 * 60 * 5));

		if (status === 404) {
			tituloCine = frases404[timeSeed % frases404.length];
		} else if (status >= 500) {
			tituloCine = frases500[timeSeed % frases500.length];
		} else {
			tituloCine = frasesGenerales[timeSeed % frasesGenerales.length];
		}
	});
</script>

<svelte:head>
	<title>CINEPIC | Error {status}</title>
</svelte:head>

<!-- Contenedor principal con relative para atrapar la marca de agua -->
<div class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6 text-center font-sans text-zinc-50">
	
	<!-- Marca de agua gigante con el código de error en el fondo (muy tenue) -->
	<div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
		<span class="font-display text-[15rem] font-black leading-none md:text-[30rem] tracking-tighter">{status}</span>
	</div>

	<!-- Contenido real al frente -->
	<div class="relative z-10 flex flex-col items-center gap-10">
		<img src="/logo.svg" alt="Cinepic" class="h-10 w-auto object-contain opacity-90" />

		<div class="flex flex-col items-center gap-4">
			<h1 class="max-w-3xl font-display text-2xl tracking-wide text-white md:text-3xl leading-tight">
				{tituloCine || tituloDefault}
			</h1>
			<p class="max-w-md text-base leading-relaxed text-zinc-400">
				{#if status === 404}
					La página que buscas desapareció como si le hubieran hecho el chasquido de Thanos. Puede que el enlace esté roto o haya sido movido.
				{:else}
					{message}
				{/if}
			</p>
		</div>

		<div class="flex flex-col items-center gap-8">
			<a
				href={resolve('/')}
				class="rounded-full bg-white px-8 py-3.5 text-sm font-bold tracking-wider text-black uppercase transition-all hover:scale-105 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-95"
			>
				Volver al inicio
			</a>

			<!-- Bloque de soporte con correo mock -->
			<div class="mt-8 border-t border-zinc-900 pt-8">
				<p class="text-xs text-zinc-500 max-w-sm leading-relaxed">
					¿Crees que esto es un error del sistema? <br/>
					Comunícate con nuestro equipo escribiendo a <a href="mailto:soporte@cinepic.com" class="text-zinc-300 underline underline-offset-2 transition-colors hover:text-white">soporte@cinepic.com</a>
				</p>
			</div>
		</div>
	</div>
</div>
