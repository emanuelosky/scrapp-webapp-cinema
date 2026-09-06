import type { PromoBanner } from '$lib/types';

// Deshabilita el renderizado del lado del servidor.
// Todo el frontend operará como Single Page Application (SPA).
export const ssr = false;

export const load = async ({ fetch, params }) => {
    // 1. Fetch promo banner from backend
    const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5174';
    const sede = params.sede;

    let activePromo: PromoBanner | null = null;

    // Las promos son por sede (wbpp_promos filtra por location_id, no existe una
    // "global"). En el home multisede `/` no hay sede, así que no mostramos
    // ninguna: antes caía a 'candelaria' y le enseñaba la oferta de un cine
    // concreto a quien todavía no había elegido cine.
    if (!sede) {
        return { activePromo: null };
    }

    try {
        const res = await fetch(`${API_URL}/api/v1/promos?location_id=${sede}`);
        if (res.ok) {
            const data = await res.json();
            activePromo = data.activePromo;
        } else {
            console.error('Failed to fetch promos:', await res.text());
        }
    } catch (e) {
        console.error('Network error fetching promos:', e);
    }

    return {
        activePromo
    };
};
