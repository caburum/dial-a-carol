import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authenticate } from '$lib/auth.server';

import dummy from '$lib/dummy.json';

export const actions = {
	auth: async ({ request }) => {
		const data = await request.formData();

		const authRes = await authenticate(data);
		if (!authRes.authenticated) return fail(401, authRes);

		return authRes;
	}
} satisfies Actions;

export const load = (async () => {
	return {
		features: dummy.map((d) => {
			// todo: add some randomness to coords if they are duplicates
			return {
				type: 'Feature' as const,
				properties: {
					// name: d.display_name
				},
				geometry: {
					type: 'Point' as const,
					coordinates: [Number(d.lon), Number(d.lat)]
				}
			};
		})
	};
}) satisfies PageServerLoad;

export const config = {
	isr: {
		expiration: 120,
		bypassToken: 'REPLACE_ME_WITH_SECRET_VALUE'
	}
};
