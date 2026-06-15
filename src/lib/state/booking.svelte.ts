import { browser } from '$app/environment';
import { SvelteDate } from 'svelte/reactivity';
import { toast } from 'svelte-sonner';
import { API_BASE } from '$lib/utils/api';
import type { Movie, ShowtimeDetails } from '$lib/types';
import type { CartItem } from './booking.types';

import { cartState } from './cart.svelte';
import { ghostSessionState } from './ghostSession.svelte';
import { seatMapState } from './seatMap.svelte';

export class BookingState {
	get activeSelection() { return seatMapState.activeSelection; }
	get cartItems() { return cartState.cartItems; }
	get ghostSession() { return ghostSessionState.ghostSession; }
	get lastCompletedSale() { return cartState.lastCompletedSale; }
	set lastCompletedSale(val) { cartState.lastCompletedSale = val; }
	
	get matrix() { return seatMapState.matrix; }
	get selectedConcessions() { return cartState.selectedConcessions; }

	get customerName() { return cartState.customerName; }
	set customerName(val) { cartState.customerName = val; }
	get customerEmail() { return cartState.customerEmail; }
	set customerEmail(val) { cartState.customerEmail = val; }
	get customerDocument() { return cartState.customerDocument; }
	set customerDocument(val) { cartState.customerDocument = val; }
	get paymentMethod() { return cartState.paymentMethod; }
	set paymentMethod(val) { cartState.paymentMethod = val; }
	
	get movie() { return seatMapState.activeSelection.movie; }
	get selectedDate() { return seatMapState.activeSelection.selectedDate; }
	get selectedShowtime() { return seatMapState.activeSelection.selectedShowtime; }
	get selectedSeats() { return seatMapState.activeSelection.selectedSeats; }
	get tariffs() { return seatMapState.activeSelection.tariffs; }
	get ticketQuantities() { return seatMapState.activeSelection.ticketQuantities; }
	get allPosTariffs() { return seatMapState.activeSelection.allPosTariffs; }
	get defaultTariffsIds() { return seatMapState.activeSelection.defaultTariffsIds; }

	get ghostVentaId() { return ghostSessionState.ghostVentaId; }
	get ghostStatusCode() { return ghostSessionState.ghostStatusCode; }
	get ghostAvailableCount() { return ghostSessionState.ghostAvailableCount; }
	get timeRemainingSeconds() { return ghostSessionState.timeRemainingSeconds; }
	get showExtensionModal() { return ghostSessionState.showExtensionModal; }
	set showExtensionModal(val: boolean) { ghostSessionState.showExtensionModal = val; }

	get totalTickets() { return seatMapState.totalTickets; }
	get activeSelectionPrice() { return seatMapState.activeSelectionPrice; }
	get totalPrice() { return cartState.totalPrice + seatMapState.activeSelectionPrice; }
	get canProceed() { return seatMapState.canProceed; }
	get isProcessing() { return seatMapState.isProcessing; }
	get loadingMessage() { return seatMapState.loadingMessage; }

	constructor() {
		if (browser) {
			this.loadFromLocalStorage();
			ghostSessionState.onExpireCallback = () => this.expireSession();
		}
	}

	startBooking(movie: Movie, date: string, showtime: ShowtimeDetails) {
		seatMapState.startBooking(movie, date, showtime);
		ghostSessionState.ghostAvailableCount = null;
	}

	toggleSeat(seatId: string, seatType: string = 'General', forceDisabledTariff: boolean = false) {
		seatMapState.toggleSeat(seatId, seatType, forceDisabledTariff);
	}

	updateConcession(id: string, name: string, price: number, delta: number) {
		cartState.updateConcession(id, name, price, delta);
	}

	saveToLocalStorage() {
		if (!browser) return;
		try {
			const state = {
				activeSelection: seatMapState.activeSelection,
				cartItems: cartState.cartItems,
				ghostSession: ghostSessionState.ghostSession,
				lastCompletedSale: cartState.lastCompletedSale,
				timestamp: Date.now()
			};
			localStorage.setItem('scrapp_booking_state', JSON.stringify(state));
		} catch (e) {
			console.error('Failed to save state:', e);
		}
	}

