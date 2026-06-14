import type { Movie, ShowtimeDetails } from '$lib/types';
import type { CFDCell } from '$lib/utils/cfd';
import { browser } from '$app/environment';
import { SvelteDate } from 'svelte/reactivity';
import { toast } from 'svelte-sonner';

export interface ConcessionItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
}

export interface TariffItem {
	id: string;
	nombre: string;        // Nombre limpio: "COMPLETO"
	serie: string;         // Prefijo del POS: "G1" — requerido por ventaTemporal como serie_tarifa
	precio: number;
}

export interface CartItem {
	showtimeId: string;
	movieTitle: string;
	moviePoster: string;
	showtimeDate: string;
	showtimeTime: string;
	seats: string[];
	tariffs: { nombre: string; precio: number; qty: number }[];
	subtotal: number;
}

export interface GhostSessionData {
	ventaTemporalId: string;
	ghostUsername: string;
	lockedAt: string;
}

export interface ActiveSelection {
	movie: Movie | null;
	selectedDate: string | null;
	selectedShowtime: ShowtimeDetails | null;
	tariffs: TariffItem[];
	allPosTariffs: TariffItem[];
	defaultTariffsIds: string[];
	ticketQuantities: Record<string, number>;
	selectedSeats: string[];
}

export class BookingState {
	// "In Progress" selection
	activeSelection = $state<ActiveSelection>({
		movie: null,
		selectedDate: null,
		selectedShowtime: null,
		tariffs: [],
		allPosTariffs: [],
		defaultTariffsIds: [],
		ticketQuantities: {},
		selectedSeats: []
	});

	// Confirmed cart items in POS
	cartItems = $state<CartItem[]>([]);

	// Ghost User Status / POS transaction
	ghostSession = $state<GhostSessionData | null>(null);

	// Grid state (belongs to activeSelection view)
	matrix = $state<CFDCell[][]>([]);

	// Concessions State
	selectedConcessions = $state<ConcessionItem[]>([]);

	// Checkout State
	customerName = $state('');
	customerEmail = $state('');
	customerDocument = $state('');
	paymentMethod = $state<'pago_movil' | 'zelle' | 'card' | null>(null);
	isProcessing = $state(false);

	// Inactivity & Session Recovery
	ghostAvailableCount = $state<number | null>(null);
	lastSyncTimestamp = $state<number>(0);
	retentionTimeMinutes = $state<number>(5); // default fallback
	timeRemainingSeconds = $state<number | null>(null);
	showExtensionModal = $state<boolean>(false);
	private timerInterval: ReturnType<typeof setInterval> | null = null;

	constructor() {
		if (browser) {
			this.loadFromLocalStorage();
		}
	}

	// --- Getters that map to activeSelection ---
	get movie() { return this.activeSelection.movie; }
	get selectedDate() { return this.activeSelection.selectedDate; }
	get selectedShowtime() { return this.activeSelection.selectedShowtime; }
	get selectedSeats() { return this.activeSelection.selectedSeats; }
	get tariffs() { return this.activeSelection.tariffs; }
	get ticketQuantities() { return this.activeSelection.ticketQuantities; }
	get allPosTariffs() { return this.activeSelection.allPosTariffs; }
	get defaultTariffsIds() { return this.activeSelection.defaultTariffsIds; }

	// Legacy getter for backwards compatibility
	get ghostVentaId() { return this.ghostSession?.ventaTemporalId || null; }
	get ghostStatusCode() { return this.ghostSession ? 'G OK' : ''; }

	get totalTickets() {
		// Only from active selection (cart tickets are already locked)
		return Object.values(this.activeSelection.ticketQuantities).reduce((a, b) => a + b, 0);
	}

	get activeSelectionPrice() {
		let total = 0;
		for (const tariff of this.activeSelection.tariffs) {
			const qty = this.activeSelection.ticketQuantities[tariff.id] || 0;
			total += qty * tariff.precio;
		}
		return total;
	}

	get totalPrice() {
		const cartItemsTotal = this.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
		const concessionsTotal = this.selectedConcessions.reduce((sum, item) => sum + (item.price * item.quantity), 0);
		return cartItemsTotal + this.activeSelectionPrice + concessionsTotal;
	}

	get canProceed() {
		return this.totalTickets > 0 && this.activeSelection.selectedSeats.length === this.totalTickets;
	}

