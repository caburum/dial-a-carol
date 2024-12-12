import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { authenticate } from '$lib/auth.server';

export const actions = {
	auth: async ({ request }) => {
		const data = await request.formData();

		const authRes = await authenticate(data);
		if (!authRes.authenticated) return fail(401, authRes);

		return authRes;
	}
} satisfies Actions;
