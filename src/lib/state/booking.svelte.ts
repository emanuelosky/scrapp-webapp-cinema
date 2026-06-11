import type { Movie, ShowtimeDetails } from '$lib/types';
import type { CFDCell } from '$lib/utils/cfd';

export interface ConcessionItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
}

export interface TariffItem {
	id: string;
	nombre: string;
	precio: number;
}

export class BookingState {
	movie = $state<Movie | null>(null);
	selectedDate = $state<string | null>(null);
	selectedShowtime = $state<ShowtimeDetails | null>(null);
	
	// Dynamic Tariffs
	tariffs = $state<TariffItem[]>([]);
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
					
					const res = await fetch(`${API_BASE}/api/pos/fetch-seats/${this.selectedShowtime.id}`);
					
					// Render a veces devuelve un HTML 502 Bad Gateway mientras despierta
					const contentType = res.headers.get('content-type');
					if (res.ok && contentType && contentType.includes('application/json')) {
						const data = await res.json();
						if (data.matrix) {
							this.matrix = data.matrix;
							
							// Fetch tariffs after seats
							try {
								const tariffsRes = await fetch(`${API_BASE}/api/tarifas?showtimeId=${this.selectedShowtime.id}`);
								if (tariffsRes.ok) {
									const tariffsData = await tariffsRes.json();
									if (tariffsData.success) {
										const allowedIds = tariffsData.allowedTariffs || [];
										const defaultIds = tariffsData.defaultTariffs || [];
										const allTariffs = tariffsData.posTariffs || [];
										this.defaultTariffsIds = defaultIds;
										this.tariffs = allTariffs
											.filter((t: Record<string, unknown>) => typeof t.id === 'string' && allowedIds.includes(t.id))
											.map((t: Record<string, unknown>) => ({
												id: t.id as string,
												nombre: (t.nombre || '') as string,
												precio: Number(t.precio || t.valor || t.monto || 0)
											}));
									}
								}
							} catch (e) {
								console.error('Error fetching tariffs:', e);
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
		for(let j = 0; j <= colsCount; j++) row0.push({ type: 'empty' });
		m.push(row0);

		for(let i = 1; i <= rowsCount; i++) {
			const rowName = String.fromCharCode(64 + i);
			const r: CFDCell[] = [];
			r.push({ type: 'row-label', label: rowName });
			
			for(let j = 1; j <= colsCount; j++) {
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

	toggleSeat(seatId: string) {
		if (this.selectedSeats.includes(seatId)) {
			this.selectedSeats = this.selectedSeats.filter(s => s !== seatId);
			// Auto decrement ticket when removing a seat
			if (this.totalTickets > this.selectedSeats.length) {
				// Find a tariff that has > 0 quantity and decrement it
				for (const tId of Object.keys(this.ticketQuantities)) {
					if (this.ticketQuantities[tId] > 0) {
						this.ticketQuantities[tId]--;
						break;
					}
				}
			}
		} else {
			this.selectedSeats = [...this.selectedSeats, seatId];
			// Auto increment first matching default tariff, or fallback to first available
			if (this.totalTickets < this.selectedSeats.length && this.tariffs.length > 0) {
				let targetTariffId = this.tariffs[0].id;
				
				// Buscamos si alguna de nuestras tarifas está marcada como predeterminada
				const defaultTariff = this.tariffs.find(t => this.defaultTariffsIds.includes(t.id));
				if (defaultTariff) {
					targetTariffId = defaultTariff.id;
				}

				this.ticketQuantities[targetTariffId] = (this.ticketQuantities[targetTariffId] || 0) + 1;
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
}

export const bookingState = new BookingState();
