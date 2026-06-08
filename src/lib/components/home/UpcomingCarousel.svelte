<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel';
	import type { Movie } from '$lib/types';

	let { movies } = $props<{ movies: Movie[] }>();
</script>

<div class="w-full bg-[#000000] relative z-20">
	<div class="mx-auto max-w-7xl px-4 py-16 md:py-24">
		<div class="mb-12 text-center flex flex-col items-center">
			<h2 class="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">Próximos Estrenos</h2>
			<p class="text-zinc-400 mt-2 text-lg">Pronto en nuestras salas</p>
		</div>

		<section class="relative">
			<Carousel.Root opts={{ align: 'center', loop: false }} class="w-full">
				<Carousel.Content class="-ml-2 md:-ml-4 justify-center">
					{#each movies as movie (movie.id)}
						<Carousel.Item class="pl-2 md:pl-4 basis-[45%] sm:basis-[30%] md:basis-[22%] lg:basis-1/5">
							<button class="w-full text-left group">
								<div class="relative w-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-lg transition-all duration-300 group-hover:ring-white/30 group-hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)] group-hover:scale-[1.02]">
									{#if movie.poster}
										<img
											src={movie.poster}
											alt={movie.title}
											class="aspect-[2/3] w-full object-cover transition-opacity duration-300 group-hover:opacity-80"
										/>
									{:else}
										<div class="flex aspect-[2/3] w-full items-center justify-center bg-zinc-900 text-zinc-600 px-4">
											<span class="font-display text-sm font-bold uppercase">{movie.title}</span>
										</div>
									{/if}
									
									<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12">
										<h4 class="font-sans font-bold text-white uppercase leading-tight line-clamp-2 drop-shadow-md">{movie.title}</h4>
									</div>
								</div>
							</button>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				
				<div class="hidden md:flex absolute -left-12 -right-12 top-[40%] justify-between pointer-events-none">
					<div class="pointer-events-auto">
						<Carousel.Previous class="relative left-0 bg-white/5 backdrop-blur-md hover:bg-white hover:text-black text-white border-white/20 transition-all" />
					</div>
					<div class="pointer-events-auto">
						<Carousel.Next class="relative right-0 bg-white/5 backdrop-blur-md hover:bg-white hover:text-black text-white border-white/20 transition-all" />
					</div>
				</div>
			</Carousel.Root>
		</section>
	</div>
</div>
