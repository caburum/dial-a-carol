import type { PageServerLoad } from './$types';
// import { db, type Call } from '$lib/db.server';
import { ISR_SECRET } from '$env/static/private';
import { getCalls } from '$lib/spreadsheet';

export const load = (async ({ setHeaders }) => {
	// const collection = db.collection<Call>('calls');
	// const calls = await collection.find().toArray();

	const calls = await getCalls();

	setHeaders({
		'Cache-Control': 'public, max-age=120'
	});

	return {
		features: calls
			.map((c) => {
				let lonlat = c.coords.split(',').map(Number).reverse();
				// todo: add some randomness to coords if they are duplicates
				return lonlat.length === 2
					? {
							type: 'Feature' as const,
							properties: {
								// name: c.name
							},
							geometry: {
								type: 'Point' as const,
								coordinates: lonlat // [Number(c.lon), Number(c.lat)]
							}
						}
					: null;
			})
			.filter((i) => i !== null),
		count: calls.length
	};
}) satisfies PageServerLoad;

export const config = {
	isr: {
		expiration: 120,
		bypassToken: ISR_SECRET
	}
};