	loadFromLocalStorage() {
		if (!browser) return false;
		try {
			const stateStr = localStorage.getItem('scrapp_booking_state');
			if (!stateStr) return false;

			const state = JSON.parse(stateStr);

			if (state.timestamp && Date.now() - state.timestamp < 15 * 60 * 1000) {
				if (state.activeSelection) seatMapState.activeSelection = state.activeSelection;
				if (state.cartItems) cartState.cartItems = state.cartItems;
				if (state.ghostSession) ghostSessionState.ghostSession = state.ghostSession;
				if (state.lastCompletedSale) cartState.lastCompletedSale = state.lastCompletedSale;
				return true;
			} else {
				localStorage.removeItem('scrapp_booking_state');
			}
		} catch (e) {
			console.error('Failed to load state:', e);
		}
		return false;
	}

	async loadSeats() {
		if (!seatMapState.activeSelection.selectedShowtime || !seatMapState.activeSelection.selectedShowtime.id) return;
		seatMapState.isProcessing = true;
		seatMapState.loadingMessage = 'Conectando con el cine...';
		try {
			const maxRetries = 15;
			const delayMs = 4000;

			for (let i = 0; i < maxRetries; i++) {
				try {
					if (i > 0) seatMapState.loadingMessage = 'Despertando el servidor del cine. Esto puede tomar hasta 50 segundos, por favor espera...';

					try {
						const settingsRes = await fetch(`${API_BASE}/api/kiosk/settings`);
						if (settingsRes.ok) {
							const { settings } = await settingsRes.json();
							if (settings && settings.retention_time_minutes) {
								ghostSessionState.retentionTimeMinutes = settings.retention_time_minutes;
							}
						}
					} catch (e) { /* ignored */ }

					const res = await fetch(`${API_BASE}/api/pos/fetch-seats/${seatMapState.activeSelection.selectedShowtime.id}`);
					const contentType = res.headers.get('content-type');
					if (res.ok && contentType && contentType.includes('application/json')) {
						const data = await res.json();
						if (data.matrix) {
							seatMapState.matrix = data.matrix;
							seatMapState.lastSyncTimestamp = Date.now();
							this.loadFromLocalStorage();

							if (data.tariffsData && data.tariffsData.success) {
								const tariffsData = data.tariffsData;
								const allowedIds = tariffsData.allowedTariffs || [];
								const defaultIds = tariffsData.defaultTariffs || [];
								const allTariffs = tariffsData.posTariffs || [];
								seatMapState.activeSelection.defaultTariffsIds = defaultIds;
								seatMapState.activeSelection.allPosTariffs = allTariffs.map((t: Record<string, unknown>) => ({
									id: t.id as string,
									nombre: (t.nombre || '') as string,
									serie: (t.serie || t.prefix || '') as string,
									precio: Number(t.precio || t.valor || t.monto || 0)
								}));
								seatMapState.activeSelection.tariffs = seatMapState.activeSelection.allPosTariffs.filter(t => allowedIds.includes(t.id));
							} else {
								try {
									const tariffsRes = await fetch(`${API_BASE}/api/tarifas?showtimeId=${seatMapState.activeSelection.selectedShowtime.id}`);
									if (tariffsRes.ok) {
										const tariffsData = await tariffsRes.json();
										if (tariffsData.success) {
											const allowedIds = tariffsData.allowedTariffs || [];
											const defaultIds = tariffsData.defaultTariffs || [];
											const allTariffs = tariffsData.posTariffs || [];
											seatMapState.activeSelection.defaultTariffsIds = defaultIds;
											seatMapState.activeSelection.allPosTariffs = allTariffs.map((t: Record<string, unknown>) => ({
												id: t.id as string,
												nombre: (t.nombre || '') as string,
												serie: (t.serie || t.prefix || '') as string,
												precio: Number(t.precio || t.valor || t.monto || 0)
											}));
											seatMapState.activeSelection.tariffs = seatMapState.activeSelection.allPosTariffs.filter(t => allowedIds.includes(t.id));
										}
									}
								} catch (e) {
									console.error('Error fetching fallback tariffs:', e);
								}
							}

							seatMapState.loadingMessage = '';
							seatMapState.isProcessing = false;
							return;
						}
					}
					throw new Error('Servidor no disponible aún');
				} catch {
					if (i === maxRetries - 1) {
						seatMapState.matrix = seatMapState.generateMockMatrix();
						seatMapState.loadingMessage = 'Mostrando mapa simulado (Fallo de conexión)';
						setTimeout(() => seatMapState.loadingMessage = '', 4000);
					} else {
						await new Promise(resolve => setTimeout(resolve, delayMs));
					}
				}
			}
		} finally {
			seatMapState.isProcessing = false;
		}
	}

