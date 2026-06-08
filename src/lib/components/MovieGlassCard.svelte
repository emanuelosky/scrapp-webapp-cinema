<script lang="ts">
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { Movie } from '$lib/types';
	let { movie }: { movie: Movie } = $props();

	// Acción de Svelte para habilitar drag-to-scroll nativo
	function dragToScroll(node: HTMLElement) {
		let isDown = false;
		let startX: number;
		let scrollLeft: number;
		let hasDragged = false;

		const mousedown = (e: MouseEvent) => {
			e.stopPropagation();
			isDown = true;
			hasDragged = false;
			node.classList.add('cursor-grabbing');
			node.classList.remove('cursor-grab');
			startX = e.pageX - node.offsetLeft;
			scrollLeft = node.scrollLeft;
		};

		const mouseleave = () => {
			isDown = false;
			node.classList.remove('cursor-grabbing');
			node.classList.add('cursor-grab');
		};

		const mouseup = () => {
			isDown = false;
			node.classList.remove('cursor-grabbing');
			node.classList.add('cursor-grab');
		};

		const mousemove = (e: MouseEvent) => {
			if (!isDown) return;
			e.preventDefault();
			const x = e.pageX - node.offsetLeft;
			const walk = (x - startX) * 2;
			if (Math.abs(walk) > 5) hasDragged = true;
			node.scrollLeft = scrollLeft - walk;
		};

		const click = (e: MouseEvent) => {
			e.stopPropagation();
			if (hasDragged) {
				e.preventDefault();
				return;
			}
		};

		node.addEventListener('mousedown', mousedown);
		node.addEventListener('mouseleave', mouseleave);
		node.addEventListener('mouseup', mouseup);
		node.addEventListener('mousemove', mousemove);
		node.addEventListener('click', click);

		return {
			destroy() {
				node.removeEventListener('mousedown', mousedown);
				node.removeEventListener('mouseleave', mouseleave);
				node.removeEventListener('mouseup', mouseup);
				node.removeEventListener('mousemove', mousemove);
				node.removeEventListener('click', click);
			}
		};
	}
</script>

<!--
  [NOTA DE DOCUMENTACIÓN]
  Este componente "MovieGlassCard" representa el diseño anterior para mostrar 
  información detallada (rating, formatos, horarios con scroll) debajo de los pósters.
  
  Actualmente se encuentra en DESUSO, ya que se optó por un diseño más inmersivo 
  (póster 100% visible) donde los detalles se manejan en un modal al hacer click.
  
  Se mantiene aquí conservado como módulo reutilizable por si en el futuro se 
  decide volver a este enfoque en otra sección (por ejemplo, una vista en lista).
-->

<!-- Title, Rating & Showtimes Box -->
<div class="mt-1 flex w-full flex-col justify-between rounded-xl bg-white/[0.02] backdrop-blur-xl border border-white/10 px-3 py-3 shadow-md transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20 hover:shadow-[0_8px_30px_rgb(255,255,255,0.08)] gap-3">
	<!-- Top Row: C | TITULO -->
	<div class="flex items-center justify-start w-full gap-3">
		<!-- Rating -->
		{#if movie.rating}
			<span class="flex size-6 shrink-0 items-center justify-center bg-white text-[13px] font-black text-black rounded-sm leading-none">{movie.rating}</span>
		{/if}
		
		<!-- Dynamic Center Title -->
		<div class="flex-1 text-left">
			<h4 class="font-sans leading-snug font-bold text-white uppercase line-clamp-2 {movie.title.length < 16 ? 'text-[15px]' : 'text-[13px]'}" title={movie.title}>
				{movie.title}
			</h4>
		</div>
	</div>
	
	<!-- Formats Strip -->
	<div class="flex w-full items-center justify-between pt-2 border-t border-white/10 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
		<span>{movie.formats?.video}</span>
		<span>
			{#if movie.formats?.audio === 'ATMOS'}
				<span class="flex items-center gap-1"><Volume2 class="size-3 text-zinc-400" /> ATMOS</span>
			{:else}
				<span class="flex items-center gap-1"><Volume2 class="size-3 text-zinc-400" /> {movie.formats?.audio}</span>
			{/if}
		</span>
		<span>{movie.formats?.language === 'ESPAÑOL' ? 'ESP' : 'SUB'}</span>
	</div>

	<!-- Showtimes con scroll horizontal integrado -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="relative w-full mt-auto pt-2 border-t border-white/10" onclick={(e) => e.stopPropagation()}>
		<div class="flex w-full items-center justify-start gap-x-2 px-1 py-1 text-[13px] font-bold text-zinc-200 overflow-x-auto hide-scrollbar cursor-grab" use:dragToScroll onpointerdown={(e) => e.stopPropagation()} ontouchstart={(e) => e.stopPropagation()}>
			{#each movie.showtimes || [] as time, i (time)}
				<span class="hover:text-white hover:bg-white/10 rounded-sm px-1 transition-all whitespace-nowrap select-none">{time}</span>
				{#if i < (movie.showtimes?.length || 0) - 1}
					<!-- Faded line separator -->
					<div class="w-[1.5px] h-3.5 bg-gradient-to-b from-transparent via-zinc-500 to-transparent shrink-0"></div>
				{/if}
			{/each}
		</div>
		
		<!-- Indicador animado si hay desborde de contenido -->
		{#if (movie.showtimes?.length || 0) > 4}
			<div class="absolute right-0 top-2 bottom-0 flex w-16 items-center justify-end bg-gradient-to-l from-black/80 via-black/40 to-transparent pointer-events-none pr-1">
				<ChevronRight class="size-5 text-white animate-pulse drop-shadow-md" />
			</div>
		{/if}
	</div>
</div>

<style>
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
