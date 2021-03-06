import {program as programCommon} from 'ledbetter-common';
const {API_VERSION_LATEST, validateWasmBinary} = programCommon;

import {randomUUID} from 'crypto';
import Koa from 'koa';
import Joi from "joi";

import {UniquenessError} from '../errors.js';
import * as programsMod from '../programs.js';
import {getAttachedWasm, getAttachedWasmSourceMap} from "./common.js";
import {isHttpError} from "http-errors";
import {RouterContext} from "@koa/router";
import {program as programLib} from 'ledbetter-common';
import assert from 'assert';
const {programBriefSchema} = programLib;


export async function listPrograms(ctx: Koa.Context, next: Koa.Next): Promise<void> {
	let opts = {};
	if (ctx.query['autocomplete']) {
		opts = {prefix: ctx.query['autocomplete']};
	}
	ctx.body = await programsMod.list(opts);
	await next();
}

export async function getProgram(ctx: Koa.Context, next: Koa.Next): Promise<void> {
	const programBrief = await programsMod.getBrief(ctx.params.id);
	if (programBrief) {
		ctx.body = programBrief;
	}
	return await next();
}

export async function getProgramWasm(ctx: Koa.Context, next: Koa.Next): Promise<void> {
	const wasm = await programsMod.getWasm(ctx.params.id);
	if (wasm) {
		ctx.body = wasm;
	}
	await next();
}

export async function getProgramWasmSourceMap(ctx: Koa.Context, next: Koa.Next): Promise<void> {
	const wasmSourceMap = await programsMod.getWasmSourceMap(ctx.params.id);
	if (wasmSourceMap) {
		ctx.body = wasmSourceMap;
	}
	await next();
}

export async function deleteProgram(ctx: Koa.Context, next: Koa.Next): Promise<void> {
	const found = await programsMod.destroy(ctx.params.id);
	if (found) {
		ctx.status = 200;
	}
	await next();
}

export async function createProgram(ctx: RouterContext, next: Koa.Next): Promise<void> {
	const requestSchema = Joi.object({
		name: Joi.string()
			.required(),
		apiVersion: Joi.number()
			.default(API_VERSION_LATEST),
	});

	const { value: body, error } = requestSchema.validate(ctx.request.body);
	if (error) {
		ctx.status = 422;
		ctx.body = error.details;
		return await next();
	}

	const {name, apiVersion} = body as {name: string, apiVersion: number};

	let wasm;
	try {
		wasm = await getAttachedWasm(ctx);
	} catch (err) {
		if (isHttpError(err)) {
			ctx.status = err.statusCode;
			ctx.body = {error: err.message};
			return await next();
		} else {
			throw err;
		}
	}

	let wasmSourceMap;
	try {
		wasmSourceMap = await getAttachedWasmSourceMap(ctx);
	} catch (err) {
		if (isHttpError(err)) {
			ctx.status = err.statusCode;
			ctx.body = {error: err.message};
			return await next();
		} else {
			throw err;
		}
	}

	try {
		await validateWasmBinary(wasm, apiVersion);
	} catch (err) {
		if (err instanceof Error) {
			ctx.status = 422;
			ctx.body = {err: err.message};
			return await next();
		} else {
			throw err;
		}
	}

	const id = randomUUID();
	try {
		await programsMod.create({id, name, apiVersion, wasm, wasmSourceMap});
	} catch (err) {
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
	ctx.body = {id, name, apiVersion};
	await next();
}

export async function putProgram(ctx: RouterContext, next: Koa.Next): Promise<void> {
	const currentProgramBrief = await programsMod.getBrief(ctx.params.id);
	if (!currentProgramBrief) {
		return await next();
	}

	const { value: body, error } = programBriefSchema.validate(ctx.request.body);
	if (error) {
		ctx.status = 422;
		ctx.body = error.details;
		return await next();
	}

	assert(body !== undefined, 'body is undefined iff error is not undefined');

	const {id, name, apiVersion} = body;
	if (id !== currentProgramBrief.id) {
		ctx.status = 422;
		ctx.body = {error: 'id cannot be changed'};
		return await next();
	}

	let wasm;
	try {
		wasm = await getAttachedWasm(ctx);
	} catch (err) {
		if (isHttpError(err)) {
			ctx.status = err.statusCode;
			ctx.body = {error: err.message};
			return await next();
		} else {
			throw err;
		}
	}

	let wasmSourceMap;
	try {
		wasmSourceMap = await getAttachedWasmSourceMap(ctx);
	} catch (err) {
		if (isHttpError(err)) {
			ctx.status = err.statusCode;
			ctx.body = {error: err.message};
			return await next();
		} else {
			throw err;
		}
	}

	try {
		await validateWasmBinary(wasm, apiVersion);
	} catch (err) {
		if (err instanceof Error) {
			ctx.status = 422;
			ctx.body = {error: `Invalid Wasm program: ${err.message}`};
			return await next();
		} else {
			throw err;
		}
	}

	try {
		await programsMod.update({id, name, apiVersion, wasm, wasmSourceMap});
	} catch (err) {
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

	ctx.status = 200;
	ctx.body = {id, name, apiVersion};
	await next();
}