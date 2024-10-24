import { authenticate } from '$lib/auth.server';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export interface Entry {
	id: string;
	title: string;
	contentText: string;
}

export type State = {
	entries: Entry[];
	webhook: boolean;
};

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.formData();

	const authRes = await authenticate(data);
	if (!authRes.authenticated) return error(401, authRes);

	return json({
		entries: []
	});
};
