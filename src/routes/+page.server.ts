import { geocode } from '$lib/geocoding.server';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	return { text: await geocode(1, '') };
}) satisfies PageServerLoad;
