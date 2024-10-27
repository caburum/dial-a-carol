// import { createRequire } from 'node:module';
// import { readFile } from 'node:fs/promises';
import { read } from '$app/server';

// fixme: must move to csv dataset as txt dataset is missing regions (like +506)
// will also include letter code of country
// should make a script to cleanup data to only include relevant columns
// should we load it all into one file? or stick to per country code? or json with country code areas? or define our own format with a table of contents?
// also will need to start parsing regex for each which may have performance implications

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
			// todo: something like a binary search since lines are sorted
			let line = lines.find((l) => l.startsWith(attempt + '|'));
			if (line) {
				return line.split('|')[1];
			}
			attempt = attempt.slice(0, -1);
		}
		return ''; // todo: country name? will need a different dataset file though

		// todo: text to coordinates
		// https://nominatim.openstreetmap.org/ui/search.html
		// https://developers.google.com/maps/documentation/geocoding/overview
	} else {
		throw new Error(`geocode file not found for country code: ${countryCode}`);
	}
};
