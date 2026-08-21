<script lang="ts">
	import { chatState } from '$lib/state/chat.svelte';
	import X from '@lucide/svelte/icons/x';
	import Send from '@lucide/svelte/icons/send';
	import Square from '@lucide/svelte/icons/square';
	import { fade, fly, scale } from 'svelte/transition';
	import { Chat } from '@ai-sdk/svelte';
	import { DefaultChatTransport } from 'ai';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { browser } from '$app/environment';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Film from '@lucide/svelte/icons/film';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Popcorn from '@lucide/svelte/icons/popcorn';

	interface EpikToolResult {
		type?: string;
		action_triggered?: boolean;
		payload?: Record<string, unknown>;
		movies?: Array<{ id: string; title: string }>;
		shows_for_date?: Array<{ id: string; time: string; format: string }>;
		movie?: string;
		movieId?: string;
		target_date?: string;
	}

	interface MessagePart {
		type: string;
		text?: string;
		toolName?: string;
		toolCallId?: string;
		state?: string;
		result?: EpikToolResult;
	}

	interface ExtractedTool {
		toolName: string;
		state: string;
		result?: EpikToolResult;
		args?: Record<string, unknown>;
		id: string;
	}

	const chat = new Chat({
		transport: new DefaultChatTransport({
			api: (import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5173') + '/api/chat',
			headers: {
				'x-epik-secret': import.meta.env.VITE_EPIK_SECRET || 'scrapp_epik_secret_2026_dev'
			}
		})
	});

	let input = $state('');
	let chatBodyEl = $state<HTMLElement | null>(null);

	function extractToolInvocations(parts: unknown[]): ExtractedTool[] {
		const list: ExtractedTool[] = [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		for (const part of (parts || []) as any[]) {
			if (!part) continue;
			if (part.type === 'tool-invocation' && part.toolInvocation) {
				list.push({
					toolName: part.toolInvocation.toolName,
					state: part.toolInvocation.state,
					result: part.toolInvocation.result,
					args: part.toolInvocation.args,
					id: part.toolInvocation.toolCallId || Math.random().toString()
				});
			} else if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
				const name = part.toolName || (part.type !== 'tool-invocation' ? part.type.replace('tool-', '') : '');
				list.push({
					toolName: name,
					state: part.state || (part.result ? 'result' : 'call'),
					result: part.result,
					args: part.args,
					id: part.toolCallId || Math.random().toString()
				});
			}
		}
		return list;
	}

	// Watch for Copilot tool invocations (open_modal, scroll_to)
	$effect(() => {
		const msgs = chat.messages;
		if (msgs.length > 0) {
			const lastMsg = msgs[msgs.length - 1];
			if (lastMsg.role === 'assistant' && lastMsg.parts) {
				const tools = extractToolInvocations(lastMsg.parts);
				for (const tool of tools) {
					if (tool.state === 'result' && tool.result?.action_triggered) {
						chatState.triggerAction(tool.result.type || '', tool.result.payload);
					}
				}
			}
		}
	});

	// Auto-scroll to bottom smoothly
	$effect(() => {
		if (chat.messages || chat.status) {
			if (chatBodyEl) {
				setTimeout(() => {
					chatBodyEl?.scrollTo({ top: chatBodyEl.scrollHeight, behavior: 'smooth' });
				}, 60);
			}
		}
	});

	function getActiveThinkingText(): string {
		const msgs = chat.messages;
		if (msgs.length > 0) {
			const lastMsg = msgs[msgs.length - 1];
			if (lastMsg.role === 'assistant' && lastMsg.parts) {
				const tools = extractToolInvocations(lastMsg.parts);
				const lastTool = tools[tools.length - 1];
				if (lastTool) {
					if (lastTool.toolName === 'get_movies') return 'Consultando cartelera de hoy en Sambil Candelaria...';
					if (lastTool.toolName === 'get_showtimes') return 'Buscando funciones y horarios...';
					if (lastTool.toolName === 'scroll_to_section') return 'Desplazando la pantalla a la cartelera...';
					if (lastTool.toolName === 'open_modal') return 'Abriendo detalles en pantalla...';
					if (lastTool.toolName === 'get_combos') return 'Consultando combos de cotufas...';
				}
			}
		}
		return 'EPIK está pensando...';
	}

	function sendMessage() {
		const text = input.trim();
		if (!text || chat.status === 'streaming' || chat.status === 'submitted') return;
		chat.sendMessage({ role: 'user', parts: [{ type: 'text', text }] });
		input = '';
	}

	function quickSend(text: string) {
		if (chat.status === 'streaming' || chat.status === 'submitted') return;
		chat.sendMessage({ role: 'user', parts: [{ type: 'text', text }] });
	}

	const quotes = [
		"Hola, soy EPIK. Pregúntame lo que necesites.",
		"Que la Fuerza te acompañe... a elegir película.",
		"Hasta la vista, baby... ¡Ah no, acabo de llegar! ¿Te ayudo?",
		"E.T. llama a casa... o mejor compra entradas aquí.",
		"Soy el rey del mundo... y de los horarios de cine."
	];

	const welcomeQuotes = [
		"Mi amigo Wall-e me dejó encargado de ayudarte, ¡indícame qué necesitas!",
		"Soy tu padre... no mentira, soy EPIK. ¿Qué peli vamos a ver hoy?",
		"Que la fuerza te acompañe al elegir tu próxima película. ¿En qué te ayudo?",
		"Al infinito y más allá... o al menos hasta la sala de cine. ¿Qué buscas hoy?",
		"¡Hola! Tengo mis cotufas listas, ¿qué funciones o combos quieres ver?"
	];
	let welcomeMessage = $state(welcomeQuotes[Math.floor(Math.random() * welcomeQuotes.length)]);

	let showBubble = $state(false);
	let bubbleQuote = $state(quotes[0]);
	let bubbleTimer: ReturnType<typeof setTimeout>;

	function triggerBubble() {
		if (chatState.isOpen) return;
		bubbleQuote = quotes[Math.floor(Math.random() * quotes.length)];
		showBubble = true;

		clearTimeout(bubbleTimer);
		bubbleTimer = setTimeout(() => {
			showBubble = false;
		}, 8000);
	}

	$effect(() => {
		const initialTimer = setTimeout(triggerBubble, 3000);
		const intervalTimer = setInterval(triggerBubble, 120000);
		return () => {
			clearTimeout(initialTimer);
			clearTimeout(bubbleTimer);
			clearInterval(intervalTimer);
		};
	});

	const isLoading = $derived(chat.status === 'streaming' || chat.status === 'submitted');
	let scrollY = $state(0);
</script>

<svelte:window bind:scrollY={scrollY} />

{#if chatState.isOpen}
	<!-- Backdrop in mobile, invisible in desktop to let user interact with the page -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm md:hidden" 
		onclick={() => chatState.close()}
		transition:fade={{ duration: 200 }}
	></div>

	<!-- Chat Panel -->
	<div 
		class="fixed bottom-0 md:bottom-6 right-0 md:right-6 w-full md:w-[420px] h-[85vh] md:h-[620px] z-[100] flex flex-col overflow-hidden bg-zinc-950/95 backdrop-blur-3xl md:rounded-sm border-t md:border border-white/20 shadow-2xl shadow-black font-sans"
		transition:fly={{ y: 50, duration: 300, opacity: 0 }}
	>
		<!-- Header -->
		<div class="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-zinc-900/90 backdrop-blur-md">
			<div class="flex items-center gap-3">
				<div class="flex items-center justify-center w-8 h-8 bg-gradient-to-tr from-yellow-500 to-amber-600 border border-yellow-400/40 rounded-full overflow-hidden relative shadow-inner">
					<img src="/favicon.png" alt="EPIK" class="w-5 h-5 object-contain" />
				</div>
				<div>
					<h3 class="font-display text-base font-bold tracking-widest text-white uppercase leading-none">EPIK</h3>
					<p class="text-[9px] text-zinc-400 tracking-wider uppercase font-semibold mt-0.5">Sambil Candelaria • Caracas</p>
				</div>
			</div>
			<button 
				class="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-sm"
				onclick={() => chatState.close()}
				aria-label="Cerrar chat"
			>
				<X class="size-5" />
			</button>
		</div>

		<!-- Chat Body -->
		<div bind:this={chatBodyEl} class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth">
			<div class="flex flex-col items-start gap-1 max-w-[90%]">
				<div class="bg-zinc-900 border border-zinc-700/80 px-4 py-3 text-sm text-zinc-200 rounded-sm leading-relaxed shadow-sm">
					{welcomeMessage}
				</div>
				<span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider ml-1 mt-0.5">EPIK • Caracas</span>
			</div>
			
			<!-- Messages -->
			{#each chat.messages as message (message.id)}
				{@const parts = (message.parts ?? []) as unknown as MessagePart[]}
				{@const textContent = parts.find((p) => p.type === 'text')?.text ?? ''}
				{@const tools = extractToolInvocations(parts)}

				<!-- User Message -->
				{#if message.role === 'user'}
					<div class="flex flex-col gap-1 max-w-[85%] self-end items-end">
						<div class="px-4 py-2.5 text-sm rounded-sm bg-zinc-200 text-black border border-white font-medium shadow-sm">
							{textContent}
						</div>
						<span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mr-1">TÚ</span>
					</div>
				{:else}
					<!-- Assistant Message -->
					<div class="flex flex-col gap-2 max-w-[92%] items-start">
						<!-- Text Content -->
						{#if textContent}
							<div class="px-4 py-3 text-sm rounded-sm bg-zinc-900 border border-zinc-700 text-zinc-200 prose prose-invert prose-sm max-w-none leading-relaxed shadow-sm">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html browser ? DOMPurify.sanitize(marked.parse(textContent) as string) : marked.parse(textContent)}
							</div>
						{/if}

						<!-- Interactive Action Chips & Buttons (Rendered once tool is completed) -->
						{#each tools as tp (tp.id)}
							{#if tp.state === 'result'}
								<!-- Direct Showtimes Pill List -->
								{#if tp.toolName === 'get_showtimes' && tp.result?.shows_for_date && tp.result.shows_for_date.length > 0}
									<div class="flex flex-col gap-1.5 w-full mt-1 bg-zinc-900/60 border border-white/5 p-2.5 rounded-sm">
										<span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
											Funciones Disponibles ({tp.result.target_date}):
										</span>
										<div class="flex flex-wrap gap-1.5">
											{#each tp.result.shows_for_date as show (show.id || show.time)}
												<button
													onclick={() => chatState.triggerAction('booking', { movieId: tp.result?.movieId, movieTitle: tp.result?.movie, date: tp.result?.target_date, showtime: show })}
													class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-emerald-950/60 border border-zinc-700 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 rounded-sm transition-all shadow-sm"
													title="Haz clic para seleccionar butacas en este horario"
												>
													<span>💺 {show.time}</span>
													<span class="text-[9px] px-1 py-0.5 bg-black/50 text-zinc-400 rounded">{show.format}</span>
												</button>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Movies List Chips -->
								{#if tp.toolName === 'get_movies' && tp.result?.movies && tp.result.movies.length > 0}
									<div class="flex flex-wrap gap-1.5 mt-1">
										{#each tp.result.movies.slice(0, 4) as movie (movie.id)}
											<button
												onclick={() => chatState.triggerAction('booking', { movieId: movie.id, movieTitle: movie.title })}
												class="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-yellow-500 text-zinc-300 hover:text-yellow-300 rounded-sm transition-all"
											>
												<Film class="size-3 text-zinc-400" />
												<span>{movie.title}</span>
											</button>
										{/each}
									</div>
								{/if}

								<!-- Combos Shortcut Button -->
								{#if tp.toolName === 'get_combos'}
									<div class="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mt-1">
										<Popcorn class="size-3.5 text-yellow-400" />
										<span>Disponibles en el área de caramelería del cine</span>
									</div>
								{/if}
							{/if}
						{/each}

						{#if textContent}
							<span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider ml-1">EPIK</span>
						{/if}
					</div>
				{/if}
			{/each}

			<!-- Single, Subtle Thinking Indicator (Gemini Web Style + Brutalism) -->
			{#if isLoading}
				<div class="flex items-center gap-2 py-1 px-1 text-zinc-400 text-xs font-mono select-none w-fit animate-pulse">
					<Sparkles class="size-3.5 text-yellow-400 animate-spin" style="animation-duration: 3s;" />
					<span class="text-zinc-300 font-medium tracking-wide">{getActiveThinkingText()}</span>
				</div>
			{/if}

			{#if chat.messages.length === 0}
				<!-- Quick Actions -->
				<div class="flex flex-wrap gap-2 mt-4">
					<button onclick={() => quickSend('¿Qué películas hay hoy?')} class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors rounded-sm">
						¿Qué películas hay hoy?
					</button>
					<button onclick={() => quickSend('¿Cómo funciona el Lunes Popular?')} class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors rounded-sm">
						¿Cómo funciona el Lunes Popular?
					</button>
					<button onclick={() => quickSend('Horarios de Spiderman')} class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors rounded-sm">
						Horarios de Spiderman
					</button>
					<button onclick={() => quickSend('¿Qué combos tienen?')} class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors rounded-sm">
						¿Qué combos tienen?
					</button>
				</div>
			{/if}
		</div>

		<!-- Input Area -->
		<div class="p-4 border-t border-white/20 bg-black">
			<form class="relative flex items-center" onsubmit={(e) => { e.preventDefault(); sendMessage(); }}>
				<input 
					type="text" 
					bind:value={input}
					disabled={isLoading}
					placeholder="ESCRÍBELE A EPIK..." 
					class="w-full bg-zinc-900 border border-zinc-700 rounded-sm py-3 pl-4 pr-12 text-sm font-medium text-white placeholder:text-zinc-500 placeholder:tracking-widest placeholder:text-[10px] focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all uppercase disabled:opacity-75"
				/>
				{#if isLoading}
					<button
						type="button"
						onclick={() => chat.stop()}
						class="absolute right-2 p-2 rounded-sm bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center shadow-md shadow-red-900/30"
						title="Detener respuesta"
						aria-label="Detener respuesta"
					>
						<Square class="size-4 fill-current" />
					</button>
				{:else}
					<button 
						type="submit"
						class="absolute right-2 p-2 rounded-sm bg-white text-black hover:bg-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						disabled={!input.trim()}
						title="Enviar mensaje"
						aria-label="Enviar mensaje"
					>
						<Send class="size-4" />
					</button>
				{/if}
			</form>
			<div class="text-center mt-3 flex items-center justify-center gap-2">
				<span class="w-1.5 h-1.5 bg-red-500"></span>
				<p class="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Powered by EPIK AI</p>
			</div>
		</div>
	</div>
{:else}
	<div class="fixed right-6 md:right-8 z-[90] flex items-end justify-end gap-4 pointer-events-none transition-all duration-300 {scrollY > 800 ? 'bottom-[5.5rem] md:bottom-[6.5rem]' : 'bottom-6 md:bottom-8'}">
		<!-- Bubble -->
		{#if showBubble}
			<div 
				class="mb-3 relative max-w-[220px] bg-white border-2 border-black text-black font-bold px-4 py-3 shadow-[4px_4px_0_rgba(0,0,0,1)] pointer-events-auto rounded-sm"
				transition:fly={{ y: 20, opacity: 0, duration: 300 }}
			>
				{bubbleQuote}
				<!-- Triangle pointing down to the FAB -->
				<div class="absolute -bottom-2 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-white border-r-[8px] border-r-transparent filter drop-shadow-[0_2px_0_rgba(0,0,0,1)]"></div>
			</div>
		{/if}

		<!-- Floating Action Button -->
		<button 
			class="pointer-events-auto flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-500 border border-yellow-300 text-white shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] transition-all group shrink-0 relative"
			onclick={() => { showBubble = false; chatState.open(); }}
			transition:scale={{ start: 0.9, duration: 200 }}
		>
			<div class="relative flex items-center justify-center w-full h-full">
				<!-- Favicon Logo E -->
				<img src="/favicon.png" alt="EPIK" class="w-8 h-8 md:w-10 md:h-10 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />
				
				<!-- Destellos IA Animados (Fuera del contenedor para mayor impacto) -->
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] pointer-events-none z-10 opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
					<!-- Sparkle Top Right -->
					<path d="M 65 20 Q 80 20 80 5 Q 80 20 95 20 Q 80 20 80 35 Q 80 20 65 20 Z" fill="white" class="animate-pulse origin-center" style="animation-duration: 1.5s;" />
					<!-- Sparkle Bottom Left -->
					<path d="M 5 80 Q 18 80 18 67 Q 18 80 31 80 Q 18 80 18 93 Q 18 80 5 80 Z" fill="white" class="animate-pulse origin-center" style="animation-duration: 2.5s;" />
					<!-- Sparkle Top Left -->
					<path d="M 10 25 Q 18 25 18 17 Q 18 25 26 25 Q 18 25 18 33 Q 18 25 10 25 Z" fill="white" class="animate-pulse origin-center" style="animation-duration: 2s;" />
				</svg>
			</div>
		</button>
	</div>
{/if}
