import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = async ({ error, event, status, message }) => {
	fetch('/api/error', { method: 'POST', body: JSON.stringify({ error, event, status, message }) });
};
