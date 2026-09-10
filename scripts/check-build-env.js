/**
 * Guarda de compilación: detiene `npm run build` si falta la dirección del
 * backend.
 *
 * Sin esto, una compilación de producción sin `VITE_ADMIN_API_URL` salía
 * publicada apuntando al valor por defecto que hubiera en el código. Ese fallo
 * es silencioso y peligroso: el sitio "funciona" contra la infraestructura
 * equivocada y nadie lo nota hasta que falla en público. Mejor que no compile.
 */
// El mensaje de abajo manda a crear un `.env`, así que hay que leerlo: este
// script corre como `node` pelado (prebuild), no a través de Vite, y por su
// cuenta `process.env` no sabe nada de ese archivo. En CI y en Render no hay
// `.env` y la variable llega del entorno; por eso el fallo es silencioso.
try {
	process.loadEnvFile();
} catch {
	// No hay .env: es lo normal fuera de una máquina de desarrollo.
}

const url = process.env.VITE_ADMIN_API_URL;

if (!url) {
	console.error(`
  ✖ Falta VITE_ADMIN_API_URL.

    La webapp incrusta esta dirección al compilar (no la lee en caliente),
    así que una compilación sin ella quedaría apuntando a ningún lado.

    Local:   crea un archivo .env con VITE_ADMIN_API_URL=<url del backend>
    Render:  defínela en Environment, en el servicio del sitio estático.
`);
	process.exit(1);
}

try {
	const parsed = new URL(url);
	const esLocal = ['localhost', '127.0.0.1'].includes(parsed.hostname);

	if (esLocal) {
		console.warn(`  ⚠ VITE_ADMIN_API_URL apunta a ${parsed.origin} (local).`);
		console.warn('    Esa compilación solo sirve en esta máquina.\n');
	} else {
		console.log(`  ✓ Backend: ${parsed.origin}\n`);
	}
} catch {
	console.error(`\n  ✖ VITE_ADMIN_API_URL no es una URL válida: "${url}"\n`);
	process.exit(1);
}
