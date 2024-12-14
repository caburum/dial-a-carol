import type { RequestHandler } from './$types';
import { ISR_SECRET } from '$env/static/private';
import { geocode } from '$lib/geocoding.server';
import { db, type Call } from '$lib/db.server';

export const GET: RequestHandler = async ({ url }) => {
	const secret = url.searchParams.get('secret');
	if (secret !== ISR_SECRET) {
		return new Response('unauthorized', { status: 401 });
	}

	const collection = db.collection<Call>('calls');
	const calls = await collection.find().toArray();

	const newCalls = [];
	for (const call of calls) {
		const { countryCode, phone } = call;
		const location = await geocode(countryCode, phone);
		call.lat = Number(location.lat);
		call.lon = Number(location.lon);
		console.log(call);
		newCalls.push(call);

		// delay to avoid rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	// update calls in db
	const bulkOps = newCalls.map((call) => ({
		updateOne: {
			filter: { _id: call._id },
			update: { $set: { lat: call.lat, lon: call.lon } }
		}
	}));

	const result = await collection.bulkWrite(bulkOps);

	return new Response(
		JSON.stringify({
			...result,
			calls: newCalls
		}),
		{
			headers: {
				'content-type': 'application/json'
			}
		}
	);
};
