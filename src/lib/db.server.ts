import { MongoClient, ObjectId, type WithId } from 'mongodb';
import { MONGO_URL } from '$env/static/private';
import type { GeocodeData } from './geocoding.server';

const client = new MongoClient(MONGO_URL);

client.connect();

export const db = client.db('dial-a-carol');

export const logCall = async (countryCode: number, phone: string, data: GeocodeData) => {
	const collection = db.collection<Call>('calls');

	const res = await collection.insertOne({
		countryCode,
		phone,
		lat: Number(data.lat),
		lon: Number(data.lon),
		name: data.display_name
	});

	return res.acknowledged;
};

export interface Call {
	countryCode: number;
	phone: string;
	lat: number;
	lon: number;
	name: string;
}

export type CallDoc = WithId<Call>;
