import type { PageServerLoad } from './$types';
import { db, type Call } from '$lib/db.server';
import { ISR_SECRET } from '$env/static/private';

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
