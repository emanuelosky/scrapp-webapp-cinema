<script lang="ts">
	import { page } from '$app/stores';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Star from '@lucide/svelte/icons/star';
	import Info from '@lucide/svelte/icons/info';
	import Zap from '@lucide/svelte/icons/zap';
	import Flame from '@lucide/svelte/icons/flame';
	import Gift from '@lucide/svelte/icons/gift';
	import type { PromoBanner } from '$lib/types';
	
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
