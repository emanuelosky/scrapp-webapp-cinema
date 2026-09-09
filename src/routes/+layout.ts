import { fetchPromo } from '$lib/api';
import type { PromoBanner } from '$lib/types';

// Deshabilita el renderizado del lado del servidor.
// Todo el frontend operará como Single Page Application (SPA).
export const ssr = false;

export const load = async ({ fetch, params }) => {
    const sede = params.sede;


    // Las promos son por sede (wbpp_promos filtra por location_id, no existe una
    // "global"). En el home multisede `/` no hay sede, así que no mostramos
    // ninguna: antes caía a 'candelaria' y le enseñaba la oferta de un cine
    // concreto a quien todavía no había elegido cine.
    if (!sede) {
        return { activePromo: null };
    }

    const activePromo: PromoBanner | null = await fetchPromo(sede, fetch);

    return {
        activePromo
    };
};
