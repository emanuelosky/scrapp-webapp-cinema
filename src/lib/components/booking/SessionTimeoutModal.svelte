<script lang="ts">
    import { bookingState } from '$lib/state/booking.svelte';
    import { fade, fly } from 'svelte/transition';
    import Clock from '@lucide/svelte/icons/clock';
    import X from '@lucide/svelte/icons/x';

    let formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
</script>

{#if bookingState.showExtensionModal && bookingState.timeRemainingSeconds !== null}
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" transition:fade={{duration: 200}}>
        <div class="bg-black border border-zinc-800 rounded-none shadow-2xl p-0 gap-0 max-w-sm w-full text-center relative" transition:fly={{y: 20, duration: 300}}>
            <button class="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors" onclick={() => bookingState.expireSession()} title="Cancelar Reserva">
                <X class="size-5" />
            </button>
            <div class="px-6 py-5 border-b border-zinc-800">
                <h2 class="text-xl font-black text-white tracking-tight">Sesión por Expirar</h2>
            </div>
            
            <div class="p-6 flex flex-col gap-6">
                <div class="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-white">
                    <Clock class="size-8 animate-pulse" />
                </div>
                
                <p class="text-zinc-400 text-sm">
                    Hemos reservado tus butacas temporalmente, pero el tiempo se agota. ¿Necesitas más tiempo para completar tu compra?
                </p>
                
                <div class="text-4xl font-black text-white font-mono tracking-tighter">
                    {formatTime(bookingState.timeRemainingSeconds)}
                </div>
                
                <div class="flex flex-col gap-3">
                    <button 
                        class="w-full bg-white text-black font-black uppercase tracking-widest py-4 text-sm transition-colors border border-transparent shadow-xl hover:bg-zinc-200"
                        onclick={() => bookingState.extendSession()}
                    >
                        Extender Tiempo
                    </button>
                    <button 
                        class="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest py-3 text-sm transition-colors"
                        onclick={() => bookingState.expireSession()}
                    >
                        Cancelar Reserva
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
