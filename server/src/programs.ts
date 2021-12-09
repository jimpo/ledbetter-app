import {ProgramBrief} from 'ledbetter-common';

import {db} from './db.js';
import {UniquenessError} from './errors.js';

export interface Program {
	id: string,
	name: string,
	apiVersion: number,
	wasm: ArrayBuffer,
	wasmSourceMap: string | null,
}

const LIST_LIMIT: number = 10;


export async function get(id: string): Promise<Program | undefined> {
	return await db<Program>('programs')
		.where('id', id)
		.first();
}

export async function getBrief(id: string): Promise<ProgramBrief | undefined> {
	return await db<Program>('programs')
		.where('id', id)
		.select('id', 'name', 'apiVersion')
		.first();
}

export async function getWasm(id: string): Promise<ArrayBuffer | undefined> {
	const result = await db<Program>('programs')
		.where('id', id)
		.select('wasm')
		.first();
	return result && result.wasm;
}

export async function getWasmSourceMap(id: string): Promise<string | null | undefined> {
	const result = await db<Program>('programs')
		.where('id', id)
		.select('wasmSourceMap')
		.first();
	return result && result.wasmSourceMap;
}

export async function list(opts?: {prefix?: string}): Promise<ProgramBrief[]> {
	let query = db<Program>('programs')
		.select('id', 'name', 'apiVersion')
		.limit(LIST_LIMIT)
	if (opts && opts.prefix) {
		query = query.where('name', 'like', opts.prefix.replace('%', '\\%') + '%');
	}
	return await query;
}

export async function create(program: Program): Promise<void> {
	try {
		return await db('programs').insert(program);
	} catch (err) {
		if (err instanceof Object &&
			err.hasOwnProperty('code') &&
			err.hasOwnProperty('sqlMessage')) {
			const {code, sqlMessage} = err as {code: string, sqlMessage: string};
			if (code == 'ER_DUP_ENTRY' && sqlMessage.match(/programs\.programs_name_unique/)) {
				throw new UniquenessError('name', `Program already exists with name: ${program.name}`);
			}
		}
		throw err;
	}
}

export async function destroy(id: string): Promise<boolean> {
	const nRows = await db('programs')
		.where('id', id)
		.del();
	return nRows !== 0;
}
