import type { PageServerLoad } from './$types';
// import { db, type Call } from '$lib/db.server';
import { ISR_SECRET } from '$env/static/private';
import { getCalls } from '$lib/spreadsheet';

let seed = 42;
let state = seed % 2147483647; // Use a large prime number for the modulus
if (state <= 0) state += 2147483646;
function random() {
	// LCG algorithm
	state = (state * 16807) % 2147483647;
	return state / 2147483647;
}

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
				if (lonlat.length !== 2) return null;

				// add some randomness to coords so they spread out
				lonlat[0] += (random() - 0.5) * 0.01;
				lonlat[1] += (random() - 0.5) * 0.01;

				return {
					type: 'Feature' as const,
					properties: {
						// name: c.name
					},
					geometry: {
						type: 'Point' as const,
						coordinates: lonlat // [Number(c.lon), Number(c.lat)]
					}
				};
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
