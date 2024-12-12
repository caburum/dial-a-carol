import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authenticate } from '$lib/auth.server';
import { db, type Call } from '$lib/db.server';
import { ISR_SECRET } from '$env/static/private';

export const actions = {
	auth: async ({ request }) => {
		const data = await request.formData();

		const authRes = await authenticate(data);
		if (!authRes.authenticated) return fail(401, authRes);

		return authRes;
	}
} satisfies Actions;

export const load = (async () => {
	const collection = db.collection<Call>('calls');
	const calls = await collection.find().toArray();

	return {
		features: calls.map((c) => {
			// todo: add some randomness to coords if they are duplicates
			return {
				type: 'Feature' as const,
				properties: {
					// name: c.name
				},
				geometry: {
					type: 'Point' as const,
					coordinates: [Number(c.lon), Number(c.lat)]
				}
			};
		})
	};
}) satisfies PageServerLoad;

export const config = {
	isr: {
		expiration: 120,
		bypassToken: ISR_SECRET
	}
};
