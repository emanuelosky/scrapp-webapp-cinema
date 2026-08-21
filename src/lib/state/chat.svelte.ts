export const chatState = $state({
	isOpen: false,
	pendingAction: null as { type: string, payload: unknown } | null,
	toggle() {
		chatState.isOpen = !chatState.isOpen;
	},
	open() {
		chatState.isOpen = true;
	},
	close() {
		chatState.isOpen = false;
	},
	triggerAction(type: string, payload: unknown) {
		chatState.pendingAction = { type, payload };
	},
	clearAction() {
		chatState.pendingAction = null;
	}
});
