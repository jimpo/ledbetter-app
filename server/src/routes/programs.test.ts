import request from 'supertest';

import app from '../app.js';
import {UUID_REGEX} from '../../test/util.js';

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
			{ name: 'getPixelRed', kind: 'function' },
			{ name: 'getPixelGrn', kind: 'function' },
			{ name: 'getPixelBlu', kind: 'function' },
			{ name: 'memory', kind: 'memory' }
		]));
});
