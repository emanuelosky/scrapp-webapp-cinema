export const chatState = $state({
	isOpen: false,
	contextData: '',
	pendingAction: null as { type: string; payload: unknown } | null,

	// La burbuja proactiva vive acá, no dentro de EpikWidget, porque la
	// disparan dos piezas distintas: el lanzador ligero (frases cada tanto,
	// siempre montado) y el panel pesado (cuando EPIK se minimiza solo tras
	// ejecutar una acción). El panel puede ni siquiera estar cargado todavía.
	bubbleText: '',
	bubbleVisible: false,

	toggle() {
		chatState.isOpen = !chatState.isOpen;
	},
	open() {
		chatState.isOpen = true;
		chatState.bubbleVisible = false;
	},
	close() {
		chatState.isOpen = false;
	},
	showBubble(text: string) {
		if (!text) return;
		chatState.bubbleText = text;
		chatState.bubbleVisible = true;
	},
	hideBubble() {
		chatState.bubbleVisible = false;
	},
	triggerAction(type: string, payload: unknown) {
		chatState.pendingAction = { type, payload };
	},
	clearAction() {
		chatState.pendingAction = null;
	}
});
