import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { authenticate } from '$lib/auth.server';

export const actions = {
	auth: async ({ request }) => {
		const data = await request.formData();

		const authRes = await authenticate(data);
		if (!authRes.authenticated) return fail(401, authRes);

		return authRes;
	},
	create: async ({ request }) => {
		const res = { action: 'create' };
		return { ...res, message: `successfully created post` };
	},
	edit: async ({ request }) => {
		const res = { action: 'edit' };
		return { ...res, message: `successfully edited post` };
	},
	remove: async ({ request }) => {
		const res = { action: 'remove' };
		return { ...res, message: `successfully removed post` };
	}
} satisfies Actions;
