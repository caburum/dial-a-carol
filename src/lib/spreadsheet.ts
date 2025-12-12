import { parse } from 'web-csv-toolbox';

export const getCalls = async () => {
	const res = await fetch(
		'https://docs.google.com/spreadsheets/d/115MTAMJJ31PJ1FJXp_welS00ZRoQWdyY2vop8vj-mws/export?format=csv'
	);

	const csv = await res.text();

	const data = await Array.fromAsync(parse(csv));

	return data;
};
