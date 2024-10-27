import { geocode } from '$lib/geocoding.server';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// todo: move to page action? only for testing
export const POST: RequestHandler = async ({ request }) => {
	const data = await request.formData();

	// const authRes = await authenticate(data);
	// if (!authRes.authenticated) return error(401, authRes);

	const countryCode = Number(data.get('countryCode') as string);
	const phone = data.get('phone') as string;
	if (!countryCode || !phone) return error(400, 'missing country code or phone number');
	if (phone.length >= 15) return error(400, 'phone number too long');

	try {
		const location = await geocode(countryCode, phone);
		return json({ location });
	} catch (e: any) {
		return error(400, e.message);
	}
};
