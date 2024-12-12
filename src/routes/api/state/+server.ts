import { authenticate } from '$lib/auth.server';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, type Call, type CallDoc } from '$lib/db.server';

export type State = {
	calls: CallDoc[];
};

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.formData();

	const authRes = await authenticate(data);
	if (!authRes.authenticated) return error(401, authRes);

	const calls = await db.collection<Call>('calls').find().sort({ _id: -1 }).toArray();

	return json({
		calls: calls
	});
};