	async addSelectionToCart() {
		seatMapState.isProcessing = true;
		seatMapState.loadingMessage = 'Añadiendo butacas al carrito...';

		try {
			const seatsQueue = [...seatMapState.activeSelection.selectedSeats];
			const tarifaGroups: Record<string, unknown>[] = [];

			for (const tariff of seatMapState.activeSelection.tariffs) {
				const qty = seatMapState.activeSelection.ticketQuantities[tariff.id] || 0;
				if (qty <= 0) continue;

				tarifaGroups.push({
					id_tarifa: tariff.id,
					serie_tarifa: tariff.serie,
					precio_tarifa: String(tariff.precio),
					cantidad_entradas: qty,
					butacas_elegidas: seatsQueue.splice(0, qty)
				});
			}

			if (tarifaGroups.length === 0) throw new Error('No hay tarifas seleccionadas.');

			const numero_funcion = seatMapState.activeSelection.selectedShowtime?.numero_funcion;
			const numero_sala = seatMapState.activeSelection.selectedShowtime?.numero_sala;

			if (!numero_funcion || !numero_sala) throw new Error('Falta numero_funcion o numero_sala');

			const payload: Record<string, unknown> = {
				id_funcion: seatMapState.activeSelection.selectedShowtime?.id,
				numero_funcion,
				numero_sala,
				tarifa_groups: tarifaGroups
			};

			if (ghostSessionState.ghostSession) {
				payload.existingGhostUsername = ghostSessionState.ghostSession.ghostUsername;
			}

			const response = await fetch(`${API_BASE}/api/kiosk/lock-seats`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const data = await response.json();
			if (!data.success) throw new Error(data.error || 'Fallo al bloquear butacas en el servidor');

			const lockedAtStr = new SvelteDate().toISOString();

			if (!ghostSessionState.ghostSession) {
				ghostSessionState.ghostSession = {
					ventaTemporalId: data.ventaTemporalId,
					ghostUsername: data.ghostUsername,
					lockedAt: lockedAtStr
				};
				ghostSessionState.startTimer(lockedAtStr);
			} else {
				ghostSessionState.ghostSession.lockedAt = lockedAtStr;
				ghostSessionState.startTimer(lockedAtStr);
			}

			const itemTariffs = seatMapState.activeSelection.tariffs.filter(t => seatMapState.activeSelection.ticketQuantities[t.id] > 0).map(t => ({
				nombre: t.nombre,
				precio: t.precio,
				qty: seatMapState.activeSelection.ticketQuantities[t.id]
			}));

			const existingItemIndex = cartState.cartItems.findIndex(item => item.showtimeId === seatMapState.activeSelection.selectedShowtime!.id);

			if (existingItemIndex >= 0) {
				const existingItem = cartState.cartItems[existingItemIndex];
				existingItem.seats = [...existingItem.seats, ...seatMapState.activeSelection.selectedSeats];
				existingItem.subtotal += seatMapState.activeSelectionPrice;

				for (const t of itemTariffs) {
					const existingTariff = existingItem.tariffs.find(et => et.nombre === t.nombre);
					if (existingTariff) existingTariff.qty += t.qty;
					else existingItem.tariffs.push(t);
				}
				cartState.cartItems[existingItemIndex] = existingItem;
			} else {
				const newItem: CartItem = {
					showtimeId: seatMapState.activeSelection.selectedShowtime!.id,
					movieTitle: seatMapState.activeSelection.movie?.title || 'Película',
					moviePoster: seatMapState.activeSelection.movie?.poster || '',
					showtimeDate: seatMapState.activeSelection.selectedDate || '',
					showtimeTime: seatMapState.activeSelection.selectedShowtime!.time,
					seats: [...seatMapState.activeSelection.selectedSeats],
					tariffs: itemTariffs,
					subtotal: seatMapState.activeSelectionPrice
				};
				cartState.cartItems = [...cartState.cartItems, newItem];
			}

			seatMapState.activeSelection.selectedSeats = [];
			seatMapState.activeSelection.ticketQuantities = {};
			this.saveToLocalStorage();
			return true;
		} catch (e) {
			console.error('Error al bloquear butacas:', e);
			return false;
		} finally {
			seatMapState.isProcessing = false;
			seatMapState.loadingMessage = '';
		}
	}

	async checkout(pago: unknown) {
		if (!browser) return;
		if (!ghostSessionState.ghostSession) throw new Error("No hay una sesión activa");

		seatMapState.isProcessing = true;
		seatMapState.loadingMessage = 'Procesando pago y facturación...';

		try {
			const payload = {
				ghostUsername: ghostSessionState.ghostSession.ghostUsername,
				pago: pago
			};

			const response = await fetch(`${API_BASE}/api/kiosk/checkout`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const data = await response.json();
			if (!data.success) throw new Error(data.error || 'Error desconocido al facturar');

			cartState.lastCompletedSale = {
				cartItems: [...cartState.cartItems],
				concessions: [...cartState.selectedConcessions],
				customerEmail: cartState.customerEmail,
				orderTotal: cartState.totalPrice
			};

			ghostSessionState.releaseGhost();
			cartState.clear();
			seatMapState.activeSelection.selectedSeats = [];
			seatMapState.activeSelection.ticketQuantities = {};
			this.saveToLocalStorage();

			return true;
		} catch (e) {
			console.error('Error en checkout:', e);
			throw e;
		} finally {
			seatMapState.isProcessing = false;
			seatMapState.loadingMessage = '';
		}
	}

	expireSession() {
		if (!browser) return;
		ghostSessionState.releaseGhost();
		cartState.clear();
		seatMapState.activeSelection.selectedSeats = [];
		seatMapState.activeSelection.ticketQuantities = {};
		localStorage.removeItem('scrapp_booking_state');

		setTimeout(() => {
			let secondsLeft = 10;
			const toastId = toast.error(`Tu tiempo expiró. El carrito se ha vaciado. Volviendo al inicio en ${secondsLeft}s...`, {
				duration: 10000,
				onAutoClose: () => { window.location.href = '/'; },
				onDismiss: () => { window.location.href = '/'; }
			});

			const interval = setInterval(() => {
				secondsLeft--;
				if (secondsLeft <= 0) {
					clearInterval(interval);
					window.location.href = '/';
				} else {
					toast.error(`Tu tiempo expiró. El carrito se ha vaciado. Volviendo al inicio en ${secondsLeft}s...`, {
						id: toastId,
						duration: 10000,
					});
				}
			}, 1000);
		}, 50);
	}

	syncState() {
		if (!browser) return;
		this.loadFromLocalStorage();

		if (ghostSessionState.ghostSession) {
			try {
				const { lockedAt } = ghostSessionState.ghostSession;
				const elapsed = Date.now() - new SvelteDate(lockedAt).getTime();
				const retentionMs = ghostSessionState.retentionTimeMinutes * 60 * 1000;

				if (elapsed >= retentionMs) this.expireSession();
				else ghostSessionState.startTimer(lockedAt);
			} catch (e) { /* ignored */ }
		} else {
			if (seatMapState.activeSelection.selectedShowtime && seatMapState.lastSyncTimestamp > 0) {
				const elapsed = Date.now() - seatMapState.lastSyncTimestamp;
				if (elapsed > 2 * 60 * 1000) this.loadSeats();
			}
		}
	}

	fetchGhostStatus() {
		return ghostSessionState.fetchGhostStatus();
	}

	extendSession() {
		return ghostSessionState.extendSession();
	}
}

export const bookingState = new BookingState();
