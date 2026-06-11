import type { Movie, ShowtimeDetails } from '$lib/types';
import type { CFDCell } from '$lib/utils/cfd';

export interface ConcessionItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
}

export class BookingState {
	movie = $state<Movie | null>(null);
	selectedDate = $state<string | null>(null);
	selectedShowtime = $state<ShowtimeDetails | null>(null);
	
	adultTickets = $state(0);
	childTickets = $state(0);
	seniorTickets = $state(0);
	
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
		return this.adultTickets + this.childTickets + this.seniorTickets;
	}
	
	get totalPrice() {
		const ticketsTotal = (this.adultTickets * 5) + (this.childTickets * 2.5) + (this.seniorTickets * 2.5);
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
		this.adultTickets = 0;
		this.childTickets = 0;
		this.seniorTickets = 0;
		this.childTickets = 0;
		this.seniorTickets = 0;
		this.seniorTickets = 0;
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

	async loadSeats() {
		if (!this.selectedShowtime || !this.selectedShowtime.id) return;
		this.isProcessing = true;
		try {
			// Suponiendo que scrapp-administrative-v2 está corriendo en localhost:5173 en dev
			// y en prod tiene otro dominio. Esto debería configurarse por .env o un proxy en svelte.config
			// Para ahora usamos un path relativo si la API estuviera en el mismo dominio, pero 
			// como están separados, usaremos la URL base de admin
			const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5173';
			const res = await fetch(`${API_BASE}/api/pos/fetch-seats/${this.selectedShowtime.id}`);
			if (!res.ok) throw new Error('Error al cargar butacas');
			const data = await res.json();
			if (data.matrix) {
				this.matrix = data.matrix;
			}
		} catch (error) {
			console.error('Error fetching seats:', error);
			// Fallback o mostrar error
			this.matrix = this.generateMockMatrix();
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
				if (this.adultTickets > 0) this.adultTickets--;
				else if (this.childTickets > 0) this.childTickets--;
				else if (this.seniorTickets > 0) this.seniorTickets--;
			}
		} else {
			this.selectedSeats.push(seatId);
			// Auto increment adult ticket when adding a seat
			if (this.totalTickets < this.selectedSeats.length) {
				this.adultTickets++;
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
