import {db} from './db.js';

const LIST_LIMIT: number = 10;

export interface LEDDriver {
    id: string,
    name: string,
    ipAddress: string,
}

export async function create(driver: LEDDriver): Promise<void> {
    return await db('ledDrivers').insert(driver);
}

export async function list(): Promise<LEDDriver[]> {
    return await db<LEDDriver>('ledDrivers')
        .limit(LIST_LIMIT);
}
