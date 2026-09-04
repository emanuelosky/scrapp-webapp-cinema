<script lang="ts">
	import { chatState } from '$lib/state/chat.svelte';
	import { cartState } from '$lib/state/cart.svelte';
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

	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	interface EpikToolResult {
		type?: string;
		action_triggered?: boolean;
		action_type?: string;
		payload?: Record<string, unknown>;
		movies?: Array<{ id: string; title: string; poster_url?: string }>;
		shows_for_date?: Array<{ id: string; time: string; format: string; room: string }>;
		movie?: string;
		movieId?: string;
		movieTitle?: string;
		target_date?: string;
		poster_url?: string;
		rating?: string;
		duration?: number;
		genres?: string[];
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
			},
			body: {
				get contextMovies() { return chatState.contextData; },
				get contextCart() {
					let cartStr = [];
					if (cartState.cartItems.length > 0) {
						cartStr.push(`Entradas: ${cartState.cartItems.map(c => `${c.seats.length}x ${c.movieTitle} (${c.showtimeTime})`).join(', ')}`);
					}
					if (cartState.selectedConcessions.length > 0) {
						cartStr.push(`Combos: ${cartState.selectedConcessions.map(c => `${c.quantity}x ${c.name}`).join(', ')}`);
					}
					return cartStr.length > 0 ? cartStr.join(' | ') : null;
				}
			}
		})
	});

	let input = $state('');
	let chatBodyEl = $state<HTMLElement | null>(null);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function extractToolInvocations(msg: any): ExtractedTool[] {
		if (msg.toolInvocations && Array.isArray(msg.toolInvocations) && msg.toolInvocations.length > 0) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return msg.toolInvocations.map((t: any) => ({
				toolName: t.toolName,
				state: t.state,
				result: t.result,
				args: t.args,
				id: t.toolCallId || Math.random().toString()
			}));
		}

		const list: ExtractedTool[] = [];
		const parts = msg.parts || [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		for (const part of parts as any[]) {
			if (!part) continue;
			console.debug('[EPIK Widget] part.type:', part.type, 'keys:', Object.keys(part));
			if (part.type === 'tool-invocation' && part.toolInvocation) {
				console.debug('[EPIK Widget] tool-invocation found:', part.toolInvocation.toolName, 'state:', part.toolInvocation.state, 'result:', JSON.stringify(part.toolInvocation.result));
				list.push({
					toolName: part.toolInvocation.toolName,
					state: part.toolInvocation.state,
					result: part.toolInvocation.result,
					args: part.toolInvocation.args,
					id: part.toolInvocation.toolCallId || Math.random().toString()
				});
			} else if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
				const name = part.toolName || (part.type !== 'tool-invocation' ? part.type.replace('tool-', '') : '');
				
				// Fix state and result extraction for stream text parts
				const isFinished = part.type === 'tool-result' || part.type === 'tool-output-available' || part.state === 'output-available';
				const extractedState = isFinished ? 'result' : (part.state || 'call');
				const extractedResult = part.result || part.output || (part.toolInvocation ? part.toolInvocation.result : undefined);

				console.debug('[EPIK Widget] tool-* part found:', name, 'state:', extractedState, 'result:', JSON.stringify(extractedResult));
				list.push({
					toolName: name,
					state: extractedState,
					result: extractedResult,
					args: part.args,
					id: part.toolCallId || Math.random().toString()
				});
			}
		}
		return list;
	}

	const processedActions: Record<string, boolean> = {};

	// Watch for Copilot tool invocations (open_modal, scroll_to)
	$effect(() => {
		const msgs = chat.messages;
		if (msgs.length > 0) {
			const lastMsg = msgs[msgs.length - 1];
			if (lastMsg.role === 'assistant' && lastMsg.parts) {
				const tools = extractToolInvocations(lastMsg);
				
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const parts = (lastMsg.parts ?? []) as any[];
				const textContent = parts.filter((p: MessagePart) => p.type === 'text').map((p: MessagePart) => p.text).join('\n');

				for (const tool of tools) {
					const alreadyProcessed = processedActions[tool.id];
					if (tool.state === 'result' && tool.result?.action_triggered && !alreadyProcessed) {
						processedActions[tool.id] = true;
						const actionType = tool.result.action_type || tool.result.type || '';
						const payload = tool.result.payload || tool.result;
						console.log('🤖 [EpikWidget] Disparando acción automática:', actionType, payload);
						chatState.triggerAction(actionType, payload);
						minimizeWithBubble(textContent || (actionType === 'open_movie' ? 'Abriendo horarios...' : 'Navegando...'));
					}
				}
			}
		}
	});

	// Auto-trigger fallback: if AI SDK strips tool results, parse the action from the text output
	$effect(() => {
		const msgs = chat.messages;
		if (msgs.length > 0 && !isLoading) {
			const lastMsg = msgs[msgs.length - 1];
			if (lastMsg.role === 'assistant') {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const parts = (lastMsg.parts ?? []) as any[];
				const textContent = parts.filter((p) => p.type === 'text').map((p) => p.text).join('\n');

				const movieMatch = textContent.match(/https:\/\/action\.epik\/movie_details\/([a-zA-Z0-9-]+)/);
				if (movieMatch && movieMatch[1] && !processedActions[movieMatch[1]]) {
					processedActions[movieMatch[1]] = true;
					console.log('🤖 [EpikWidget] Disparando auto-acción por Regex Text:', movieMatch[1]);
					chatState.triggerAction('movie_details', { movieId: movieMatch[1] });
					minimizeWithBubble(textContent);
				}
				
				const bookingMatch = textContent.match(/https:\/\/action\.epik\/booking\/([a-zA-Z0-9-]+)/);
				if (bookingMatch && bookingMatch[1] && !processedActions[bookingMatch[1]]) {
					processedActions[bookingMatch[1]] = true;
					console.log('🤖 [EpikWidget] Disparando auto-acción de reserva por Regex Text:', bookingMatch[1]);
					chatState.triggerAction('booking', { movieId: bookingMatch[1] });
					minimizeWithBubble(textContent);
				}
			}
		}
	});

	function minimizeWithBubble(rawText: string) {
		// Minimizar chat
		chatState.close();
		
		// Limpiar texto de enlaces Markdown técnicos para que el tooltip se vea natural
		const cleanText = rawText.replace(/\[.*?\]\(https:\/\/action\.epik\/.*?\)/g, '').trim();
		
		if (cleanText) {
			bubbleQuote = cleanText;
			showBubble = true;
			clearTimeout(bubbleTimer);
			bubbleTimer = setTimeout(() => {
				showBubble = false;
			}, 8000);
		}
	}

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

	// Handle custom markdown action links (e.g. https://action.epik/movie_details/ID)
	function handleChatClicks(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const link = target.closest('a');
		if (link && link.href) {
			try {
				const url = new URL(link.href);
				if (url.hostname === 'action.epik') {
					e.preventDefault();
					const pathParts = url.pathname.split('/').filter(Boolean);
					const actionType = pathParts[0];
					const id = pathParts[1];
					console.log('🔗 [EPIK Widget] Intercepted action link:', actionType, id);
					
					const messageEl = link.closest('.prose');
					const text = messageEl ? messageEl.textContent || '¡Listo! Abriendo...' : '¡Listo! Abriendo...';

					if (actionType === 'movie_details' && id) {
						chatState.triggerAction('movie_details', { movieId: id, movieTitle: '' });
						minimizeWithBubble(text);
					} else if (actionType === 'booking' && id) {
						chatState.triggerAction('booking', { movieId: id });
						minimizeWithBubble(text);
					} else if (actionType === 'start_booking' && id) {
						chatState.triggerAction('start_booking', { movieId: id });
						minimizeWithBubble(text);
					}
				}
			} catch {
				// Ignore invalid URLs
			}
		}
	}

	function retryMessage() {
		const msgs = chat.messages;
		if (msgs.length > 0) {
			for (let i = msgs.length - 1; i >= 0; i--) {
				if (msgs[i].role === 'user') {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const parts = (msgs[i].parts ?? []) as any[];
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const content = parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n') || (msgs[i] as any).content || '';
					
					// Si el objeto chat expone un método para setear mensajes, úsalo, sino asignamos
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					if (typeof (chat as any).setMessages === 'function') {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(chat as any).setMessages(msgs.slice(0, i));
					} else {
						chat.messages = msgs.slice(0, i);
					}
					
					// Agregar el parámetro useFallback=true en data
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					if (typeof (chat as any).sendMessage === 'function') {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(chat as any).sendMessage({ role: 'user', parts: [{ type: 'text', text: content }] }, { data: { useFallback: 'true' } });
					} else {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(chat as any).append({ role: 'user', parts: [{ type: 'text', text: content }] }, { data: { useFallback: 'true' } });
					}
					return;
				}
			}
		}
		if (input.trim()) quickSend(input.trim());
	}

	function getActiveThinkingText(): string {
		const msgs = chat.messages;
		if (msgs.length > 0) {
			const lastMsg = msgs[msgs.length - 1];
			if (lastMsg.role === 'assistant' && lastMsg.parts) {
				const tools = extractToolInvocations(lastMsg);
				const lastTool = tools[tools.length - 1];
				if (lastTool) {
					if (lastTool.toolName === 'get_movies') return 'Consultando cartelera de hoy en Sambil Candelaria...';
					if (lastTool.toolName === 'get_showtimes') return 'Buscando funciones y horarios...';
					if (lastTool.toolName === 'open_movie_modal') return 'Abriendo detalles de la película...';
					if (lastTool.toolName === 'start_booking') return 'Preparando butacas para tu compra...';
					if (lastTool.toolName === 'open_seat_map') return 'Abriendo el selector de asientos...';
					if (lastTool.toolName === 'scroll_to_section') return 'Desplazando la pantalla a la cartelera...';
					if (lastTool.toolName === 'open_modal') return 'Abriendo detalles en pantalla...';
					if (lastTool.toolName === 'get_combos') return 'Consultando combos de cotufas...';
				}
			}
		}
		return 'EPIK está pensando' + (loadingSeconds > 0 ? ` (${loadingSeconds}s)` : '...');
	}

	function sendMessage() {
		const text = input.trim();
		console.log('📤 [EPIK Client] Intentando enviar mensaje:', text, 'Estado actual:', chat.status);
		if (!text || chat.status === 'streaming' || chat.status === 'submitted') return;
		console.log('🚀 [EPIK Client] Enviando a:', (import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5173') + '/api/chat');
		chat.sendMessage({ role: 'user', parts: [{ type: 'text', text }] });
		input = '';
	}

	function quickSend(text: string) {
		console.log('📤 [EPIK Client] QuickSend:', text, 'Estado actual:', chat.status);
		if (chat.status === 'streaming' || chat.status === 'submitted') return;
		console.log('🚀 [EPIK Client] Enviando a:', (import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5173') + '/api/chat');
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
	let loadingSeconds = $state(0);
	let loadingTimer: ReturnType<typeof setInterval> | undefined;

	$effect(() => {
		if (isLoading) {
			if (!loadingTimer) {
				loadingSeconds = 0;
				loadingTimer = setInterval(() => {
					loadingSeconds++;
				}, 1000);
			}
		} else {
			if (loadingTimer) {
				clearInterval(loadingTimer);
				loadingTimer = undefined;
			}
		}
		
		return () => {
			if (loadingTimer) clearInterval(loadingTimer);
		};
	});

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
		class="fixed bottom-0 md:bottom-6 right-0 md:right-6 w-full md:w-[420px] h-[85vh] md:h-[620px] z-[100] flex flex-col overflow-hidden bg-black md:rounded-none border-t md:border border-zinc-800 shadow-2xl shadow-black font-sans"
		transition:fly={{ y: 50, duration: 300, opacity: 0 }}
	>
		<!-- Header -->
		<div class="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black">
			<div class="flex items-center gap-3">
				<div class="flex items-center justify-center w-8 h-8 bg-gradient-to-tr from-zinc-300 to-zinc-500 border border-zinc-400/40 rounded-full overflow-hidden relative shadow-inner">
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
		<div class="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar bg-black" bind:this={chatBodyEl} onclick={handleChatClicks} role="presentation">
			<div class="flex flex-col items-start gap-1 max-w-[90%]">
				<div class="epik-ai-bubble px-4 py-3 text-sm text-zinc-200 rounded-2xl rounded-tl-none leading-relaxed shadow-sm">
					{welcomeMessage}
				</div>
				<span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider ml-1 mt-0.5">EPIK • Caracas</span>
			</div>
			
			<!-- Messages -->
			{#each chat.messages as message (message.id)}
				{@const parts = (message.parts ?? []) as unknown as MessagePart[]}
				{@const textContent = parts.filter((p) => p.type === 'text').map((p) => p.text).join('\n')}
				{@const tools = extractToolInvocations(message)}

				<!-- User Message -->
				{#if message.role === 'user'}
					<div class="flex flex-col gap-1 max-w-[85%] self-end items-end">
						<div class="px-4 py-2.5 text-sm rounded-2xl rounded-tr-none bg-zinc-800 text-zinc-200 border border-zinc-700 font-medium shadow-sm">
							{textContent}
						</div>
						<span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mr-1">TÚ</span>
					</div>
				{:else}
					<!-- Assistant Message -->
					<div class="flex flex-col gap-2 max-w-[92%] items-start">
						<!-- Text Content -->
						{#if textContent}
							<div class="epik-ai-bubble px-4 py-3 text-sm rounded-2xl rounded-tl-none text-zinc-200 prose prose-invert prose-sm max-w-none leading-relaxed shadow-sm">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html browser ? DOMPurify.sanitize(marked.parse(textContent) as string) : marked.parse(textContent)}
							</div>
						{:else if tools.length > 0 && tools.every(t => t.state === 'result' || t.state === 'output-available' || t.result) && !isLoading}
							<!-- Fallback: model finished tools but produced no text (finish reason: other) -->
							<div class="epik-ai-bubble px-4 py-3 text-sm rounded-2xl rounded-tl-none text-zinc-400 leading-relaxed shadow-sm italic">
								¡Listo! ¿Hay algo más en lo que pueda ayudarte? 🍿
							</div>
						{/if}

						<!-- Interactive Action Chips & Buttons (Rendered once tool is completed) -->
						{#each tools as tp (tp.id)}
							{#if tp.state === 'result' || tp.state === 'output-available' || tp.result}


								<!-- Copilot Fallback Buttons -->
								{#if tp.toolName === 'navigate_to' && tp.result?.payload?.section}
									<div class="mt-2 p-3 bg-black border border-zinc-800 rounded-2xl flex flex-col gap-2 w-full">
										<div class="flex items-center gap-2 text-xs text-zinc-300">
											<Sparkles class="size-4 text-zinc-300" />
											<span>Navegar a <strong>{tp.result.payload.section}</strong></span>
										</div>
										<button
											type="button"
											onclick={() => chatState.triggerAction('navigate', tp.result?.payload)}
											class="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
										>
											Ir a la sección
										</button>
									</div>
								{/if}

								{#if tp.toolName === 'open_movie_modal' && tp.result?.payload?.query}
									<div class="mt-2 p-3 bg-black border border-zinc-800 rounded-2xl flex flex-col gap-2 w-full">
										<div class="flex items-center gap-2 text-xs text-zinc-300">
											<Film class="size-4 text-zinc-300" />
											<span>Buscaste <strong>{tp.result.payload.query}</strong></span>
										</div>
										<button
											type="button"
											onclick={() => chatState.triggerAction('open_movie', tp.result?.payload)}
											class="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
										>
											Ver horarios
										</button>
									</div>
								{/if}

								{#if tp.toolName === 'start_booking' && tp.result?.payload?.query && tp.result?.payload?.time}
									<div class="mt-2 p-3 bg-black border border-zinc-800 rounded-2xl flex flex-col gap-2 w-full">
										<div class="flex items-center gap-2 text-xs text-zinc-300">
											<Film class="size-4 text-zinc-300" />
											<span>Comprar: <strong>{tp.result.payload.query}</strong> a las <strong>{tp.result.payload.time}</strong></span>
										</div>
										<button
											type="button"
											onclick={() => chatState.triggerAction('start_booking', tp.result?.payload)}
											class="w-full py-1.5 bg-zinc-200 hover:bg-zinc-300 text-black text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer"
										>
											Elegir Butacas
										</button>
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

			<!-- Single, Subtle Thinking Indicator (Gemini Web Style) -->
			{#if isLoading}
				<div class="flex items-center gap-2.5 py-1 px-1 mt-2 text-sm font-sans select-none w-fit z-10 relative animate-pulse" style="animation-duration: 2s;">
					<Sparkles class="size-3.5 text-zinc-300 animate-[spin_4s_linear_infinite]" />
					<span class="tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-400 font-medium">
						{getActiveThinkingText()}
					</span>
				</div>
			{/if}

			<!-- Error Alert State -->
			{#if chat.error}
				<div class="flex flex-col gap-2 p-3.5 bg-red-950/40 border border-red-500/50 rounded-sm text-red-200 text-xs shadow-lg mt-2">
					<div class="flex items-center gap-2">
						<AlertCircle class="size-4 text-red-400 shrink-0" />
						<span class="font-bold">EPIK tuvo un inconveniente</span>
					</div>
					<p class="text-[11px] text-red-300/80 leading-relaxed">
						No pudimos procesar tu mensaje debido a un problema temporal con el servicio de IA o límite de cuota.
					</p>
					<button
						type="button"
						onclick={() => retryMessage()}
						class="self-start mt-1 px-3 py-1.5 bg-red-900/60 hover:bg-red-800 border border-red-500/40 rounded-sm text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
					>
						<RefreshCw class="size-3" />
						Reintentar mensaje
					</button>
				</div>
			{/if}

			{#if chat.messages.length === 0}
				<!-- Quick Actions -->
				<div class="flex flex-wrap gap-2 mt-4">
					<button onclick={() => quickSend('¿Qué películas hay hoy?')} class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors rounded-full">
						¿Qué películas hay hoy?
					</button>
					<button onclick={() => quickSend('¿Cómo funciona el Lunes Popular?')} class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors rounded-full">
						¿Cómo funciona el Lunes Popular?
					</button>
					<button onclick={() => quickSend('Horarios de Spiderman')} class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors rounded-full">
						Horarios de Spiderman
					</button>
					<button onclick={() => quickSend('¿Qué combos tienen?')} class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors rounded-full">
						¿Qué combos tienen?
					</button>
				</div>
			{/if}
		</div>

		<!-- Aura Pensativa Absolute -->
		{#if isLoading}
			<div class="absolute bottom-[76px] -left-1/4 w-[150%] h-48 pointer-events-none z-10 flex items-end justify-center">
				<div class="w-full h-full epik-thinking-aura blur-[30px]"></div>
			</div>
		{/if}

		<!-- Input Area -->
		<div class="p-4 border-t border-zinc-800 bg-black relative z-20">
			<form class="relative flex items-center" onsubmit={(e) => { e.preventDefault(); sendMessage(); }}>
				<input 
					type="text" 
					bind:value={input}
					disabled={isLoading}
					placeholder="ESCRÍBELE A EPIK..." 
					class="w-full bg-[#111] border border-zinc-800 rounded-full py-3 pl-5 pr-14 text-sm font-medium text-white placeholder:text-zinc-500 placeholder:tracking-widest placeholder:text-[10px] placeholder:uppercase focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all disabled:opacity-75"
				/>
				{#if isLoading}
					<button
						type="button"
						onclick={() => chat.stop()}
						class="absolute right-2 p-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center shadow-md shadow-red-900/30"
						title="Detener respuesta"
						aria-label="Detener respuesta"
					>
						<Square class="size-4 fill-current" />
					</button>
				{:else}
					<button 
						type="submit"
						class="absolute right-2 p-2.5 rounded-full bg-zinc-200 text-black hover:bg-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html browser ? DOMPurify.sanitize(marked.parseInline(bubbleQuote) as string) : marked.parseInline(bubbleQuote)}
				<!-- Triangle pointing right to the FAB -->
				<div class="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-l-[8px] border-l-white border-b-[8px] border-b-transparent filter drop-shadow-[2px_0_0_rgba(0,0,0,1)]"></div>
			</div>
		{/if}

		<!-- Floating Action Button -->
		<button 
			class="pointer-events-auto flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-500 border border-zinc-400 text-white shadow-[0_0_30px_rgba(228,228,231,0.25)] hover:scale-105 hover:shadow-[0_0_40px_rgba(228,228,231,0.4)] transition-all group shrink-0 relative"
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

<style>
	.epik-ai-bubble {
		position: relative;
		background: #111;
		z-index: 1;
	}
	.epik-ai-bubble::before {
		content: "";
		position: absolute;
		inset: -1px;
		border-radius: inherit;
		background: linear-gradient(135deg, #e4e4e7, #3b82f6, #b56965, #121212, #e4e4e7);
		background-size: 300% 300%;
		animation: epik-aurora 15s ease infinite;
		z-index: -1;
		opacity: 0.3;
	}
	@keyframes epik-aurora {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
	
	.epik-thinking-aura {
		background: radial-gradient(ellipse at bottom, rgba(228,228,231,0.15) 0%, rgba(59,130,246,0.08) 35%, rgba(181,105,101,0.04) 60%, transparent 75%);
		animation: aura-breathe 2.5s ease-in-out infinite alternate;
	}
	
	@keyframes aura-breathe {
		0% { opacity: 0.4; transform: scaleY(0.8) translateY(10px); filter: hue-rotate(0deg); }
		100% { opacity: 1; transform: scaleY(1.3) translateY(0px); filter: hue-rotate(15deg); }
	}
</style>
