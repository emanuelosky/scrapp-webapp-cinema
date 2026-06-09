<!-- src/lib/components/Footer.svelte -->
<script lang="ts">
	import Shield from '@lucide/svelte/icons/shield';
	import FileText from '@lucide/svelte/icons/file-text';
</script>

<footer class="w-full bg-[#000000] border-t border-white/5 pt-16 pb-8 px-4 z-10 relative">
	<div class="max-w-7xl mx-auto flex flex-col gap-12">
		<!-- Main Content -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
			<!-- Col 1: Logo y Contactos -->
			<div class="flex flex-col items-center md:items-start gap-4 md:col-span-1">
				<img src="/logo.svg" alt="Cinepic" class="h-10 w-auto object-contain opacity-90" />
				<div class="w-3/4 h-px bg-white/10 mt-1"></div>
				<div class="flex items-center justify-center md:justify-start gap-4 mt-1">
					<a href="mailto:contacto@cinepic.com.ve" aria-label="Email" class="text-zinc-500 hover:text-white transition-colors">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
					</a>
					<a href="https://instagram.com" target="_blank" aria-label="Instagram" class="text-zinc-500 hover:text-white transition-colors">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
					</a>
					<a href="https://tiktok.com" target="_blank" aria-label="TikTok" class="text-zinc-500 hover:text-white transition-colors">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
					</a>
					<a href="https://wa.me/1234567890" target="_blank" aria-label="WhatsApp" class="text-zinc-500 hover:text-white transition-colors">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path></svg>
					</a>
				</div>
			</div>

			<!-- Col 2: Explorar -->
			<div class="flex flex-col gap-4">
				<h4 class="text-white font-bold uppercase tracking-wider text-sm mb-2">Explorar</h4>
				<ul class="flex flex-col gap-3">
					<li><a href="https://cinepic.com.ve" class="text-zinc-400 hover:text-white transition-colors text-sm">Ver Cartelera</a></li>
					<li><a href="https://cinepic.com.ve" class="text-zinc-400 hover:text-white transition-colors text-sm">Ver Combos</a></li>
					<li><a href="https://cinepic.com.ve" class="text-zinc-400 hover:text-white transition-colors text-sm">Próximos Estrenos</a></li>
				</ul>
			</div>

			<!-- Col 3: Tu Cuenta -->
			<div class="flex flex-col gap-4">
				<h4 class="text-white font-bold uppercase tracking-wider text-sm mb-2">Tu Cuenta</h4>
				<ul class="flex flex-col gap-3">
					<li><a href="https://cinepic.com.ve" class="text-zinc-400 hover:text-white transition-colors text-sm">Iniciar Sesión</a></li>
					<li><a href="https://cinepic.com.ve" class="text-zinc-400 hover:text-white transition-colors text-sm">Crear Cuenta</a></li>
				</ul>
			</div>

			<!-- Col 4: Legal -->
			<div class="flex flex-col gap-4">
				<h4 class="text-white font-bold uppercase tracking-wider text-sm mb-2">Legal</h4>
				<ul class="flex flex-col gap-3">
					<li>
						<a href="https://cinepic.com.ve/terminos" target="_blank" class="text-zinc-400 hover:text-white transition-colors text-sm flex items-center gap-2">
							<FileText size={14} />
							Términos y Condiciones
						</a>
					</li>
					<li>
						<a href="https://cinepic.com.ve/privacidad" target="_blank" class="text-zinc-400 hover:text-white transition-colors text-sm flex items-center gap-2">
							<Shield size={14} />
							Políticas de Privacidad
						</a>
					</li>
				</ul>
			</div>
		</div>

		<!-- Bottom bar -->
		<div class="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
			<p class="text-zinc-600 text-xs">
				&copy; {new Date().getFullYear()} Cinepic. Todos los derechos reservados.
			</p>
			<p class="text-zinc-600 text-xs flex items-center gap-1">
				Powered by <span class="font-bold text-zinc-500 tracking-wider uppercase">Scrapp Enterprise</span>
			</p>
		</div>
	</div>
</footer>
