import {Layout} from 'ledbetter-common';

import {db} from './db.js';
import {UniquenessError} from './errors.js';

const LIST_LIMIT: number = 10;


export async function get(id: string): Promise<Layout | undefined> {
	return await db<Layout>('layouts')
		.where('id', id)
		.first();
}

export async function list(opts?: {prefix?: string}): Promise<Layout[]> {
	let query = db<Layout>('layouts')
		.limit(LIST_LIMIT);
	if (opts && opts.prefix) {
		query = query.where('name', 'like', opts.prefix.replace('%', '\\%') + '%');
	}
	return await query;
}

export async function create(layout: Layout): Promise<void> {
	try {
		return await db('layouts').insert(layout);
	} catch (err) {
		checkUniquenessErrors(layout, err);
		throw err;
	}
}

export async function update(layout: Layout): Promise<void> {
	try {
		return await db<Layout>('layouts')
			.where('id', layout.id)
			.update(layout);
	}	catch (err) {
		checkUniquenessErrors(layout, err);
		throw err;
	}
}

export async function destroy(id: string): Promise<boolean> {
	const nRows = await db('layouts')
		.where('id', id)
		.del();
	return nRows !== 0;
}

function checkUniquenessErrors(layout: Layout, err: any) {
	if (err instanceof Object &&
		err.hasOwnProperty('code') &&
		err.hasOwnProperty('sqlMessage')) {
		const {code, sqlMessage} = err as {code: string, sqlMessage: string};
		if (code == 'ER_DUP_ENTRY' && sqlMessage.match(/layouts\.layouts_name_unique/)) {
			throw new UniquenessError('name', `Layout already exists with name: ${layout.name}`);
		}
	}
}