import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

// `/dulceria` no es una pantalla: el menú de navegación ofrece las tres
// secciones directamente. Pero alguien puede llegar acá recortando la URL o
// desde un enlace viejo, y mandarlo al menú es mejor que un 404.
export const load = async () => {
	redirect(307, resolve('/dulceria/menu'));
};
