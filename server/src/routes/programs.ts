import {version as ascVersion} from 'assemblyscript/cli/asc';
import {randomUUID} from 'crypto';
import Koa from 'koa';
import Joi from "joi";

import {compile} from '../programCompiler.js';
import {InvalidProgramSourcePathError, CompilationError, UniquenessError} from '../errors.js';
import * as programsMod from '../programs.js';
import type {Program} from '../programs.js';


export async function listPrograms(ctx: Koa.Context, next: Koa.Next): Promise<void> {
	const programs = await programsMod.list();
	ctx.body = programs.map(program => {
		return {
			id: program.id,
			name: program.name,
			apiVersion: program.apiVersion,
			ascVersion: program.ascVersion,
		};
	});
	await next();
}

export async function createProgram(ctx: Koa.Context, next: Koa.Next): Promise<void> {
	const requestSchema = Joi.object({
		name: Joi.string()
			.required(),
		sourceCode: Joi.object()
			.pattern(Joi.string(), Joi.string())
			.required(),
	});

	const { value: body, error } = requestSchema.validate(ctx.request.body);
	if (error) {
		ctx.status = 422;
		ctx.body = error.details;
		return await next();
	}

	const sourceCode = body.sourceCode as {[filePath: string]: string};

	let wasm: Buffer, sourceMap: string;
	try {
		({wasm, sourceMap} = await compile(sourceCode));
	} catch (err) {
		if (err instanceof CompilationError) {
			ctx.status = 422;
			ctx.body = {error: err.stderr || err.message};
			return await next();
		} else if (err instanceof InvalidProgramSourcePathError) {
			ctx.status = 422;
			ctx.body = {error: err.message};
			return await next();
		}
		throw err;
	}

	const program: Program = {
		id: randomUUID(),
		name: body.name as string,
		apiVersion: programsMod.API_VERSION_LATEST,
		ascVersion,
		sourceCode,
		wasm,
		wasmSourceMap: sourceMap,
	};

	try {
		await programsMod.create(program);
	} catch (err) {
		console.log(err);
		if (err instanceof UniquenessError) {
			ctx.status = 422;
			ctx.body = {
				error: err.message,
				field: err.field,
			};
			return await next();
		}

		throw err;
	}

	ctx.status = 201;
	ctx.body = {
		id: program.id,
		name: program.name,
		apiVersion: program.apiVersion,
		ascVersion: program.ascVersion,
	};
	await next();
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

	let wasm: Buffer, sourceMap: string;
	try {
		({wasm, sourceMap} = await compile(body.files as {[filePath: string]: string}));
	} catch (err) {
		if (err instanceof CompilationError) {
			ctx.status = 422;
			ctx.body = {error: err.stderr || err.message};
			return await next();
		} else if (err instanceof InvalidProgramSourcePathError) {
			ctx.status = 422;
			ctx.body = {error: err.message};
			return await next();
		}
		throw err;
	}
	ctx.body = {
		wasm: wasm.toString('base64'),
		sourceMap,
	};

	return await next();
}