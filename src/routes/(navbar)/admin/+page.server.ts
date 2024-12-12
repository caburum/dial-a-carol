import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { authenticate } from '$lib/auth.server';
import { geocode } from '$lib/geocoding.server';
import { db, logCall } from '$lib/db.server';
import { ObjectId } from 'mongodb';

export const actions = {
	create: async ({ request }) => {
		const res = { action: 'create' };
		const data = await request.formData();

		const authRes = await authenticate(data);
		if (!authRes.authenticated) return fail(401, authRes);

		if (!data.has('countryCode') || !data.has('phone')) return fail(400, { message: 'missing body' });

		const countryCodeS = data.get('countryCode') as string,
			phone = data.get('phone') as string;

		const countryCode = parseInt(countryCodeS);

		const result = await geocode(countryCode, phone);

		const success = await logCall(countryCode, phone, result);

		if (success) return { ...res, message: `successfully added location '${result.display_name}'` };
		return fail(500, { message: 'failed to log call' });
	},
	edit: async ({ request }) => {
		const res = { action: 'edit' };
		return { ...res, message: `successfully edited call` };
	},
	remove: async ({ request }) => {
		const res = { action: 'remove' };
		const data = await request.formData();

		const authRes = await authenticate(data);
		if (!authRes.authenticated) return fail(401, authRes);

		const id = data.get('id') as string;
		if (!id) return fail(400, { message: 'missing id' });

		const collection = db.collection('calls');

		await collection.findOneAndDelete({ _id: new ObjectId(id) });

		return { ...res, message: `successfully removed call` };
	}
} satisfies Actions;
