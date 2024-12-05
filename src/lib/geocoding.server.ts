// import { createRequire } from 'node:module';
// import { readFile } from 'node:fs/promises';
import { read } from '$app/server';

// fixme: must move to csv dataset as txt dataset is missing regions (like +506)
// will also include letter code of country
// should make a script to cleanup data to only include relevant columns
// should we load it all into one file? or stick to per country code? or json with country code areas? or define our own format with a table of contents?
// also will need to start parsing regex for each which may have performance implications

const geocodeFiles = import.meta.glob<string>('./geocoding/*.json', {
	import: 'default',
	eager: false
});

export const geocode = async (countryCode: number, phone: string) => {
	const filePath = `./geocoding/${countryCode}.json`;

	let result = '';

	if (geocodeFiles[filePath]) {
		const ranges = await geocodeFiles[filePath]();

		// todo: implement actual range parsing and search
	} else {
		console.log(`geocode file not found for country code: ${countryCode}`);
	}

	// try just country search
	if (!result) {
		const countries = await geocodeFiles['./geocoding/countries.json']();
		result = countries[countryCode];
	}

	return result; // todo: country name? will need a different dataset file though

	// todo: text to coordinates
	// https://nominatim.openstreetmap.org/ui/search.html
	// https://developers.google.com/maps/documentation/geocoding/overview
};
