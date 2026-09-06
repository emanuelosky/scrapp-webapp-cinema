<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	let status = $derived($page.status);
	let message = $derived($page.error?.message ?? 'Algo salió mal.');
</script>

<svelte:head>
	<title>CINEPIC | {status}</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-center font-sans text-zinc-50">
	<img src="/logo.svg" alt="Cinepic" class="h-10 w-auto object-contain opacity-80" />

	<p class="font-display text-7xl font-black tracking-tight text-zinc-800 md:text-8xl">{status}</p>

	<h1 class="max-w-md font-display text-2xl tracking-wider text-white md:text-3xl">
		{#if status === 404}
			Esta función no está en cartelera
		{:else}
			Se nos fue la película
		{/if}
	</h1>

	<p class="max-w-sm text-sm leading-relaxed text-zinc-500">{message}</p>

	<a
		href={resolve('/')}
		class="mt-2 rounded-full bg-zinc-200 px-6 py-2.5 text-[11px] font-bold tracking-widest text-black uppercase transition-colors hover:bg-white"
	>
		Volver al inicio
	</a>
</div>
