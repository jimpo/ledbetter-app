import {db} from './db';

export interface Layout {
  id: string,
  name: string,
  sourceCode: string,
}

export async function create(layout: Layout): Promise<void> {
    return db('ledDrivers').insert(layout);
}
