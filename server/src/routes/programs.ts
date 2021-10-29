import Koa from 'koa';
import {readFileSync} from 'fs';
import Joi from "joi";

import {compile} from '../programCompiler.js';

const TEST_PROGRAM_WASM = readFileSync('../testProgram.wasm');


export async function testProgram(ctx: Koa.Context, next: Koa.Next): Promise<void> {
	ctx.body = {
		wasm: TEST_PROGRAM_WASM.toString('base64'),
	};
}

export async function compileProgram(ctx: Koa.Context, next: Koa.Next): Promise<void> {
	const requestSchema = Joi.object({
		files: Joi.object().pattern(Joi.string(), Joi.string()).required(),
	});

	const { value: body, error } = requestSchema.validate(ctx.request.body);
	if (error) {
		ctx.status = 422;
		ctx.body = error.details;
		return await next();
	}

	await compile(body.files as {[filePath: string]: string});
}