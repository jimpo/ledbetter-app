import request from 'supertest';

import app from '../app.js';


test('POST /programs/compile compiles a program', async () => {
	const source = `
import {Pixel} from './mainTypes';

export class PixelAnimation {
  constructor(private pixels: Pixel[][]) {
  }

  tick(): void {
  }

  render(): void {
  }
}
`;

	const compileResponse = await request(app.callback())
		.post('/api/programs/compile')
		.send({files: {'PixelAnimation.ts': source}});
	expect(compileResponse.status).toBe(200);
	const {wasm: wasmB64} = compileResponse.body as {wasm: string};

	const wasm = Buffer.from(wasmB64, 'base64');
	const module = new WebAssembly.Module(wasm);
	expect(WebAssembly.Module.exports(module))
		.toEqual(expect.arrayContaining([
			{ name: 'initLayoutSetNumStrips', kind: 'function' },
			{ name: 'initLayoutSetStripLen', kind: 'function' },
			{ name: 'initLayoutSetPixelLoc', kind: 'function' },
			{ name: 'initLayoutDone', kind: 'function' },
			{ name: 'tick', kind: 'function' },
			{ name: 'render', kind: 'function' },
			{ name: 'getPixelRed', kind: 'function' },
			{ name: 'getPixelGrn', kind: 'function' },
			{ name: 'getPixelBlu', kind: 'function' },
			{ name: 'memory', kind: 'memory' }
		]));
});
