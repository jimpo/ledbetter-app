import {db} from './db.js';
import {UniquenessError} from './errors.js';

export const API_VERSION_LATEST = 1;

export interface Program {
	id: string,
	name: string,
	apiVersion: number,
	ascVersion: string,
	sourceCode: {[fileName: string]: string},
	wasm: Uint8Array,
	wasmSourceMap: string,
}

const LIST_LIMIT: number = 10;


export async function get(id: string): Promise<Program | undefined> {
	return await db<Program>('programs')
		.where('id', id)
		.first();
}

export async function list(): Promise<Program[]> {
	return await db<Program>('programs')
		.limit(LIST_LIMIT);
}

export async function create(program: Program): Promise<void> {
	try {
		return await db('programs').insert({
			...program,
			sourceCode: JSON.stringify(program.sourceCode),
		});
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
