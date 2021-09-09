import {db} from './db';

const LIST_LIMIT: number = 10;

export interface LEDDriver {
    id: string,
    name: string,
    ipAddress: string,
}

export async function create(driver: LEDDriver): Promise<void> {
    return db('ledDrivers').insert(driver);
}

export async function list(): Promise<LEDDriver[]> {
    return db<LEDDriver>('ledDrivers')
        .limit(LIST_LIMIT);
}
