const geocodeFiles = import.meta.glob<any>('./geocoding/*.json', {
	import: 'default',
	eager: false
});

export interface GeocodeData {
	lat: string;
	lon: string;
	display_name: string;
}

export const geocode = async (countryCode: number, phone: string) => {
	const filePath = `./geocoding/${countryCode}.json`;

	let result = '';

	if (geocodeFiles[filePath]) {
		const ranges: ([string, string] | [string, string, string])[] = await geocodeFiles[filePath]();

		let left = 0,
			right = ranges.length - 1,
			mid = 0;

		let iter = 25;

		const testNearLast = (start: number) => {
			let leftI = start,
				rightI = start + 1,
				iter = 200; // just a sanity check

			const test = (i: number) => {
				const [pattern, country, geocode] = ranges[i];
				// console.debug({ type: 2, iter, phone, pattern, i });
				const regex = new RegExp(`^${pattern}`);
				if (regex.test(phone)) {
					if (geocode) {
						result = geocode;
						result += `, ${country}`;
					} else {
						result = country;
					}
					return true;
				}
				return false;
			};

			while ((leftI >= 0 || rightI < ranges.length) && iter-- > 0) {
				if (leftI >= 0) {
					if (test(leftI)) return true;
					leftI--;
				}

				if (rightI < ranges.length) {
					if (test(rightI)) return true;
					rightI++;
				}
			}

			throw new Error('got stuck on range');
		};

		outer: while (left < right && iter-- > 0) {
			if (iter === 0) throw new Error('max halving iterations reached');
			mid = Math.floor((left + right) / 2);

			const [currentPattern, country, geocode] = ranges[mid];
			// console.debug({ iter, phone, currentPattern, left, mid, right });

			for (let i = 0; i < phone.length; i++) {
				const patternC = currentPattern[i];

				if (patternC === '[') {
					result = currentPattern;

					testNearLast(mid);
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

		// sometimes we get stuck nearby, causing a lot fallback to us
		testNearLast(mid);
	} else {
		console.log(`geocode file not found for country code: ${countryCode}`);
	}

	// text to coordinates
	// https://nominatim.openstreetmap.org/ui/search.html
	// https://developers.google.com/maps/documentation/geocoding/overview
	const search = async (q: string): Promise<GeocodeData[]> => {
		const params = new URLSearchParams({
			q,
			limit: '1',
			format: 'jsonv2'
		});
		const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
			headers: {
				'User-Agent': 'dial-a-carol'
			}
		});
		return await response.json();
	};

	let data: GeocodeData[] = [];

	if (result) data = await search(result);

	// try just country search
	if (data.length === 0) {
		console.log(`falling back to country search for ${countryCode} ${phone}`);
		const countries: Record<string, string> = await geocodeFiles['./geocoding/countries.json']();
		data = await search(countries[countryCode]);
	}

	if (data.length === 0) {
		throw new Error('no geocode data found');
	}

	return data[0];
};
