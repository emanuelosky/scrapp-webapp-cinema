<script lang="ts">
    import * as Command from "$lib/components/ui/command";
    import type { Movie } from "$lib/types";
    import { fade } from 'svelte/transition';

    let { 
        open = $bindable(false), 
        movies = [] as Movie[],
        openMovieDetails
    } = $props<{ 
        open: boolean, 
        movies: Movie[],
        openMovieDetails?: (m: Movie) => void 
    }>();

    let selectedValue = $state("");

    // Buscamos la película activa. Como el 'value' contiene el ID + Título para el buscador, extraemos o comparamos si inicia con el ID.
    let activeMovie = $derived(movies.find((m: Movie) => selectedValue.startsWith(m.id.toString() + " ")) || null);

    // Svelte 5 Keyboard Listener for global Command Palette shortcut (Ctrl+K or Cmd+K)
    $effect(() => {
        function handleKeydown(e: KeyboardEvent) {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                open = !open;
            }
        }
        document.addEventListener("keydown", handleKeydown);
        return () => {
            document.removeEventListener("keydown", handleKeydown);
        };
    });
</script>

<Command.Dialog bind:open bind:value={selectedValue}>
    <div class="flex flex-col md:flex-row w-full max-h-[80dvh] md:h-[70vh] md:min-h-[500px] md:max-h-[800px] bg-black">
        <!-- LEFT: Search List -->
        <div class="flex flex-col w-full h-full md:w-3/5 border-r border-zinc-900 bg-black overflow-hidden relative z-10">
            <Command.Input placeholder="BUSCAR..." />
            
            <Command.List class="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-zinc-950 [&::-webkit-scrollbar-thumb]:bg-zinc-700 hover:[&::-webkit-scrollbar-thumb]:bg-white [&::-webkit-scrollbar-thumb]:rounded-none transition-colors">
                <Command.Empty class="py-24 text-center text-zinc-600 font-black tracking-widest text-sm uppercase">NADA ENCONTRADO.</Command.Empty>
                
                <Command.Group heading="[ CARTELERA ]" class="py-2">
                    {#each movies as movie (movie.id)}
                        <!-- value debe ser un string único que también se usa para buscar -->
                        <Command.Item value={movie.id.toString() + " " + movie.title + " " + (movie.genres?.join(" ") || "")} onSelect={() => {
                            open = false;
                            if (openMovieDetails) openMovieDetails(movie);
                        }}>
                            <div class="font-bold uppercase tracking-widest flex-1">{movie.title}</div>
                        </Command.Item>
                    {/each}
                </Command.Group>

                <Command.Separator class="bg-zinc-900" />
                
                <Command.Group heading="[ DULCERÍA Y COMBOS ]" class="py-2">
                    <Command.Item value="combos" onSelect={() => open = false}>
                        <div class="font-bold uppercase tracking-widest flex-1">VER COMBOS EXCLUSIVOS</div>
                    </Command.Item>
                    <Command.Item value="palomitas" onSelect={() => open = false}>
                        <div class="font-bold uppercase tracking-widest flex-1">PALOMITAS CARAMELIZADAS</div>
                    </Command.Item>
                </Command.Group>

                <Command.Separator class="bg-zinc-900" />

                <Command.Group heading="[ SISTEMA ]" class="py-2">
                    <Command.Item value="carrito" onSelect={() => open = false}>
                        <div class="font-bold uppercase tracking-widest flex-1">MI CARRITO</div>
                    </Command.Item>
                    <Command.Item value="sesion" onSelect={() => open = false}>
                        <div class="font-bold uppercase tracking-widest flex-1">INICIAR SESIÓN / MIS BOLETOS</div>
                    </Command.Item>
                </Command.Group>
            </Command.List>
        </div>

        <!-- RIGHT: Preview Pane (Desktop Only) -->
        <div class="hidden md:flex flex-col w-full h-full md:w-2/5 bg-zinc-950 p-6 md:p-10 relative overflow-hidden">
            {#if activeMovie}
                {#key activeMovie.id}
                    <div class="absolute inset-0 w-full h-full" in:fade={{ duration: 300, delay: 50 }}>
                        <!-- Render active movie preview -->
                        <div class="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none">
                            <img src={activeMovie.poster} alt="" class="w-full h-full object-cover blur-2xl saturate-200" />
                        </div>
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-zinc-950/80 to-transparent pointer-events-none"></div>

                        <div class="relative z-10 flex flex-col h-full items-center justify-center">
                            <img src={activeMovie.poster} alt={activeMovie.title} class="w-full max-w-[100px] md:max-w-[200px] h-auto object-contain shadow-2xl mb-4 md:mb-8 shadow-black border border-zinc-800" />
                            
                            <h2 class="text-xl md:text-3xl font-black uppercase text-white mb-2 md:mb-4 text-center leading-tight tracking-tighter line-clamp-1 md:line-clamp-none">{activeMovie.title}</h2>
                            
                            <div class="flex flex-wrap justify-center gap-2 mb-2 md:mb-6">
                                {#if activeMovie.genres && activeMovie.genres.length > 0}
                                    <span class="px-2 md:px-3 py-1 bg-white text-black text-[8px] md:text-[10px] font-black tracking-widest uppercase">{activeMovie.genres[0]}</span>
                                {/if}
                                {#if activeMovie.durationMinutes}
                                    <span class="px-2 md:px-3 py-1 border border-zinc-700 text-zinc-300 text-[8px] md:text-[10px] font-black tracking-widest">{activeMovie.durationMinutes} MIN</span>
                                {/if}
                                {#if activeMovie.rating}
                                    <span class="px-2 md:px-3 py-1 border border-zinc-700 text-zinc-300 text-[8px] md:text-[10px] font-black tracking-widest">{activeMovie.rating}</span>
                                {/if}
                            </div>

                            {#if activeMovie.synopsis}
                                <p class="hidden md:block text-xs text-zinc-400 text-center leading-relaxed max-w-[280px] line-clamp-4">{activeMovie.synopsis}</p>
                            {/if}

                            {#if activeMovie.releaseDate && (!activeMovie.showtimes || activeMovie.showtimes.length === 0)}
                                <div class="hidden md:block mt-8 text-[11px] text-black bg-white px-4 py-2 font-black tracking-[0.2em] uppercase">
                                    ESTRENO: {activeMovie.releaseDate}
                                </div>
                            {:else}
                                <div class="hidden md:block mt-8 text-[10px] text-zinc-600 font-bold tracking-widest uppercase animate-pulse">
                                    PRESIONA ENTER PARA VER HORARIOS
                                </div>
                            {/if}
                        </div>
                    </div>
                {/key}
            {:else}
                <!-- Empty state preview -->
                <div class="flex-1 flex flex-col items-center justify-center text-zinc-800 relative z-10">
                    <div class="w-16 h-16 border-2 border-zinc-800 rounded-full flex items-center justify-center mb-6">
                        <div class="w-2 h-2 bg-zinc-800 rounded-full animate-ping"></div>
                    </div>
                    <span class="text-[10px] font-black tracking-[0.2em] uppercase text-center max-w-[200px]">
                        NAVEGA POR LA LISTA PARA PREVISUALIZAR
                    </span>
                </div>
            {/if}
        </div>
    </div>
</Command.Dialog>
