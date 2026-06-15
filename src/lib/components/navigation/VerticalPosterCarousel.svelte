<script lang="ts">
    import * as Carousel from '$lib/components/ui/carousel';
    import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
    import Autoplay from 'embla-carousel-autoplay';
    import type { Movie } from '$lib/types';

    let { movies, label, interactive = false, openModal, delay = 3000 } = $props<{ 
        movies: Movie[], 
        label: string, 
        interactive?: boolean,
        openModal?: (m: Movie) => void,
        delay?: number
    }>();

    let api = $state<CarouselAPI>();
    
    // Usamos $derived para inicializar el plugin y evitar el warning de reactividad de Svelte 5
    let plugin = $derived(Autoplay({ delay, stopOnInteraction: true }));

    function handleMouseEnter() {
        if (api) {
            const autoplay = api.plugins().autoplay;
            if (autoplay) autoplay.stop();
        }
    }

    function handleMouseLeave() {
        if (api) {
            const autoplay = api.plugins().autoplay;
            if (autoplay) autoplay.play();
        }
    }

    // Duplicar items si son pocos para asegurar loop infinito
    let safeMovies = $derived.by(() => {
        if (!movies || movies.length === 0) return [];
        if (movies.length < 4) return [...movies, ...movies, ...movies];
        if (movies.length < 6) return [...movies, ...movies];
        return movies;
    });

</script>

<div class="flex flex-col h-full w-full" onmouseenter={handleMouseEnter} onmouseleave={handleMouseLeave} role="region" aria-label={label}>
    <!-- Header -->
    <div class="flex items-start border-b border-zinc-900 pb-1 mb-2 h-8 w-full overflow-hidden">
        <h3 class="font-black text-white uppercase tracking-wider w-full {label === 'Próximos Estrenos' ? 'text-[12px] leading-[14px] line-clamp-2' : 'text-[14px] truncate'} {label ? '' : 'opacity-0'}">
            {label || '-'}
        </h3>
    </div>
    
    <div class="flex-1 overflow-hidden relative">
        <Carousel.Root 
            opts={{ align: 'start', loop: true }} 
            orientation="vertical"
            plugins={[plugin]} 
            setApi={(a) => { api = a; }}
            class="h-full w-full"
        >
            <Carousel.Content class="!mt-0 h-[200px] md:h-[220px] lg:h-[240px] flex-col">
                {#each safeMovies as movie, i (movie.id + '-' + i)}
                    <!-- Altura de cada ítem: h-full del contenedor para que encaje 1 póster completo, 
                         o un aspecto específico. Como axis='y', basis se define con altura -->
                    <Carousel.Item class="!pt-0 basis-full h-[200px] md:h-[220px] lg:h-[240px]">
                        {#if interactive && movie.showtimes && movie.showtimes.length > 0}
                            <!-- Layout Interactivo: Póster + Horarios -->
                            <div class="flex flex-row gap-4 h-full w-full">
                                <div class="w-[120px] md:w-[130px] lg:w-[140px] shrink-0 h-full rounded-none overflow-hidden relative shadow-xl shadow-black/50 group">
                                    <img src={movie.poster} alt={movie.title} class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                </div>
                                <div class="flex flex-col justify-center items-center flex-1 min-w-0">
                                    <span class="text-[9px] font-bold text-zinc-500 tracking-widest uppercase mb-3">Horarios Hoy</span>
                                        
                                        <!-- Contenedor flex para que quepan todos con scroll o ajustados -->
                                        <div class="flex flex-col gap-1 items-center w-full max-w-[90px] h-[85px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-500 [&::-webkit-scrollbar-thumb]:rounded-full pr-1">
                                            {#each movie.showtimes as timeObj, idx (idx)}
                                                {@const timeStr = typeof timeObj === 'string' ? timeObj : timeObj.time}
                                                <div class="w-full flex justify-center group/btn relative cursor-pointer shrink-0">
                                                    <!-- Efecto hover plateado -->
                                                    <div class="absolute inset-0 bg-white/0 group-hover/btn:bg-white/10 transition-colors rounded-sm"></div>
                                                    <div class="text-[11.5px] font-bold tracking-widest text-zinc-300 group-hover/btn:text-white transition-colors py-0.5">{timeStr}</div>
                                                </div>
                                            {/each}
                                        </div>

                                        <div class="w-full h-px bg-zinc-900 my-3"></div>

                                        <button 
                                            class="w-full max-w-[90px] h-7 bg-zinc-300 hover:bg-white text-black text-[9px] font-black tracking-widest uppercase transition-colors rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                            onclick={(e) => { e.stopPropagation(); openModal?.(movie); }}
                                        >
                                            Ver Hoy
                                        </button>
                                    </div>
                                </div>
                        {:else}
                            <!-- Layout Simple: Solo Póster -->
                            <div class="w-[120px] md:w-[130px] lg:w-[140px] h-full rounded-none overflow-hidden relative shadow-xl shadow-black/50 mx-auto">
                                <img src={movie.poster} alt={movie.title} class="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        {/if}
                    </Carousel.Item>
                {/each}
            </Carousel.Content>
        </Carousel.Root>
        
    </div>
</div>
