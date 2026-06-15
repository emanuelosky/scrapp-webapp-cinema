import { supabase } from '$lib/supabase';
import type { PromoBanner } from '$lib/types';

export const load = async () => {
	// Fetch the active promo banner
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
	const currentTime = today.toTimeString().split(' ')[0]; // "HH:MM:SS"

	const { data: promos, error } = await supabase
		.from('wbpp_promos')
		.select('*')
		.eq('is_active', true)
		.contains('days_of_week', [dayOfWeek])
		.lte('start_time', currentTime)
		.gte('end_time', currentTime)
		.limit(1);

	let activePromo: PromoBanner | null = null;
	if (!error && promos && promos.length > 0) {
		activePromo = promos[0] as PromoBanner;
	}

	return {
		activePromo
	};
};
