import {ProgramBrief} from 'ledbetter-common';

import {db, isUniquenessError} from './db.js';
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
		return await db<Program>('programs').insert(program);
	} catch (err) {
		checkUniquenessErrors(program, err);
		throw err;
	}
}

export async function update(program: Program): Promise<void> {
	try {
		return await db<Program>('programs')
			.where('id', program.id)
			.update(program);
	}	catch (err) {
		checkUniquenessErrors(program, err);
		throw err;
	}
}

export async function destroy(id: string): Promise<boolean> {
	const nRows = await db('programs')
		.where('id', id)
		.del();
	return nRows !== 0;
}

function checkUniquenessErrors(program: Program, err: any) {
	if (isUniquenessError('programs', 'name', err)) {
		throw new UniquenessError('name', `Program already exists with name: ${program.name}`);
	}
}