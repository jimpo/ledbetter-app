import Koa from 'koa';
import fs from 'fs';


const TEST_PROGRAM_WASM = fs.readFileSync('../testProgram.wasm');

export async function testProgram(ctx: Koa.Context, next: Koa.Next): Promise<void> {
	ctx.body = {
		wasm: TEST_PROGRAM_WASM.toString('base64'),
	};
}