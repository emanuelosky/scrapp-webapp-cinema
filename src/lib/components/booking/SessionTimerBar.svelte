<script lang="ts">
    import { bookingState } from '$lib/state/booking.svelte';
    import { fade } from 'svelte/transition';
    import { page } from '$app/stores';
    import ShoppingCart from '@lucide/svelte/icons/shopping-cart';

    let formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
</script>

{#if bookingState.timeRemainingSeconds !== null && bookingState.timeRemainingSeconds > 0}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="sticky top-0 left-0 right-0 z-[60] flex items-center justify-center bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md px-4 py-2 transition-colors hover:bg-amber-500/20 cursor-pointer"
        transition:fade
        onclick={() => {
            if (bookingState.selectedShowtime && !$page.url.pathname.includes('/concessions')) {
                window.location.href = `/concessions/${bookingState.selectedShowtime.id}`;
            }
        }}
    >
        <div class="flex items-center gap-3 text-amber-500 font-medium text-sm md:text-base">
            <ShoppingCart class="size-4" />
            <span>Tienes asientos reservados. Tiempo restante:</span>
            <span class="font-mono font-bold text-amber-400 bg-black/50 px-2 py-0.5 rounded">
                {formatTime(bookingState.timeRemainingSeconds)}
            </span>
            {#if !$page.url.pathname.includes('/concessions')}
                <span class="ml-2 text-xs uppercase tracking-wider bg-amber-500 text-black px-2 py-1 rounded font-bold">Continuar Compra</span>
            {/if}
        </div>
        
        <!-- También mostramos el código del Ghost User aquí arriba para el debug que pidió el usuario -->
        {#if bookingState.ghostStatusCode}
            <div class="absolute right-4 flex items-center gap-2 text-xs font-mono text-zinc-500 opacity-60">
                {bookingState.ghostStatusCode}
            </div>
        {/if}
    </div>
{/if}
