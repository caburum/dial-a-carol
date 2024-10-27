import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { authenticate } from '$lib/auth.server';

export const actions = {
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
