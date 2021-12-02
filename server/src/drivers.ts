import {LEDDriver} from 'ledbetter-common';

import {db} from './db.js';
import {getConnectedDrivers} from './driverManager.js';

const LIST_LIMIT: number = 10;


export async function create(driver: LEDDriver): Promise<void> {
    return await db('ledDrivers').insert(driver);
}

export async function list(): Promise<LEDDriver[]> {
    return await db<LEDDriver>('ledDrivers')
        .limit(LIST_LIMIT);
}

export async function listConnected(): Promise<LEDDriver[]> {
	return Array.from(getConnectedDrivers().values(), (client) => {
		return {
			id: client.id,
			name: client.name,
			ipAddress: '',
			status: client.status,
		};
	});
}