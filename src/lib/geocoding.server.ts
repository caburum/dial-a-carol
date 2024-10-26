// import { createRequire } from 'node:module';
// import { readFile } from 'node:fs/promises';
import { read } from '$app/server';

const geocodeFiles = import.meta.glob<string>('./geocoding/*.txt', {
	import: 'default',
	eager: true // somehow makes svelte discover the file, at the cost of them all being loaded at once
});

export const geocode = async (countryCode: number, phone: string) => {
	const filePath = `./geocoding/${countryCode}.txt`;

	if (geocodeFiles[filePath]) {
		// const require = createRequire(import.meta.url);
		// const fileUrl = require.resolve(filePath);
		// const text = await readFile(fileUrl, 'utf-8');

		const file = geocodeFiles[filePath];
		const text = await read(file).text();
		const lines = text.split('\n');

		let attempt = countryCode + phone;
		while (attempt.length > 1) {
			let line = lines.find((l) => l.startsWith(attempt + '|'));
			if (line) {
				return line.split('|')[1];
			}
			attempt = attempt.slice(0, -1);
		}
		return countryCode; // todo: country name
	} else {
		throw new Error(`Geocode file not found for country code: ${countryCode}`);
	}
};