	startBooking(movie: Movie, date: string, showtime: ShowtimeDetails) {
		this.activeSelection = {
			movie,
			selectedDate: date,
			selectedShowtime: showtime,
			tariffs: [],
			allPosTariffs: [],
			defaultTariffsIds: [],
			ticketQuantities: {},
			selectedSeats: []
		};
		
		this.matrix = []; // We will load this async
		this.ghostAvailableCount = null;
	}

	saveToLocalStorage() {
		if (!browser) return;
		try {
			const state = {
				activeSelection: this.activeSelection,
				cartItems: this.cartItems,
				ghostSession: this.ghostSession,
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

			// Restaurar toda la sesión si existe y no ha caducado
			if (state.timestamp && Date.now() - state.timestamp < 15 * 60 * 1000) {
				if (state.activeSelection) this.activeSelection = state.activeSelection;
				if (state.cartItems) this.cartItems = state.cartItems;
				if (state.ghostSession) {
					this.ghostSession = state.ghostSession;
				}
				return true;
			} else {
				// Expirado
				localStorage.removeItem('scrapp_booking_state');
			}
		} catch (e) {
			console.error('Failed to load state:', e);
		}
		return false;
	}

	loadingMessage = $state('');

	async loadSeats() {
		if (!this.selectedShowtime || !this.selectedShowtime.id) return;
		this.isProcessing = true;
		this.loadingMessage = 'Conectando con el cine...';
		try {
			// Suponiendo que scrapp-administrative-v2 está corriendo en localhost:5173 en dev
			// y en prod tiene otro dominio. Esto debería configurarse por .env o un proxy en svelte.config
			// Para ahora usamos un path relativo si la API estuviera en el mismo dominio, pero 
			// como están separados, usaremos la URL base de admin
			const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'https://scrapp-backoffice.onrender.com';
			const maxRetries = 15; // Unos 45-60 segundos de espera total
			const delayMs = 4000;

			for (let i = 0; i < maxRetries; i++) {
				try {
					if (i > 0) {
						this.loadingMessage = 'Despertando el servidor del cine. Esto puede tomar hasta 50 segundos, por favor espera...';
					}

					// Fetch Kiosk Settings for retention time
					try {
						const settingsRes = await fetch(`${API_BASE}/api/kiosk/settings`);
						if (settingsRes.ok) {
							const { settings } = await settingsRes.json();
							if (settings && settings.retention_time_minutes) {
								this.retentionTimeMinutes = settings.retention_time_minutes;
							}
						}
					} catch {
						// Ignorar si falla la carga de settings, usamos default
					}

					const res = await fetch(`${API_BASE}/api/pos/fetch-seats/${this.selectedShowtime.id}`);

					// Render a veces devuelve un HTML 502 Bad Gateway mientras despierta
					const contentType = res.headers.get('content-type');
					if (res.ok && contentType && contentType.includes('application/json')) {
						const data = await res.json();
						if (data.matrix) {
							this.matrix = data.matrix;
							this.lastSyncTimestamp = Date.now();

							// Check local storage for restored state
							this.loadFromLocalStorage();

							// Process tariffs from the integrated fetch-seats response if available,
							// otherwise fallback to a separate API call.
							if (data.tariffsData && data.tariffsData.success) {
								const tariffsData = data.tariffsData;
								const allowedIds = tariffsData.allowedTariffs || [];
								const defaultIds = tariffsData.defaultTariffs || [];
								const allTariffs = tariffsData.posTariffs || [];
								this.activeSelection.defaultTariffsIds = defaultIds;
								this.activeSelection.allPosTariffs = allTariffs.map((t: Record<string, unknown>) => ({
									id: t.id as string,
									nombre: (t.nombre || '') as string,
									serie: (t.serie || t.prefix || '') as string,
									precio: Number(t.precio || t.valor || t.monto || 0)
								}));
								this.activeSelection.tariffs = this.activeSelection.allPosTariffs.filter(t => allowedIds.includes(t.id));
							} else {
								try {
									const tariffsRes = await fetch(`${API_BASE}/api/tarifas?showtimeId=${this.selectedShowtime.id}`);
									if (tariffsRes.ok) {
										const tariffsData = await tariffsRes.json();
										if (tariffsData.success) {
											const allowedIds = tariffsData.allowedTariffs || [];
											const defaultIds = tariffsData.defaultTariffs || [];
											const allTariffs = tariffsData.posTariffs || [];
											this.activeSelection.defaultTariffsIds = defaultIds;
											this.activeSelection.allPosTariffs = allTariffs.map((t: Record<string, unknown>) => ({
												id: t.id as string,
												nombre: (t.nombre || '') as string,
												serie: (t.serie || t.prefix || '') as string,
												precio: Number(t.precio || t.valor || t.monto || 0)
											}));
											this.activeSelection.tariffs = this.activeSelection.allPosTariffs.filter(t => allowedIds.includes(t.id));
										}
									}
								} catch (e) {
									console.error('Error fetching fallback tariffs:', e);
								}
							}

							this.loadingMessage = '';
							this.isProcessing = false;
							return;
						}
					}

					// Si no es OK o no es JSON (HTML de error de Render), lanzamos error para forzar el reintento
					throw new Error('Servidor no disponible aún o en estado de suspensión (Render)');
				} catch (error) {
					console.log(`Intento ${i + 1} de ${maxRetries} fallido. Reintentando en ${delayMs}ms...`);
					if (i === maxRetries - 1) {
						console.error('Error fetching seats after retries:', error);
						this.matrix = this.generateMockMatrix();
						this.loadingMessage = 'Mostrando mapa simulado (Fallo de conexión)';
						setTimeout(() => this.loadingMessage = '', 4000);
					} else {
						await new Promise(resolve => setTimeout(resolve, delayMs));
					}
				}
			}
		} finally {
			this.isProcessing = false;
		}
	}

	generateMockMatrix(): CFDCell[][] {
		const m: CFDCell[][] = [];
		const rowsCount = 16;
		const colsCount = 20;

		// Empty row 0 for padding
		const row0: CFDCell[] = [];
		for (let j = 0; j <= colsCount; j++) row0.push({ type: 'empty' });
		m.push(row0);

		for (let i = 1; i <= rowsCount; i++) {
			const rowName = String.fromCharCode(64 + i);
			const r: CFDCell[] = [];
			r.push({ type: 'row-label', label: rowName });

			for (let j = 1; j <= colsCount; j++) {
				// Create an aisle at columns 6 and 15
				if (j === 6 || j === 15) {
					r.push({ type: 'empty' });
				} else {
					// Some fake disabled/taken seats
					const isTaken = (i % 3 === 0 && j % 4 === 0);
					r.push({
						type: 'seat',
						id: `${rowName}${j}`,
						label: `${j}`,
						status: isTaken ? 'taken' : 'free'
					});
				}
			}
			m.push(r);
		}
		return m;
	}

	toggleSeat(seatId: string, seatType: string = 'General', forceDisabledTariff: boolean = false) {
		if (this.activeSelection.selectedSeats.includes(seatId)) {
			this.activeSelection.selectedSeats = this.activeSelection.selectedSeats.filter(s => s !== seatId);
			// Auto decrement ticket when removing a seat
			if (this.totalTickets > this.activeSelection.selectedSeats.length) {
				// Find a tariff that has > 0 quantity and decrement it
				// Try to decrement disabled tariff first if this was a disabled seat
				let decremented = false;
				if (seatType.toUpperCase().includes('DISCAPACITA')) {
					for (const tId of Object.keys(this.activeSelection.ticketQuantities)) {
						const tariffObj = this.activeSelection.tariffs.find(t => t.id === tId);
						if (tariffObj && tariffObj.nombre.toUpperCase().includes('DISCAPACITA') && this.activeSelection.ticketQuantities[tId] > 0) {
							this.activeSelection.ticketQuantities[tId]--;
							decremented = true;
							break;
						}
					}
				}

				if (!decremented) {
					for (const tId of Object.keys(this.activeSelection.ticketQuantities)) {
						if (this.activeSelection.ticketQuantities[tId] > 0) {
							this.activeSelection.ticketQuantities[tId]--;
							break;
						}
					}
				}
			}
		} else {
			let targetTariffId: string | undefined = undefined;

			if (seatType.toUpperCase().includes('DISCAPACITA') && forceDisabledTariff) {
				// Buscar la tarifa de discapacitados en allPosTariffs
				const disabledTariff = this.activeSelection.allPosTariffs.find(t => t.nombre.toUpperCase().includes('DISCAPACITA'));
				if (disabledTariff) {
					// Si no esta en this.tariffs (lista permitida), la agregamos
					if (!this.activeSelection.tariffs.find(t => t.id === disabledTariff.id)) {
						this.activeSelection.tariffs = [...this.activeSelection.tariffs, disabledTariff];
					}
					targetTariffId = disabledTariff.id;
				}
			}

			this.activeSelection.selectedSeats = [...this.activeSelection.selectedSeats, seatId];

			// Auto increment selected or default tariff
			if (this.totalTickets < this.activeSelection.selectedSeats.length) {
				if (!targetTariffId && this.activeSelection.tariffs.length > 0) {
					targetTariffId = this.activeSelection.tariffs[0].id;
					const defaultTariff = this.activeSelection.tariffs.find(t => this.activeSelection.defaultTariffsIds.includes(t.id));
					if (defaultTariff) {
						targetTariffId = defaultTariff.id;
					}
				}
				if (targetTariffId) {
					this.activeSelection.ticketQuantities[targetTariffId] = (this.activeSelection.ticketQuantities[targetTariffId] || 0) + 1;
				}
			}
		}
	}

	updateConcession(id: string, name: string, price: number, delta: number) {
		const existing = this.selectedConcessions.find(c => c.id === id);
		if (existing) {
			existing.quantity += delta;
			if (existing.quantity <= 0) {
				this.selectedConcessions = this.selectedConcessions.filter(c => c.id !== id);
			}
		} else if (delta > 0) {
			this.selectedConcessions.push({ id, name, price, quantity: delta });
		}
	}

	async addSelectionToCart() {
		this.isProcessing = true;
		this.loadingMessage = 'Añadiendo butacas al carrito...';

		try {
			const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'https://scrapp-backoffice.onrender.com';

			const seatsQueue = [...this.activeSelection.selectedSeats];
			const tarifaGroups: Array<{
				id_tarifa: string;
				serie_tarifa: string;
				precio_tarifa: string;
				cantidad_entradas: number;
				butacas_elegidas: string[];
			}> = [];

			for (const tariff of this.activeSelection.tariffs) {
				const qty = this.activeSelection.ticketQuantities[tariff.id] || 0;
				if (qty <= 0) continue;

				tarifaGroups.push({
					id_tarifa: tariff.id,
					serie_tarifa: tariff.serie,
					precio_tarifa: String(tariff.precio),
					cantidad_entradas: qty,
					butacas_elegidas: seatsQueue.splice(0, qty)
				});
			}

			if (tarifaGroups.length === 0) {
				throw new Error('No hay tarifas seleccionadas.');
			}

			const numero_funcion = this.activeSelection.selectedShowtime?.numero_funcion;
			const numero_sala = this.activeSelection.selectedShowtime?.numero_sala;

			if (!numero_funcion || !numero_sala) {
				throw new Error('Falta numero_funcion o numero_sala en la función seleccionada. Verifica que la sincronización de cartelera esté actualizada.');
			}

			// Payload para /api/kiosk/lock-seats
			const payload: Record<string, unknown> = {
				id_funcion: this.activeSelection.selectedShowtime?.id,
				numero_funcion,
				numero_sala,
				tarifa_groups: tarifaGroups
			};

			// Si YA tenemos un fantasma, le decimos al backend que lo use para AÑADIR a la misma ventaTemporal
			if (this.ghostSession) {
				payload.existingGhostUsername = this.ghostSession.ghostUsername;
				// No assignment needed, getter ghostStatusCode is derived from ghostSession.
			}

			const response = await fetch(`${API_BASE}/api/kiosk/lock-seats`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Fallo al bloquear butacas en el servidor');
			}

			const lockedAtStr = new SvelteDate().toISOString();

			// Si fue la primera selección, inicializamos la sesión fantasma y el timer
			if (!this.ghostSession) {
				this.ghostSession = {
					ventaTemporalId: data.ventaTemporalId,
					ghostUsername: data.ghostUsername,
					lockedAt: lockedAtStr
				};
				this.startTimer(lockedAtStr);
			} else {
				// Actualizamos el timer con cada adición
				this.ghostSession.lockedAt = lockedAtStr;
				this.startTimer(lockedAtStr);
			}

			// Agrupamos las tarifas para el CartItem
			const itemTariffs = this.activeSelection.tariffs.filter(t => this.activeSelection.ticketQuantities[t.id] > 0).map(t => ({
				nombre: t.nombre,
				precio: t.precio,
				qty: this.activeSelection.ticketQuantities[t.id]
			}));

			// Mover de activeSelection a cartItems
			const existingItemIndex = this.cartItems.findIndex(item => item.showtimeId === this.activeSelection.selectedShowtime!.id);

			if (existingItemIndex >= 0) {
				const existingItem = this.cartItems[existingItemIndex];
				
				// Merge seats
				existingItem.seats = [...existingItem.seats, ...this.activeSelection.selectedSeats];
				existingItem.subtotal += this.activeSelectionPrice;

				// Merge tariffs
				for (const t of itemTariffs) {
					const existingTariff = existingItem.tariffs.find(et => et.nombre === t.nombre);
					if (existingTariff) {
						existingTariff.qty += t.qty;
					} else {
						existingItem.tariffs.push(t);
					}
				}
				
				// Forzar reactividad de Svelte 5
				this.cartItems[existingItemIndex] = existingItem;
			} else {
				const newItem: CartItem = {
					showtimeId: this.activeSelection.selectedShowtime!.id,
					movieTitle: this.activeSelection.movie?.title || 'Película',
					moviePoster: this.activeSelection.movie?.poster || '',
					showtimeDate: this.activeSelection.selectedDate || '',
					showtimeTime: this.activeSelection.selectedShowtime!.time,
					seats: [...this.activeSelection.selectedSeats],
					tariffs: itemTariffs,
					subtotal: this.activeSelectionPrice
				};

				this.cartItems = [...this.cartItems, newItem];
			}

			// Limpiar activeSelection (dejar solo lo básico o nada)
			this.activeSelection.selectedSeats = [];
			this.activeSelection.ticketQuantities = {};

			this.saveToLocalStorage();

			return true;
		} catch (e) {
			console.error('Error al bloquear butacas:', e);
			return false;
		} finally {
			this.isProcessing = false;
			this.loadingMessage = '';
		}
	}

	async fetchGhostStatus() {
		if (!browser) return;
		try {
			const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'https://scrapp-backoffice.onrender.com';
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

	// ── RECOVERY & TIMEOUT LOGIC ──

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
				this.expireSession();
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
			const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'https://scrapp-backoffice.onrender.com';
			const res = await fetch(`${API_BASE}/api/kiosk/ghost-pool/extend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: ghostUsername })
			});

			if (res.ok) {
				// Actualizar el lockedAt localmente
				const newLockedAt = new SvelteDate().toISOString();
				this.ghostSession.lockedAt = newLockedAt;
				this.saveToLocalStorage();

				this.showExtensionModal = false;
				this.startTimer(newLockedAt);
			} else {
				console.error('No se pudo extender el tiempo.');
			}
		} catch (e) {
			console.error('Error extendiendo sesión:', e);
		}
	}

	expireSession() {
		if (!browser) return;
		this.stopTimer();
		this.showExtensionModal = false;

		if (this.ghostSession) {
			try {
				const ghostUsername = this.ghostSession.ghostUsername;
				const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'https://scrapp-backoffice.onrender.com';
				navigator.sendBeacon(`${API_BASE}/api/kiosk/ghost-pool/release`, JSON.stringify({ username: ghostUsername }));
			} catch {
				// Omitir errores durante limpieza
			}
		}

		// Limpiar todo el estado
		this.cartItems = [];
		this.ghostSession = null;
		this.activeSelection.selectedSeats = [];
		this.activeSelection.ticketQuantities = {};
		this.selectedConcessions = [];
		localStorage.removeItem('scrapp_booking_state');

		// Use setTimeout so sendBeacon fires before toast blocks thread
		setTimeout(() => {
			let secondsLeft = 10;
			const toastId = toast.error(`Tu tiempo para completar la reserva expiró. El carrito ha sido vaciado. Volviendo al inicio en ${secondsLeft}s...`, {
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
					toast.error(`Tu tiempo para completar la reserva expiró. El carrito ha sido vaciado. Volviendo al inicio en ${secondsLeft}s...`, {
						id: toastId,
						duration: 10000,
					});
				}
			}, 1000);
		}, 50);
	}

	syncState() {
		if (!browser) return;

		// Intentamos cargar de localStorage primero (esto restaura cartItems y ghostSession)
		this.loadFromLocalStorage();

		if (this.ghostSession) {
			try {
				const { lockedAt } = this.ghostSession;
				const elapsed = Date.now() - new SvelteDate(lockedAt).getTime();
				const retentionMs = this.retentionTimeMinutes * 60 * 1000;

				if (elapsed >= retentionMs) {
					this.expireSession();
				} else {
					// Restaurar timer en caso de reload de pestaña
					if (!this.timerInterval) this.startTimer(lockedAt);
				}
			} catch {
				// Estado corrupto, ignorar silenciosamente
			}
		} else {
			// Solo mirando -> refresco silencioso si pasó mucho tiempo (2 min)
			if (this.activeSelection.selectedShowtime && this.lastSyncTimestamp > 0) {
				const elapsed = Date.now() - this.lastSyncTimestamp;
				if (elapsed > 2 * 60 * 1000) {
					console.log('[BookingState] Sesión inactiva reanudada. Refrescando butacas...');
					this.loadSeats();
				}
			}
		}
	}
}

export const bookingState = new BookingState();
