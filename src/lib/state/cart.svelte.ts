import type { CartItem, ConcessionItem, CompletedSale } from './booking.types';

export class CartState {
	cartItems = $state<CartItem[]>([]);
	selectedConcessions = $state<ConcessionItem[]>([]);
	
	customerName = $state('');
	customerEmail = $state('');
	customerDocument = $state('');
	paymentMethod = $state<'pago_movil' | 'zelle' | 'card' | null>(null);
	
	lastCompletedSale = $state<CompletedSale | null>(null);

	get concessionsTotal() {
		return this.selectedConcessions.reduce((sum, item) => sum + (item.price * item.quantity), 0);
	}

	get cartItemsTotal() {
		return this.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
	}

	get totalPrice() {
		return this.cartItemsTotal + this.concessionsTotal;
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

	clear() {
		this.cartItems = [];
		this.selectedConcessions = [];
	}
}

export const cartState = new CartState();
