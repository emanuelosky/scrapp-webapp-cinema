<script lang="ts">
	import { chatState } from '$lib/state/chat.svelte';
	import { cartState } from '$lib/state/cart.svelte';
	import X from '@lucide/svelte/icons/x';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Square from '@lucide/svelte/icons/square';
	import { fade, fly, scale } from 'svelte/transition';
	import { Chat } from '@ai-sdk/svelte';
	import { DefaultChatTransport } from 'ai';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Film from '@lucide/svelte/icons/film';
	import ThumbsUp from '@lucide/svelte/icons/thumbs-up';
	import ThumbsDown from '@lucide/svelte/icons/thumbs-down';

	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Message from '$lib/components/ui/message';
	import * as Bubble from '$lib/components/ui/bubble';
	import * as Marker from '$lib/components/ui/marker';
	import * as Avatar from '$lib/components/ui/avatar';

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
						cartStr.push(`Boletos: ${cartState.cartItems.map(c => `${c.seats.length}x ${c.movieTitle} (${c.showtimeTime})`).join(', ')}`);
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
	let textareaEl = $state<HTMLTextAreaElement | null>(null);

	// Auto-crecimiento manual en vez de `field-sizing: content`: ese CSS es
	// reciente y su interacción con el atributo `rows` daba una altura de
	// reposo inconsistente (el botón de enviar quedaba descuadrado respecto
	// al placeholder). Midiendo scrollHeight a mano es el patrón clásico y
	// da control exacto tanto para crecer como para volver a achicarse al
	// vaciar el input.
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		input;
		if (!textareaEl) return;
		textareaEl.style.height = 'auto';
		textareaEl.style.height = Math.min(textareaEl.scrollHeight, 128) + 'px';
	});

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

					const messageEl = link.closest('.epik-ai-bubble');
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

	// Enter envía (como cualquier chat moderno); Shift+Enter inserta una línea
	// nueva. Antes era un <input> de una sola línea que no podía saltar de
	// línea de ninguna forma.
	function handleComposerKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
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
		"E.T. llama a casa... o mejor compra boletos aquí.",
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

	// Reacción del usuario a una respuesta de EPIK (👍/👎 con íconos, no emojis,
	// para no salirse de la estética). Por ahora vive solo en memoria del
	// componente — el objetivo inmediato es la señal visual. Cuando exista un
	// backend de feedback/loyalty, este es el punto exacto donde se envía.
	let reactions = $state<Record<string, 'up' | 'down' | undefined>>({});

	function setReaction(id: string, value: 'up' | 'down') {
		reactions[id] = reactions[id] === value ? undefined : value;
		// TODO(feedback/loyalty): reportar { messageId: id, reaction: value } a un
		// endpoint real cuando exista — ver .agents/08-epik-chatbot.md.
	}

	// Agrupa mensajes consecutivos del mismo rol (Message.Group de shadcn-svelte
	// solo da el contenedor visual; qué mensajes pertenecen a cada grupo lo
	// decide la app). En el uso normal de EPIK esto casi siempre son grupos de
	// 1, porque el chat alterna usuario/asistente — pero cubre el caso real de
	// que el asistente mande varios mensajes seguidos (p. ej. texto + una
	// herramienta que generó su propio mensaje).
	let messageGroups = $derived.by(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const groups: { role: string; messages: any[] }[] = [];
		for (const msg of chat.messages) {
			const lastGroup = groups[groups.length - 1];
			if (lastGroup && lastGroup.role === msg.role) {
				lastGroup.messages.push(msg);
			} else {
				groups.push({ role: msg.role, messages: [msg] });
			}
		}
		return groups;
	});
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
		<div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-black" bind:this={chatBodyEl} onclick={handleChatClicks} role="presentation">
			<div transition:fly={{ y: 12, duration: 350, delay: 200 }}>
				<Message.Group>
					<Message.Root align="start">
						<Message.Avatar>
							<Avatar.Root class="bg-gradient-to-tr from-zinc-300 to-zinc-500 after:border-white/10">
								<img src="/favicon.png" alt="EPIK" class="w-full h-full object-contain p-1.5" />
							</Avatar.Root>
						</Message.Avatar>
						<Message.Content>
								<Bubble.Root variant="epikAiLatest" align="start">
									<Bubble.Content class="px-4 py-3 text-sm rounded-2xl leading-relaxed shadow-sm">
										{welcomeMessage}
									</Bubble.Content>
								</Bubble.Root>
							<Message.Footer class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider px-1">EPIK • Caracas</Message.Footer>
						</Message.Content>
					</Message.Root>
				</Message.Group>
			</div>

			<!-- Messages, agrupados por racha de mismo rol -->
			{#each messageGroups as group, groupIndex (groupIndex)}
				<Message.Group>
					{#each group.messages as message, i (message.id)}
						{@const parts = (message.parts ?? []) as unknown as MessagePart[]}
						{@const textContent = parts.filter((p) => p.type === 'text').map((p) => p.text).join('\n')}
						{@const tools = extractToolInvocations(message)}
						{@const isLastOfGroup = i === group.messages.length - 1}
						{@const align = message.role === 'user' ? 'end' : 'start'}
						{@const isLatestReply = message.role === 'assistant' && message.id === chat.messages[chat.messages.length - 1]?.id}

						<Message.Root {align}>
							{#if message.role === 'assistant'}
								<Message.Avatar class={!isLastOfGroup ? 'opacity-0 select-none pointer-events-none' : ''}>
									<Avatar.Root class="bg-gradient-to-tr from-zinc-300 to-zinc-500 after:border-white/10">
										<img src="/favicon.png" alt="EPIK" class="w-full h-full object-contain p-1.5" />
									</Avatar.Root>
								</Message.Avatar>
							{/if}
							<Message.Content>
								{#if message.role === 'user'}
									<Bubble.Root variant="epikUser" {align}>
										<Bubble.Content class="px-4 py-2.5 text-sm rounded-2xl font-medium shadow-sm">
											{textContent}
										</Bubble.Content>
									</Bubble.Root>
								{:else}
									<!-- Text Content -->
									{#if textContent}
										<Bubble.Root variant={isLatestReply ? 'epikAiLatest' : 'epikAi'} {align}>
											<Bubble.Content class="px-4 py-3 text-sm rounded-2xl prose prose-invert prose-sm max-w-none leading-relaxed shadow-sm">
												<!-- eslint-disable-next-line svelte/no-at-html-tags -->
												{@html browser ? DOMPurify.sanitize(marked.parse(textContent) as string) : marked.parse(textContent)}
											</Bubble.Content>
											<!-- Reacción del usuario a la respuesta (feedback, no decoración): íconos
											     de la misma familia que el resto de la UI, nunca emojis. -->
											<Bubble.Reactions>
												<button
													type="button"
													onclick={() => setReaction(message.id, 'up')}
													aria-label="Buena respuesta"
													aria-pressed={reactions[message.id] === 'up'}
													class="p-0.5 rounded-full transition-colors {reactions[message.id] === 'up' ? 'text-goldenrose-500' : 'text-zinc-500 hover:text-zinc-300'}"
												>
													<ThumbsUp class="size-3.5 {reactions[message.id] === 'up' ? 'fill-current' : ''}" />
												</button>
												<button
													type="button"
													onclick={() => setReaction(message.id, 'down')}
													aria-label="Respuesta poco útil"
													aria-pressed={reactions[message.id] === 'down'}
													class="p-0.5 rounded-full transition-colors {reactions[message.id] === 'down' ? 'text-silverplate-300' : 'text-zinc-500 hover:text-zinc-300'}"
												>
													<ThumbsDown class="size-3.5 {reactions[message.id] === 'down' ? 'fill-current' : ''}" />
												</button>
											</Bubble.Reactions>
										</Bubble.Root>
									{:else if tools.length > 0 && tools.every(t => t.state === 'result' || t.state === 'output-available' || t.result) && !isLoading}
										<!-- Fallback: model finished tools but produced no text (finish reason: other) -->
										<Bubble.Root variant="epikAiLatest" {align}>
											<Bubble.Content class="px-4 py-3 text-sm rounded-2xl text-zinc-400 leading-relaxed shadow-sm italic">
												¡Listo! ¿Hay algo más en lo que pueda ayudarte? 🍿
											</Bubble.Content>
										</Bubble.Root>
									{/if}
								{/if}

								<!-- Interactive Action Chips & Buttons (Rendered once tool is completed) -->
								{#each tools as tp (tp.id)}
									{#if tp.state === 'result' || tp.state === 'output-available' || tp.result}
										<!-- Copilot Fallback Buttons -->
										{#if tp.toolName === 'navigate_to' && tp.result?.payload?.section}
											<Card.Root class="bg-black border-zinc-800 rounded-2xl w-full mt-2 overflow-hidden">
												<Card.Content class="p-3 flex flex-col gap-2">
													<div class="flex items-center gap-2 text-xs text-zinc-300">
														<Sparkles class="size-4 text-zinc-300" />
														<span>Navegar a <strong>{tp.result.payload.section}</strong></span>
													</div>
													<Button
														variant="secondary"
														size="sm"
														onclick={() => chatState.triggerAction('navigate', tp.result?.payload)}
														class="w-full h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider"
													>
														Ir a la sección
													</Button>
												</Card.Content>
											</Card.Root>
										{/if}

										{#if tp.toolName === 'open_movie_modal' && tp.result?.payload?.query}
											<Card.Root class="bg-black border-zinc-800 rounded-2xl w-full mt-2 overflow-hidden">
												<Card.Content class="p-3 flex flex-col gap-2">
													<div class="flex items-center gap-2 text-xs text-zinc-300">
														<Film class="size-4 text-zinc-300" />
														<span>Buscaste <strong>{tp.result.payload.query}</strong></span>
													</div>
													<Button
														variant="secondary"
														size="sm"
														onclick={() => chatState.triggerAction('open_movie', tp.result?.payload)}
														class="w-full h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider"
													>
														Ver horarios
													</Button>
												</Card.Content>
											</Card.Root>
										{/if}

										{#if tp.toolName === 'start_booking' && tp.result?.payload?.query && tp.result?.payload?.time}
											<Card.Root class="bg-black border-zinc-800 rounded-2xl w-full mt-2 overflow-hidden">
												<Card.Content class="p-3 flex flex-col gap-2">
													<div class="flex items-center gap-2 text-xs text-zinc-300">
														<Film class="size-4 text-zinc-300" />
														<span>Comprar: <strong>{tp.result.payload.query}</strong> a las <strong>{tp.result.payload.time}</strong></span>
													</div>
													<Button
														variant="secondary"
														size="sm"
														onclick={() => chatState.triggerAction('start_booking', tp.result?.payload)}
														class="w-full h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-zinc-200 text-black hover:bg-zinc-300"
													>
														Elegir Butacas
													</Button>
												</Card.Content>
											</Card.Root>
										{/if}
									{/if}
								{/each}

								{#if textContent && isLastOfGroup}
									<Message.Footer class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider px-1">{message.role === 'user' ? 'TÚ' : 'EPIK'}</Message.Footer>
								{/if}
							</Message.Content>
						</Message.Root>
					{/each}
				</Message.Group>
			{/each}

			<!-- Single, Subtle Thinking Indicator (Gemini Web Style) -->
			{#if isLoading}
				<Marker.Root role="status" class="py-1 px-1 mt-1 w-fit animate-pulse" style="animation-duration: 2s;">
					<Marker.Icon>
						<Sparkles class="size-3.5 text-zinc-300 animate-[spin_4s_linear_infinite]" />
					</Marker.Icon>
					<Marker.Content class="tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-400 font-medium">
						{getActiveThinkingText()}
					</Marker.Content>
				</Marker.Root>
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

		</div>

		<!-- Aura Pensativa Absolute -->
		{#if isLoading}
			<div class="absolute bottom-[76px] -left-1/4 w-[150%] h-48 pointer-events-none z-10 flex items-end justify-center">
				<div class="w-full h-full epik-thinking-aura blur-[30px]"></div>
			</div>
		{/if}

		<!-- Suggested Actions -->
		{#if chat.messages.length === 0}
			<div class="flex flex-wrap gap-2 px-4 pb-2 z-20 absolute bottom-full left-0 w-full mb-1">
				<div in:fly={{ y: 8, duration: 250, delay: 840 }}>
					<Button variant="outline" size="sm" onclick={() => quickSend('¿Qué películas están hoy?')} class="h-8 text-xs font-bold uppercase tracking-wider rounded-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
						¿Qué películas hay hoy?
					</Button>
				</div>
				<div in:fly={{ y: 8, duration: 250, delay: 930 }}>
					<Button variant="outline" size="sm" onclick={() => quickSend('Horarios de Spiderman')} class="h-8 text-xs font-bold uppercase tracking-wider rounded-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
						Horarios de Spiderman
					</Button>
				</div>
				<div in:fly={{ y: 8, duration: 250, delay: 1020 }}>
					<Button variant="outline" size="sm" onclick={() => quickSend('¿Qué combos tienen?')} class="h-8 text-xs font-bold uppercase tracking-wider rounded-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
						¿Qué combos tienen?
					</Button>
				</div>
			</div>
		{/if}

		<!-- Input Area -->
		<div class="p-4 border-t border-zinc-800 bg-black relative z-20">
			<form class="relative flex items-end" onsubmit={(e) => { e.preventDefault(); sendMessage(); }}>
				<Textarea
					bind:ref={textareaEl}
					bind:value={input}
					disabled={isLoading}
					onkeydown={handleComposerKeydown}
					rows={1}
					placeholder="Escríbele a EPIK..."
					class="w-full bg-[#111] border-zinc-800 rounded-2xl py-3 pl-5 pr-14 text-sm leading-5 font-medium text-white placeholder:text-zinc-500 focus-visible:border-zinc-600 focus-visible:ring-zinc-600 transition-all disabled:opacity-75 resize-none min-h-[46px] max-h-32"
				/>
				{#if isLoading}
					<button
						type="button"
						onclick={() => chat.stop()}
						class="absolute right-[6px] bottom-[5px] size-9 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center shadow-md shadow-red-900/30"
						title="Detener respuesta"
						aria-label="Detener respuesta"
					>
						<Square class="size-4 fill-current" />
					</button>
				{:else}
					<button
						type="submit"
						class="absolute right-[6px] bottom-[5px] size-9 rounded-full bg-zinc-200 text-black hover:bg-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
						disabled={!input.trim()}
						title="Enviar mensaje"
						aria-label="Enviar mensaje"
					>
						<ArrowUp class="size-4 stroke-[2.5px]" />
					</button>
				{/if}
			</form>
		</div>
	</div>
{:else}
	{@const isCheckoutFlow = $page.url.pathname.includes('/booking') || $page.url.pathname.includes('/checkout') || $page.url.pathname.includes('/concessions')}
	<div class="fixed right-6 md:right-8 z-[90] flex items-end justify-end gap-4 pointer-events-none transition-all duration-300 {isCheckoutFlow ? 'bottom-32 md:bottom-40' : (scrollY > 800 ? 'bottom-[5.5rem] md:bottom-[6.5rem]' : 'bottom-6 md:bottom-8')}">
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
	.epik-thinking-aura {
		background: radial-gradient(ellipse at bottom, rgba(228,228,231,0.15) 0%, rgba(59,130,246,0.08) 35%, rgba(181,105,101,0.04) 60%, transparent 75%);
		animation: aura-breathe 2.5s ease-in-out infinite alternate;
	}

	@keyframes aura-breathe {
		0% { opacity: 0.4; transform: scaleY(0.8) translateY(10px); filter: hue-rotate(0deg); }
		100% { opacity: 1; transform: scaleY(1.3) translateY(0px); filter: hue-rotate(15deg); }
	}
</style>
