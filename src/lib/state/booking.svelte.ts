import type { Movie, ShowtimeDetails } from '$lib/types';
import type { CFDCell } from '$lib/utils/cfd';
import { browser } from '$app/environment';
import { SvelteDate } from 'svelte/reactivity';

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

export class BookingState {
	movie = $state<Movie | null>(null);
	selectedDate = $state<string | null>(null);
	selectedShowtime = $state<ShowtimeDetails | null>(null);

	// Dynamic Tariffs
	tariffs = $state<TariffItem[]>([]);
	allPosTariffs = $state<TariffItem[]>([]);
	defaultTariffsIds = $state<string[]>([]);
	ticketQuantities = $state<Record<string, number>>({});

	selectedSeats = $state<string[]>([]);
	matrix = $state<CFDCell[][]>([]);

	// Concessions State
	selectedConcessions = $state<ConcessionItem[]>([]);

	// Checkout State
	customerName = $state('');
	customerEmail = $state('');
	customerDocument = $state('');
	paymentMethod = $state<'pago_movil' | 'zelle' | 'card' | null>(null);
	isProcessing = $state(false);

	// Ghost User Status
	ghostStatusCode = $state<string>(''); // G, G OK, etc.
	ghostVentaId = $state<string | null>(null);

	// Inactivity & Session Recovery
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

	get totalTickets() {
		return Object.values(this.ticketQuantities).reduce((a, b) => a + b, 0);
	}

	get totalPrice() {
		let ticketsTotal = 0;
		for (const tariff of this.tariffs) {
			const qty = this.ticketQuantities[tariff.id] || 0;
			ticketsTotal += qty * tariff.precio;
		}
		const concessionsTotal = this.selectedConcessions.reduce((sum, item) => sum + (item.price * item.quantity), 0);
		return ticketsTotal + concessionsTotal;
	}

	get canProceed() {
		// Validamos que haya al menos un ticket seleccionado, 
		// y que la cantidad de asientos seleccionados coincida con la cantidad de tickets.
		return this.totalTickets > 0 && this.selectedSeats.length === this.totalTickets;
	}

	startBooking(movie: Movie, date: string, showtime: ShowtimeDetails) {
		this.movie = movie;
		this.selectedDate = date;
		this.selectedShowtime = showtime;
		// Reset state
		this.ticketQuantities = {};
		this.selectedSeats = [];
		this.selectedConcessions = [];
		this.matrix = []; // We will load this async

		// Reset Checkout
		this.customerName = '';
		this.customerEmail = '';
		this.customerDocument = '';
		this.paymentMethod = null;
		this.isProcessing = false;

		this.ghostStatusCode = '';
		this.ghostVentaId = null;

		this.stopTimer();
		this.timeRemainingSeconds = null;
		this.showExtensionModal = false;

		if (browser) {
			localStorage.removeItem('scrapp_booking_state');
			// I-06 FIX: limpiar también la sesión ghost anterior al iniciar nueva reserva
			sessionStorage.removeItem('scrapp_ghost_session');
		}
	}

