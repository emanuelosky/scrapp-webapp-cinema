import type { Movie, ShowtimeDetails } from '$lib/types';

export interface ConcessionItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
}

export interface TariffItem {
	id: string;
	nombre: string;
	serie: string;
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

export interface CompletedSale {
	cartItems: CartItem[];
	concessions: ConcessionItem[];
	customerEmail: string;
	orderTotal: number;
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
