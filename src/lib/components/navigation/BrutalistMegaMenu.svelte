<!-- eslint-disable svelte/no-navigation-without-resolve -->
<script lang="ts">
    import { tick, onMount, onDestroy } from "svelte";
    import gsap from "gsap";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import ExternalLink from "@lucide/svelte/icons/external-link";
    import type { Movie } from '$lib/types';
    import VerticalPosterCarousel from './VerticalPosterCarousel.svelte';
    import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";

    let { movies = [], comingSoon = [], openModal } = $props<{ 
        movies?: Movie[], 
        comingSoon?: Movie[], 
        openModal?: (m: Movie) => void 
    }>();

    // Combinar y eliminar duplicados
    let allMovies = $derived.by(() => {
        const map: Record<string, Movie> = {};
        for (const m of comingSoon) map[m.id] = m;
        for (const m of movies) map[m.id] = m; // Sobrescribe con la versión de nowPlaying si tiene funciones
        return Object.values(map);
    });

    // Categorización Definitiva
    let hoy = $derived(allMovies.filter((m: Movie) => m.showtimes && m.showtimes.length > 0 && m.label !== 'PREVENTA' && m.label !== 'ESTRENO' && m.label !== 'EVENTO'));
    let estrenosSemana = $derived(allMovies.filter((m: Movie) => m.label === 'ESTRENO'));
    let preventa = $derived(allMovies.filter((m: Movie) => m.label === 'PREVENTA'));
    let eventos = $derived(allMovies.filter((m: Movie) => m.label === 'EVENTO'));
    let proximos = $derived(allMovies.filter((m: Movie) => (!m.showtimes || m.showtimes.length === 0) && m.label !== 'PREVENTA' && m.label !== 'ESTRENO' && m.label !== 'EVENTO'));

    let dynamicColumns = $derived.by(() => {
        const cols = [];
        if (eventos.length > 0) cols.push({ id: 'eventos', label: 'EVENTOS', movies: eventos });
        if (preventa.length > 0) cols.push({ id: 'preventa', label: 'Preventa Especial', movies: preventa });
        if (estrenosSemana.length > 0) cols.push({ id: 'estrenosSemana', label: 'Estrenos de la Semana', movies: estrenosSemana });
        if (proximos.length > 0) {
            cols.push({ id: 'proximos', label: 'Próximos Estrenos', movies: proximos });
        }
        return cols;
    });

    let activeTab: string | null = $state(null);
    let megaMenuEl: HTMLElement | null = $state(null);
    let navWrapEl: HTMLElement | null = $state(null);

    const mobileStore = new IsMobile();
    let isMobile = $derived(mobileStore.current);

    // Timeline para la animación del mega menú
    let tl: gsap.core.Timeline | null = null;
    let leaveTimeout: ReturnType<typeof setTimeout> | null = null;

    const MENU_DATA: Record<string, { label: string, href: string }[]> = {
        combos: [
            { label: "ARMÁ TU COMBO", href: "/dulceria/arma-tu-combo" },
            { label: "NUESTRO MENÚ", href: "/dulceria/menu" },
            { label: "PROMOCIONES", href: "/promociones" }
        ],
        corporativo: [
            { label: "ANÚNCIATE EN CINEPIC", href: "/corporativo/anunciate" },
            { label: "TRABAJA CON NOSOTROS", href: "/corporativo/empleo" },
            { label: "CONTACTO", href: "/contacto" }
        ]
    };

    function handleInteraction(tabId: string) {
        if (activeTab === tabId) {
            handleMouseLeave();
        } else {
            handleMouseEnter(tabId);
        }
    }

    async function handleMouseEnter(tabId: string) {
        if (leaveTimeout) {
            clearTimeout(leaveTimeout);
            leaveTimeout = null;
        }

        const isOpening = activeTab === null;
        activeTab = tabId;

        await tick();

        if (isOpening) {
            // Animación de entrada
            tl?.kill();
            tl = gsap.timeline();
            
            tl.fromTo(megaMenuEl, 
                { yPercent: -100, autoAlpha: 0 }, 
                { yPercent: 0, autoAlpha: 1, duration: 0.3, ease: "power4.out" }
            );

            tl.fromTo(".brutalist-element", 
                { y: 30, opacity: 0 }, 
                { y: 0, opacity: 1, stagger: 0.05, duration: 0.3, ease: "power3.out" },
                "-=0.15"
            );
        } else {
            // Si ya está abierto, solo animamos la entrada del nuevo contenido
            gsap.fromTo(".brutalist-element", 
                { x: -20, opacity: 0 }, 
                { x: 0, opacity: 1, stagger: 0.04, duration: 0.2, ease: "power2.out", overwrite: true }
            );
        }
    }

    function handleMouseLeave() {
        if (activeTab === null) return;
        
        // Puente invisible (debounce) de 150ms
        leaveTimeout = setTimeout(() => {
            tl?.kill();
            tl = gsap.timeline({
                onComplete: () => { activeTab = null; }
            });

            tl.to(".brutalist-element", { y: 20, opacity: 0, duration: 0.15, ease: "power2.in" });
            tl.to(megaMenuEl, { yPercent: -20, autoAlpha: 0, duration: 0.2, ease: "power3.in" }, "-=0.1");
        }, 150);
    }

    onMount(() => {
        if (megaMenuEl) gsap.set(megaMenuEl, { autoAlpha: 0, yPercent: -100 });
    });

    onDestroy(() => {
        if (leaveTimeout) clearTimeout(leaveTimeout);
        tl?.kill();
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex items-center min-w-0 w-full" bind:this={navWrapEl} onmouseleave={handleMouseLeave} role="navigation">
    <nav class="flex flex-1 items-center gap-6 lg:gap-8 text-[14px] md:text-[15px] font-bold tracking-normal whitespace-nowrap text-zinc-300 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 md:px-0 min-w-0">
        <button 
            class="transition-colors duration-200 shrink-0 h-14 md:h-16 flex items-center {activeTab === 'cartelera' ? 'text-white border-b-[3px] border-zinc-300' : 'hover:text-white border-b-[3px] border-transparent'}"
            onmouseenter={() => { if (!isMobile) handleMouseEnter('cartelera'); }}
            onclick={() => handleInteraction('cartelera')}
        >
            <span class="pt-[2px]">Ver Cartelera</span>
        </button>
        <button 
            class="transition-colors duration-200 shrink-0 h-14 md:h-16 flex items-center {activeTab === 'combos' ? 'text-white border-b-[3px] border-zinc-300' : 'hover:text-white border-b-[3px] border-transparent'}"
            onmouseenter={() => { if (!isMobile) handleMouseEnter('combos'); }}
            onclick={() => handleInteraction('combos')}
        >
            <span class="pt-[2px]">Combos</span>
        </button>
        <button 
            class="transition-colors duration-200 shrink-0 h-14 md:h-16 flex items-center {activeTab === 'corporativo' ? 'text-white border-b-[3px] border-zinc-300' : 'hover:text-white border-b-[3px] border-transparent'}"
            onmouseenter={() => { if (!isMobile) handleMouseEnter('corporativo'); }}
            onclick={() => handleInteraction('corporativo')}
        >
            <span class="pt-[2px]">Corporativo</span>
        </button>
    </nav>

    <!-- Mega Panel Brutalista -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        bind:this={megaMenuEl} 
        class="absolute top-[56px] md:top-[64px] left-0 w-full max-h-[calc(100dvh-56px)] md:max-h-[calc(100dvh-64px)] bg-black border-b border-zinc-800 z-50 overflow-y-auto overflow-x-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] pointer-events-none"
        style="visibility: hidden;"
        onmouseenter={() => { if (leaveTimeout) clearTimeout(leaveTimeout); leaveTimeout = null; }}
    >
        {#if activeTab}
            <div class="w-full px-4 md:px-8 xl:px-12 py-6 pointer-events-auto min-h-[350px] relative z-10">
                
                {#if activeTab === 'cartelera'}
                    <!-- Estética WOW Carruseles Verticales -->
                    <div class="flex flex-row [justify-content:safe_center] overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-6 xl:gap-8 w-full h-[256px] md:h-[276px] lg:h-[296px] snap-x snap-mandatory">
                        <!-- Columna de Acción (Izquierda) -->
                        <div class="brutalist-element w-[220px] shrink-0 flex flex-col justify-end pb-8 snap-start">
                            <h2 class="text-3xl font-black text-zinc-600 uppercase tracking-tighter leading-none mb-4">¿No sabes qué ver?</h2>
                            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                            <a href="/cartelera" class="group flex items-center justify-between p-4 bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/50 hover:border-zinc-400 hover:from-zinc-700 hover:to-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] transition-all duration-300">
                                <span class="text-lg font-black text-zinc-300 group-hover:text-white uppercase drop-shadow-sm">Cartelera Completa</span>
                                <div class="flex items-center gap-1.5">
                                    <ExternalLink class="size-4 md:size-5 text-zinc-500 group-hover:text-white transition-colors" />
                                    <ChevronRight class="size-6 text-zinc-500 group-hover:text-white transition-colors" />
                                </div>
                            </a>
                        </div>

                        <!-- Línea Separadora Difuminada -->
                        <div class="w-px h-full bg-zinc-800 shrink-0"></div>

                        <!-- Columnas Flexibles -->
                        <div class="flex flex-row gap-6">
                            <!-- Hoy en el Cine (Siempre primero si tiene películas) -->
                            {#if hoy.length > 0}
                                <div class="brutalist-element h-full w-[240px] md:w-[260px]">
                                    <VerticalPosterCarousel 
                                        movies={hoy} 
                                        label="Hoy en el Cine" 
                                        interactive={true} 
                                        openModal={openModal} 
                                        delay={4000} 
                                    />
                                </div>
                            {/if}

                            <!-- Generador Dinámico de Columnas Exclusivas -->
                            {#each dynamicColumns as col, index (col.id)}
                                <!-- Línea Separadora si hay una columna previa -->
                                {#if index > 0 || hoy.length > 0}
                                    <div class="w-px h-full bg-zinc-800 shrink-0"></div>
                                {/if}
                                
                                {@const hasInteractive = col.movies.some((m: Movie) => m.showtimes && m.showtimes.length > 0)}
                                <div class="brutalist-element h-full {hasInteractive ? 'w-[240px] md:w-[260px]' : 'w-[160px]'} shrink-0 snap-start">
                                    <VerticalPosterCarousel 
                                        movies={col.movies} 
                                        label={col.label} 
                                        interactive={true} 
                                        openModal={openModal}
                                        delay={3500 - (index * 200)} 
                                    />
                                </div>
                            {/each}
                        </div>
                    </div>

                {:else if MENU_DATA[activeTab]}
                    <!-- Estética Clásica de Textos para Combos/Corporativo -->
                    <div class="flex flex-col gap-1 w-full max-w-3xl">
                        {#each MENU_DATA[activeTab] as link (link.label)}
                            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                            <a href={link.href} class="brutalist-element group flex items-center justify-between py-4 border-b border-zinc-900 hover:border-zinc-700 transition-colors">
                                <span class="text-4xl md:text-5xl font-black tracking-tighter text-zinc-500 group-hover:text-white transition-colors duration-300">
                                    {link.label}
                                </span>
                                <div class="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                    <ChevronRight class="size-8 md:size-10 text-red-600" strokeWidth={3} />
                                </div>
                            </a>
                        {/each}
                    </div>
                {/if}

            </div>
        {/if}
    </div>
</div>
