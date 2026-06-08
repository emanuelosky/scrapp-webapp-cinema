<script lang="ts">
	import Ticket from '@lucide/svelte/icons/ticket';
</script>

<div class="relative flex items-center justify-center bg-[oklch(0.67_0.16_58)] px-4 py-2 text-center text-sm font-semibold text-zinc-950 shadow-md">
	<p>
		<Ticket class="mr-1 inline-block size-4 align-text-bottom text-zinc-950" />
		<span class="cursor-pointer font-black underline hover:text-zinc-800">Lunes Populares:</span> ¡Aprovecha
		hoy 50% de descuento a mitad de precio en todas tus entradas! Compra tus tickets ahora.
	</p>
	<button aria-label="Cerrar" class="absolute top-1/2 right-4 -translate-y-1/2 hover:text-zinc-700">
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
	</button>
</div>
