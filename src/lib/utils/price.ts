/**
 * Formato de precios.
 *
 * La señalética de CINEPIC escribe el precio como "REF 18⁹⁹": la palabra REF
 * (referencia en dólares), el entero grande y los centavos volados. Es el
 * término con el que el público ya lee estos precios, así que se conserva en
 * la web en vez de traducirlo a "$18.99".
 *
 * OJO al conectar el backend: hoy la tasa de cambio está duplicada y en
 * desacuerdo consigo misma -- `EXCHANGE_RATE = 40.50` en
 * `cines/[sede]/concessions/[id]` y en `cines/[sede]/checkout/[id]`, pero el
 * payload de pago de ese mismo checkout usa 582.68. Cualquier conversión a
 * bolívares tiene que resolver eso primero; por eso acá no hay ninguna.
 */

/**
 * Parte un precio en entero y centavos, para poder componer el bloque
 * tipográfico. Devuelve cadenas, no números: los centavos necesitan su cero a
 * la izquierda ("18.05" → "05", no 5).
 */
export function splitPrice(value: number): { whole: string; cents: string } {
	const [whole, cents] = Math.max(0, value).toFixed(2).split('.');
	return { whole, cents };
}

/** "18.99" en una sola línea, para listas y totales donde el bloque REF sobra. */
export function formatPrice(value: number): string {
	return Math.max(0, value).toFixed(2);
}
