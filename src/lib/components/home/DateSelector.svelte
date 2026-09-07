<script lang="ts">
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import X from '@lucide/svelte/icons/x';
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import { today, type DateValue } from "@internationalized/date";
	import { cinemaState } from '$lib/state/cinema.svelte';

	let {
		selectedDateTab = $bindable('hoy'),
		customDate = $bindable<DateValue | undefined>(),
		activeDates = []
	}: { selectedDateTab: 'hoy'|'manana'|'custom', customDate: DateValue | undefined, activeDates: string[] } = $props();

	let isCalendarOpen = $state(false);

	// La zona de la SEDE, nunca la del navegador del visitante: si alguien
	// entra desde otro país a ver la cartelera de esta sala, "hoy" debe seguir
	// siendo el día de pared de la sala, no el suyo.
	let tz = $derived(cinemaState.activeTimezone);

	function formatCustomDate(dateVal: DateValue) {
		const date = dateVal.toDate(tz);
		return new Intl.DateTimeFormat('es-VE', { weekday: 'short', day: 'numeric', timeZone: tz }).format(date).replace('.', '');
	}
</script>

<div class="flex items-center gap-3">
	<span class="text-base sm:text-lg font-black text-zinc-300 hidden sm:flex items-center gap-2"><CalendarDays class="size-5 text-champagne-500" /> Ver para:</span>
	<div class="flex w-full sm:w-[360px] bg-zinc-900 border border-white/10 rounded-full h-11 p-1 shadow-inner overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
		<button 
			class="flex-1 min-w-max px-3 whitespace-nowrap rounded-full font-bold transition-all text-xs sm:text-sm {selectedDateTab === 'hoy' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'}"
			onclick={() => { selectedDateTab = 'hoy'; customDate = undefined; }}
		>
			Hoy, {new Intl.DateTimeFormat('es-VE', { month: 'short', day: 'numeric', timeZone: tz }).format(today(tz).toDate(tz)).replace('.', '')}
		</button>
		<button 
			class="flex-1 min-w-max px-3 whitespace-nowrap rounded-full font-bold transition-all text-xs sm:text-sm {selectedDateTab === 'manana' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'}"
			onclick={() => { selectedDateTab = 'manana'; customDate = undefined; }}
		>
			Mañana
		</button>
		
		{#if customDate}
			<div role="button" tabindex="0" class="flex-1 min-w-max px-3 whitespace-nowrap flex items-center justify-center rounded-full font-bold transition-all text-xs sm:text-sm bg-white text-black shadow-md cursor-pointer group"
					onclick={() => isCalendarOpen = true}
					onkeydown={(e) => e.key === 'Enter' && (isCalendarOpen = true)}>
				<span class="truncate pl-2 capitalize">{formatCustomDate(customDate)}</span>
				<button class="ml-1 p-1 hover:bg-black/10 rounded-full" onclick={(e) => { e.stopPropagation(); customDate = undefined; selectedDateTab = 'hoy'; }}>
					<X class="size-3" />
				</button>
			</div>
		{:else}
			<Popover.Root bind:open={isCalendarOpen}>
				<Popover.Trigger class="flex-1 min-w-max px-3 whitespace-nowrap rounded-full font-bold transition-all text-xs sm:text-sm {selectedDateTab === 'custom' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'}">
					Otra fecha
				</Popover.Trigger>
				<Popover.Content sideOffset={8} class="z-[100] rounded-3xl bg-zinc-950 p-0 shadow-2xl border border-white/10 overflow-hidden w-auto">
					<Calendar
						bind:value={customDate}
						minValue={today(tz)}
						maxValue={today(tz).add({ days: 14 })}
						isDateUnavailable={(date: DateValue) => !activeDates.includes(date.toString())}
						class="p-4 bg-zinc-950 text-white"
						onValueChange={(v: DateValue | undefined) => {
							if (v) {
								selectedDateTab = 'custom';
								isCalendarOpen = false;
							}
						}}
					/>
				</Popover.Content>
			</Popover.Root>
		{/if}
	</div>
</div>
