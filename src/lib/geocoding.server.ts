// fixme: must move to csv dataset as txt dataset is missing regions (like +506)
// will also include letter code of country
// should make a script to cleanup data to only include relevant columns
// should we load it all into one file? or stick to per country code? or json with country code areas? or define our own format with a table of contents?
// also will need to start parsing regex for each which may have performance implications

const geocodeFiles = import.meta.glob<any>('./geocoding/*.json', {
	import: 'default',
	eager: false
});

export const geocode = async (countryCode: number, phone: string) => {
	const filePath = `./geocoding/${countryCode}.json`;

	let result = '';

	if (geocodeFiles[filePath]) {
		const ranges: ([string, string] | [string, string, string])[] = await geocodeFiles[filePath]();

		let left = 0,
			right = ranges.length - 1;

		let iter = 25;

		outer: while (left < right && iter-- > 0) {
			if (iter === 0) throw new Error('max iterations reached???');
			const mid = Math.floor((left + right) / 2);

			const [currentPattern, country, geocode] = ranges[mid];
			console.log({ iter, phone, currentPattern, left, mid, right });

			for (let i = 0; i < phone.length; i++) {
				const patternC = currentPattern[i];

				if (patternC === '[') {
					result = currentPattern;
					// there can only be up to 9 or 10 combos? in either direction
					for (let i = Math.max(mid - 9, 0); i < Math.min(mid + 9, ranges.length - 1); i++) {
						const [pattern, country, geocode] = ranges[i];
						const regex = new RegExp(`^${pattern}`);
						if (regex.test(phone)) {
							if (geocode) {
								result = geocode;
								result += `, ${country}`;
							} else {
								result = country;
							}
							break outer;
						}
					}
					throw new Error('got stuck on range');
				}

				const phoneN = Number(phone[i]),
					patternN = Number(patternC);

				// compare phone digit to pattern digit
				if (phoneN < patternN) {
					right = mid - 1;
					break;
				} else if (phoneN > patternN) {
					left = mid + 1;
					break;
				} else if (i == phone.length - 1) {
					// incomplete phone number
					if (geocode) {
						result = geocode;
						result += `, ${country}`;
					} else {
						result = country;
					}
					break outer;
				} else {
					continue; // check next digit
				}
			}
		}
	} else {
		console.log(`geocode file not found for country code: ${countryCode}`);
	}

	// try just country search
	if (!result) {
		const countries: Record<string, string> = await geocodeFiles['./geocoding/countries.json']();
		result = countries[countryCode];
	}

	// text to coordinates
	// https://nominatim.openstreetmap.org/ui/search.html
	// https://developers.google.com/maps/documentation/geocoding/overview

	const params = new URLSearchParams({
		q: result,
		limit: '1',
		format: 'jsonv2'
	});
	const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
	const data = await response.json();

	console.log(data);

	if (data.length === 0) {
		throw new Error('no geocode data found');
	}

	return data[0];
};
