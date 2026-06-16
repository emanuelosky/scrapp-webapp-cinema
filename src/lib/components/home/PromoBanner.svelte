<script lang="ts">
	import { page } from '$app/stores';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Star from '@lucide/svelte/icons/star';
	import Info from '@lucide/svelte/icons/info';
	import Zap from '@lucide/svelte/icons/zap';
	import Flame from '@lucide/svelte/icons/flame';
	import Gift from '@lucide/svelte/icons/gift';
	import type { PromoBanner } from '$lib/types';
	
	// SAFELIST MASIVA (Para que todos los colores del Admin Panel funcionen)
	// bg-slate-600 text-slate-50 bg-slate-800 text-slate-100 bg-slate-900
	// bg-gray-600 text-gray-50 bg-gray-800 text-gray-100 bg-gray-900
	// bg-zinc-600 text-zinc-50 bg-zinc-800 text-zinc-100 bg-zinc-900
	// bg-neutral-600 text-neutral-50 bg-neutral-800 text-neutral-100 bg-neutral-900
	// bg-stone-600 text-stone-50 bg-stone-800 text-stone-100 bg-stone-900
	// bg-red-600 text-red-50 bg-red-800 text-red-100 bg-red-900
	// bg-orange-600 text-orange-50 bg-orange-800 text-orange-100 bg-orange-900
	// bg-amber-600 text-amber-50 bg-amber-800 text-amber-100 bg-amber-900
	// bg-yellow-600 text-yellow-50 bg-yellow-800 text-yellow-100 bg-yellow-900
	// bg-lime-600 text-lime-50 bg-lime-800 text-lime-100 bg-lime-900
	// bg-green-600 text-green-50 bg-green-800 text-green-100 bg-green-900
	// bg-emerald-600 text-emerald-50 bg-emerald-800 text-emerald-100 bg-emerald-900
	// bg-teal-600 text-teal-50 bg-teal-800 text-teal-100 bg-teal-900
	// bg-cyan-600 text-cyan-50 bg-cyan-800 text-cyan-100 bg-cyan-900
	// bg-sky-600 text-sky-50 bg-sky-800 text-sky-100 bg-sky-900
	// bg-blue-600 text-blue-50 bg-blue-800 text-blue-100 bg-blue-900
	// bg-indigo-600 text-indigo-50 bg-indigo-800 text-indigo-100 bg-indigo-900
	// bg-violet-600 text-violet-50 bg-violet-800 text-violet-100 bg-violet-900
	// bg-purple-600 text-purple-50 bg-purple-800 text-purple-100 bg-purple-900
	// bg-fuchsia-600 text-fuchsia-50 bg-fuchsia-800 text-fuchsia-100 bg-fuchsia-900
	// bg-pink-600 text-pink-50 bg-pink-800 text-pink-100 bg-pink-900
	// bg-rose-600 text-rose-50 bg-rose-800 text-rose-100 bg-rose-900
	// bg-black text-white bg-white text-black
	
	const IconsMap: Record<string, typeof Ticket> = {
		Ticket, Star, Info, Zap, Flame, Gift
	};
	
	let isVisible = $state(true);
	let promo = $derived($page.data.activePromo as PromoBanner | null);
</script>

{#if isVisible && promo}
	<div class="relative z-50 flex items-center justify-center {promo.bg_color_class} px-4 md:px-8 py-2.5 text-center text-xs md:text-sm font-semibold {promo.text_color_class} shadow-md transition-all duration-300">
		<p class="pr-6 flex items-center justify-center gap-1.5">
			{#if IconsMap[promo.icon]}
				{@const IconComponent = IconsMap[promo.icon]}
				<IconComponent class="inline-block shrink-0 size-4 md:size-5 align-text-bottom {promo.text_color_class}" />
			{/if}
			<span>{promo.message}</span>
		</p>
		<button aria-label="Cerrar" class="absolute top-1/2 right-4 -translate-y-1/2 hover:opacity-70 transition-transform hover:scale-110 active:scale-95" onclick={() => isVisible = false}>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			</svg>
		</button>
	</div>
{/if}
