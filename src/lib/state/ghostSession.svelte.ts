import { browser } from '$app/environment';
import { SvelteDate } from 'svelte/reactivity';
import { API_BASE } from '$lib/utils/api';
import type { GhostSessionData } from './booking.types';

export class GhostSessionState {
	ghostSession = $state<GhostSessionData | null>(null);
	ghostAvailableCount = $state<number | null>(null);
	retentionTimeMinutes = $state<number>(5); // default fallback
	timeRemainingSeconds = $state<number | null>(null);
	showExtensionModal = $state<boolean>(false);
	private timerInterval: ReturnType<typeof setInterval> | null = null;
	
	onExpireCallback: (() => void) | null = null;

	get ghostVentaId() { return this.ghostSession?.ventaTemporalId || null; }
	get ghostStatusCode() { return this.ghostSession ? 'G OK' : ''; }

	async fetchGhostStatus() {
		if (!browser) return;
		try {
			const res = await fetch(`${API_BASE}/api/kiosk/ghost-pool/status`);
			if (res.ok) {
				const data = await res.json();
				if (data.success) {
					this.ghostAvailableCount = data.availablePreHeated;
				}
			}
		} catch {
			// Silencioso
		}
	}

	startTimer(lockedAtStr: string) {
		if (!browser) return;
		this.stopTimer();

		const lockedAt = new SvelteDate(lockedAtStr).getTime();
		const retentionMs = this.retentionTimeMinutes * 60 * 1000;

		this.timerInterval = setInterval(() => {
			const now = Date.now();
			const elapsed = now - lockedAt;
			const remaining = Math.max(0, retentionMs - elapsed);
			this.timeRemainingSeconds = Math.floor(remaining / 1000);

			if (this.timeRemainingSeconds <= 60 && this.timeRemainingSeconds > 0) {
				if (!this.showExtensionModal) this.showExtensionModal = true;
			} else if (this.timeRemainingSeconds === 0) {
				this.stopTimer();
				if (this.onExpireCallback) this.onExpireCallback();
			}
		}, 1000);
	}

	stopTimer() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	async extendSession() {
		if (!browser) return;
		if (!this.ghostSession) return;

		try {
			const ghostUsername = this.ghostSession.ghostUsername;
			const res = await fetch(`${API_BASE}/api/kiosk/ghost-pool/extend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: ghostUsername })
			});

			if (res.ok) {
				const newLockedAt = new SvelteDate().toISOString();
				this.ghostSession.lockedAt = newLockedAt;
				this.showExtensionModal = false;
				this.startTimer(newLockedAt);
				return true;
			} else {
				console.error('No se pudo extender el tiempo.');
			}
		} catch (e) {
			console.error('Error extendiendo sesión:', e);
		}
		return false;
	}

	releaseGhost() {
		if (!browser) return;
		this.stopTimer();
		this.showExtensionModal = false;

		if (this.ghostSession) {
			try {
				const ghostUsername = this.ghostSession.ghostUsername;
				navigator.sendBeacon(`${API_BASE}/api/kiosk/ghost-pool/release`, JSON.stringify({ username: ghostUsername }));
			} catch {
				// Omitir errores durante limpieza
			}
		}
		
		this.ghostSession = null;
		this.timeRemainingSeconds = null;
	}
}

export const ghostSessionState = new GhostSessionState();
