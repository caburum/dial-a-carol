import { initialAuthPassword, type AuthRes } from '$lib/auth';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';
import type { State } from '../../api/state/+server';
import type { CallDoc } from '$lib/db.server';

export const load = (async ({ fetch }) => {
	const password = get(initialAuthPassword);

	const res = await fetch('/api/state', {
		method: 'POST',
		// needs to be a string or sveltekit internal fetch will error
		body: new URLSearchParams({ password: password || '' }).toString(),
		headers: {
			'content-type': 'application/x-www-form-urlencoded'
		}
	});
	const data: State | AuthRes = await res.json();

	if (('authenticated' in data && !data.authenticated) || !Array.isArray(data.calls))
		return { authenticated: false, entries: [] };

	return { authenticated: true, calls: data.calls as CallDoc[] };
}) satisfies PageLoad;
