import {db} from './db';
import {layout as lll} from 'ledbetter-common';

export interface Layout {
  id: string,
  name: string,
  sourceCode: string,
}

export async function create(layout: Layout): Promise<void> {
	return db('ledDrivers').insert(layout);
}
