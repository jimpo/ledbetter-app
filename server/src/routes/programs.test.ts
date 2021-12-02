import request from 'supertest';

import app from '../app.js';
import {UUID_REGEX} from '../../test/util.js';
import {randomUUID} from 'crypto';
import * as programsMod from '../programs.js';
import {compile, CompilationResult} from '../programCompiler.js';
import type {Program} from '../programs.js';

const TRIVIAL_SOURCE = {
	'PixelAnimation.ts': `
import {Pixel} from './mainTypes';

export class PixelAnimation {
  constructor(private pixels: Pixel[][]) {
  }

  tick(): void {
  }

  render(): void {
  }
}
`,
};


async function createTestProgram(): Promise<Program> {
	const result = await compile(TRIVIAL_SOURCE);
	const program = {
		id: randomUUID(),
		name: 'Test',
		apiVersion: 1,
		ascVersion: result.ascVersion,
		sourceCode: TRIVIAL_SOURCE,
		wasm: result.wasm,
		wasmSourceMap: result.sourceMap,
	};
	await programsMod.create(program);
	return program;
}

test('GET /program/:id gets program with source code', async () => {
	const program = await createTestProgram();

	const response = await request(app.callback())
		.get(`/api/programs/${program.id}`);
	expect(response.status).toBe(200);
	expect(response.get('Content-Type')).toContain('application/json');
	expect(response.body).toEqual({
		id: program.id,
		name: program.name,
		apiVersion: program.apiVersion,
		ascVersion: program.ascVersion,
		sourceCode: program.sourceCode,
	});
});

test('GET /program/:id 404s on unknown program ID', async () => {
	const response = await request(app.callback())
		.get(`/api/programs/${randomUUID()}`);
	expect(response.status).toBe(404);
});

test('GET /program/:id/main.wasm gets program Wasm', async () => {
	const program = await createTestProgram();

	const response = await request(app.callback())
		.get(`/api/programs/${program.id}/main.wasm`);
	expect(response.status).toBe(200);
	expect(response.get('Content-Type')).toContain('application/octet-stream');
	expect(response.body).toEqual(program.wasm);
});

test('GET /program/:id/main.wasm.map gets program Wasm source map', async () => {
	const program = await createTestProgram();

	const response = await request(app.callback())
		.get(`/api/programs/${program.id}`);
	expect(response.status).toBe(200);
	expect(response.get('Content-Type')).toContain('application/json');
	expect(response.body).toEqual({
		id: program.id,
		name: program.name,
		apiVersion: program.apiVersion,
		ascVersion: program.ascVersion,
		sourceCode: program.sourceCode,
	});
});

test('POST /programs creates a program', async () => {
	const response = await request(app.callback())
		.post('/api/programs')
		.send({
			name: 'Trivial',
			sourceCode: TRIVIAL_SOURCE,
		});
	expect(response.status).toBe(201);
	expect(response.body).toMatchObject({
		id: expect.stringMatching(UUID_REGEX),
		name: 'Trivial',
		apiVersion: 1,
		ascVersion: /^\d+\.\d+\.\d+$/,
	});
});

test('POST /programs rejects programs with invalid source', async () => {
	const response = await request(app.callback())
		.post('/api/programs')
		.send({
			name: 'Uh oh...',
			sourceCode: {'PixelAnimation.ts': ''},
		});
	expect(response.status).toBe(422);
});

test('POST /programs/compile compiles a program', async () => {
	const compileResponse = await request(app.callback())
		.post('/api/programs/compile')
		.send({files: TRIVIAL_SOURCE});
	expect(compileResponse.status).toBe(200);
	const {wasm: wasmB64} = compileResponse.body as {wasm: string, sourceMap: string};

	const wasm = Buffer.from(wasmB64, 'base64');
	const module = new WebAssembly.Module(wasm);
	expect(WebAssembly.Module.exports(module))
		.toEqual(expect.arrayContaining([
			{ name: 'initLayoutSetNumStrips', kind: 'function' },
			{ name: 'initLayoutSetStripLen', kind: 'function' },
			{ name: 'initLayoutSetPixelLoc', kind: 'function' },
			{ name: 'initLayoutDone', kind: 'function' },
			{ name: 'tick', kind: 'function' },
			{ name: 'getPixelVal', kind: 'function' },
			{ name: 'memory', kind: 'memory' }
		]));
});

test('DELETE /program/:id deletes program', async () => {
	const program = await createTestProgram();

	const response = await request(app.callback())
		.delete(`/api/programs/${program.id}`);
	expect(response.status).toBe(200);

	const programLookup = await programsMod.get(program.id);
	expect(programLookup).toBeUndefined();
});

test('DELETE /program/:id 404s on unknown program', async () => {
	const response = await request(app.callback())
		.delete(`/api/programs/${randomUUID()}`);
	expect(response.status).toBe(404);
});
