import {db} from './db';
import {UniquenessError} from './errors';
import {Layout} from 'ledbetter-common';

const LIST_LIMIT: number = 10;


export async function list(): Promise<Layout[]> {
	return await db<Layout>('layouts')
		.limit(LIST_LIMIT);
}

export async function create(layout: Layout): Promise<void> {
	try {
		return await db('layouts').insert(layout);
	} catch (err) {
		if (err instanceof Object &&
			err.hasOwnProperty('code') &&
			err.hasOwnProperty('sqlMessage')) {
			const {code, sqlMessage} = err as {code: string, sqlMessage: string};
			if (code == 'ER_DUP_ENTRY' && sqlMessage.match(/layouts\.layouts_name_unique/)) {
				throw new UniquenessError('name', `Layout already exists with name: ${layout.name}`);
			}
		}
		throw err;
	}
}
