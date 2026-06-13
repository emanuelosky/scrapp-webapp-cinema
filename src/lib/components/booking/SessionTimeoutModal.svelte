<script lang="ts">
    import { bookingState } from '$lib/state/booking.svelte';
    import { fade, fly } from 'svelte/transition';
    import Clock from '@lucide/svelte/icons/clock';

    let formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
</script>

{#if bookingState.showExtensionModal && bookingState.timeRemainingSeconds !== null}
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" transition:fade={{duration: 200}}>
        <div class="bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl" transition:fly={{y: 20, duration: 300}}>
            <div class="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                <Clock class="size-8 animate-pulse" />
            </div>
            
            <h2 class="text-xl font-bold text-white mb-2">Tu sesión está por expirar</h2>
            
            <p class="text-zinc-400 text-sm mb-6">
                Hemos reservado tus butacas temporalmente, pero el tiempo se agota. ¿Necesitas más tiempo para completar tu compra?
            </p>
            
            <div class="text-4xl font-black text-amber-500 mb-8 font-mono tracking-tighter">
                {formatTime(bookingState.timeRemainingSeconds)}
            </div>
            
            <div class="flex flex-col gap-3">
                <button 
                    class="w-full bg-amber-500 text-black font-bold py-3 px-6 rounded-full hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    onclick={() => bookingState.extendSession()}
                >
                    Sí, necesito más tiempo
                </button>
                <button 
                    class="w-full bg-transparent text-zinc-500 hover:text-white font-medium py-2 transition-colors"
                    onclick={() => bookingState.expireSession()}
                >
                    Cancelar reserva
                </button>
            </div>
        </div>
    </div>
{/if}