	saveToLocalStorage() {
		if (!browser) return;
		try {
			const state = {
				selectedSeats: this.selectedSeats,
				ticketQuantities: this.ticketQuantities,
				selectedShowtimeId: this.selectedShowtime?.id,
				movie: this.movie,
				selectedDate: this.selectedDate,
				selectedShowtime: this.selectedShowtime,
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
			if (state.movie && Date.now() - state.timestamp < 10 * 60 * 1000) {
				this.movie = state.movie;
				this.selectedDate = state.selectedDate;
				this.selectedShowtime = state.selectedShowtime;

				// Si estamos restaurando en la misma función (o acaba de ser cargado)
				if (state.selectedShowtimeId === this.selectedShowtime?.id) {
					this.selectedSeats = state.selectedSeats || [];
					this.ticketQuantities = state.ticketQuantities || {};
				}
				return true;
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
								this.defaultTariffsIds = defaultIds;
								this.allPosTariffs = allTariffs.map((t: Record<string, unknown>) => ({
									id: t.id as string,
									nombre: (t.nombre || '') as string,
									serie: (t.serie || t.prefix || '') as string,
									precio: Number(t.precio || t.valor || t.monto || 0)
								}));
								this.tariffs = this.allPosTariffs.filter(t => allowedIds.includes(t.id));
							} else {
								try {
									const tariffsRes = await fetch(`${API_BASE}/api/tarifas?showtimeId=${this.selectedShowtime.id}`);
									if (tariffsRes.ok) {
										const tariffsData = await tariffsRes.json();
										if (tariffsData.success) {
											const allowedIds = tariffsData.allowedTariffs || [];
											const defaultIds = tariffsData.defaultTariffs || [];
											const allTariffs = tariffsData.posTariffs || [];
											this.defaultTariffsIds = defaultIds;
											this.allPosTariffs = allTariffs.map((t: Record<string, unknown>) => ({
												id: t.id as string,
												nombre: (t.nombre || '') as string,
												serie: (t.serie || t.prefix || '') as string,
												precio: Number(t.precio || t.valor || t.monto || 0)
											}));
											this.tariffs = this.allPosTariffs.filter(t => allowedIds.includes(t.id));
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
		if (this.selectedSeats.includes(seatId)) {
			this.selectedSeats = this.selectedSeats.filter(s => s !== seatId);
			// Auto decrement ticket when removing a seat
			if (this.totalTickets > this.selectedSeats.length) {
				// Find a tariff that has > 0 quantity and decrement it
				// Try to decrement disabled tariff first if this was a disabled seat
				let decremented = false;
				if (seatType.toUpperCase().includes('DISCAPACITA')) {
					for (const tId of Object.keys(this.ticketQuantities)) {
						const tariffObj = this.tariffs.find(t => t.id === tId);
						if (tariffObj && tariffObj.nombre.toUpperCase().includes('DISCAPACITA') && this.ticketQuantities[tId] > 0) {
							this.ticketQuantities[tId]--;
							decremented = true;
							break;
						}
					}
				}

				if (!decremented) {
					for (const tId of Object.keys(this.ticketQuantities)) {
						if (this.ticketQuantities[tId] > 0) {
							this.ticketQuantities[tId]--;
							break;
						}
					}
				}
			}
		} else {
			let targetTariffId: string | undefined = undefined;

			if (seatType.toUpperCase().includes('DISCAPACITA') && forceDisabledTariff) {
				// Buscar la tarifa de discapacitados en allPosTariffs
				const disabledTariff = this.allPosTariffs.find(t => t.nombre.toUpperCase().includes('DISCAPACITA'));
				if (disabledTariff) {
					// Si no esta en this.tariffs (lista permitida), la agregamos
					if (!this.tariffs.find(t => t.id === disabledTariff.id)) {
						this.tariffs = [...this.tariffs, disabledTariff];
					}
					targetTariffId = disabledTariff.id;
				}
			}

			this.selectedSeats = [...this.selectedSeats, seatId];

			// Auto increment selected or default tariff
			if (this.totalTickets < this.selectedSeats.length) {
				if (!targetTariffId && this.tariffs.length > 0) {
					targetTariffId = this.tariffs[0].id;
					const defaultTariff = this.tariffs.find(t => this.defaultTariffsIds.includes(t.id));
					if (defaultTariff) {
						targetTariffId = defaultTariff.id;
					}
				}
				if (targetTariffId) {
					this.ticketQuantities[targetTariffId] = (this.ticketQuantities[targetTariffId] || 0) + 1;
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

	async lockSeatsAndConfirm() {
		this.isProcessing = true;
		this.loadingMessage = 'Asegurando butacas...';
		this.ghostStatusCode = 'G'; // Asignando Ghost User...

		try {
			const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'https://scrapp-backoffice.onrender.com';

			// 1. Construir grupos de tarifa dinámicos.
			// Distribuimos los asientos en orden entre los tipos de tarifa seleccionados.
			// Ej: 2 COMPLETO + 1 NIÑOS con butacas [A1, A2, A3] →
			//   Grupo 1: { tarifa: COMPLETO, butacas: [A1, A2] }
			//   Grupo 2: { tarifa: NIÑOS,    butacas: [A3] }
			const seatsQueue = [...this.selectedSeats];
			const tarifaGroups: Array<{
				id_tarifa: string;
				serie_tarifa: string;
				precio_tarifa: string;
				cantidad_entradas: number;
				butacas_elegidas: string[];
			}> = [];

			for (const tariff of this.tariffs) {
				const qty = this.ticketQuantities[tariff.id] || 0;
				if (qty <= 0) continue;

				tarifaGroups.push({
					id_tarifa: tariff.id,
					serie_tarifa: tariff.serie,    // "G1", "G3", etc. — viene del POS
					precio_tarifa: String(tariff.precio),
					cantidad_entradas: qty,
					butacas_elegidas: seatsQueue.splice(0, qty)
				});
			}

			if (tarifaGroups.length === 0) {
				throw new Error('No hay tarifas seleccionadas.');
			}

			const numero_funcion = this.selectedShowtime?.numero_funcion;
			const numero_sala = this.selectedShowtime?.numero_sala;

			if (!numero_funcion || !numero_sala) {
				throw new Error('Falta numero_funcion o numero_sala en la función seleccionada. Verifica que la sincronización de cartelera esté actualizada.');
			}

			// 2. Enviar al backend con toda la info dinámica
			const response = await fetch(`${API_BASE}/api/kiosk/lock-seats`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id_funcion: this.selectedShowtime?.id,
					numero_funcion,
					numero_sala,
					tarifa_groups: tarifaGroups
				})
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Fallo al bloquear butacas en el servidor');
			}

			// 3. Éxito — actualizar estado y navegar
			this.ghostStatusCode = `G OK - ${data.ventaTemporalId || 'N/A'} - B OK`;
			this.ghostVentaId = data.ventaTemporalId || null;

			// I-06 FIX: persistir en sessionStorage para sobrevivir reloads durante el checkout
			if (browser && this.ghostVentaId) {
				const lockedAtStr = new SvelteDate().toISOString();
				sessionStorage.setItem('scrapp_ghost_session', JSON.stringify({
					ventaTemporalId: this.ghostVentaId,
					ghostUsername: data.ghostUsername,
					lockedAt: lockedAtStr
				}));
				this.startTimer(lockedAtStr);
			}

			return true;
		} catch (e) {
			console.error('Error al bloquear butacas:', e);
			return false;
		} finally {
			this.isProcessing = false;
			this.loadingMessage = '';
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
		const ghostSessionStr = sessionStorage.getItem('scrapp_ghost_session');
		if (!ghostSessionStr) return;

		try {
			const { ghostUsername } = JSON.parse(ghostSessionStr);
			const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'https://scrapp-backoffice.onrender.com';
			const res = await fetch(`${API_BASE}/api/kiosk/ghost-pool/extend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: ghostUsername })
			});

			if (res.ok) {
				// Actualizar el lockedAt localmente
				const newLockedAt = new SvelteDate().toISOString();
				const sessionData = JSON.parse(ghostSessionStr);
				sessionData.lockedAt = newLockedAt;
				sessionStorage.setItem('scrapp_ghost_session', JSON.stringify(sessionData));

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
		alert('Tu tiempo para completar la reserva expiró. Por favor, selecciona butacas nuevamente.');

		const ghostSessionStr = sessionStorage.getItem('scrapp_ghost_session');
		if (ghostSessionStr) {
			try {
				const { ghostUsername } = JSON.parse(ghostSessionStr);
				const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'https://scrapp-backoffice.onrender.com';
				navigator.sendBeacon(`${API_BASE}/api/kiosk/ghost-pool/release`, JSON.stringify({ username: ghostUsername }));
				sessionStorage.removeItem('scrapp_ghost_session');
			} catch {
				// Omitir errores durante limpieza
			}
		}


		window.location.href = '/';
	}

	syncState() {
		if (!browser) return;

		const ghostSessionStr = sessionStorage.getItem('scrapp_ghost_session');
		if (ghostSessionStr) {
			// Ya tiene bloqueado -> revisar timer
			try {
				const { lockedAt, ventaTemporalId } = JSON.parse(ghostSessionStr);

				// Restaurar estado visual del ghost user para el debug
				this.ghostVentaId = ventaTemporalId || null;
				if (ventaTemporalId && !this.ghostStatusCode) {
					this.ghostStatusCode = `G OK - ${ventaTemporalId} - B OK`;
				}

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
			if (this.selectedShowtime && this.lastSyncTimestamp > 0) {
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
