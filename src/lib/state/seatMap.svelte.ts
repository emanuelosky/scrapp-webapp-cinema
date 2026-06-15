import type { Movie, ShowtimeDetails } from '$lib/types';
import type { CFDCell } from '$lib/utils/cfd';
import type { ActiveSelection } from './booking.types';

export class SeatMapState {
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

	matrix = $state<CFDCell[][]>([]);
	isProcessing = $state(false);
	loadingMessage = $state('');
	lastSyncTimestamp = $state<number>(0);

	get totalTickets() {
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
		this.matrix = [];
	}

	generateMockMatrix(): CFDCell[][] {
		const m: CFDCell[][] = [];
		const rowsCount = 16;
		const colsCount = 20;

		const row0: CFDCell[] = [];
		for (let j = 0; j <= colsCount; j++) row0.push({ type: 'empty' });
		m.push(row0);

		for (let i = 1; i <= rowsCount; i++) {
			const rowName = String.fromCharCode(64 + i);
			const r: CFDCell[] = [];
			r.push({ type: 'row-label', label: rowName });

			for (let j = 1; j <= colsCount; j++) {
				if (j === 6 || j === 15) {
					r.push({ type: 'empty' });
				} else {
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
			if (this.totalTickets > this.activeSelection.selectedSeats.length) {
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
				const disabledTariff = this.activeSelection.allPosTariffs.find(t => t.nombre.toUpperCase().includes('DISCAPACITA'));
				if (disabledTariff) {
					if (!this.activeSelection.tariffs.find(t => t.id === disabledTariff.id)) {
						this.activeSelection.tariffs = [...this.activeSelection.tariffs, disabledTariff];
					}
					targetTariffId = disabledTariff.id;
				}
			}

			this.activeSelection.selectedSeats = [...this.activeSelection.selectedSeats, seatId];

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
}

export const seatMapState = new SeatMapState();
