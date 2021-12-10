import { randomUUID } from 'crypto';
import Koa, {Context} from 'koa';
import Joi from 'joi';

import * as layouts from '../layouts.js';
import {UniquenessError} from '../errors.js';
import {pixelLayout, layout as layoutLib} from 'ledbetter-common';
import {RouterContext} from "@koa/router";
import assert from "assert";
const {layoutSchema} = layoutLib;


export async function getLayout(ctx: RouterContext, next: Koa.Next) {
	const layout = await layouts.get(ctx.params.id);
	if (layout) {
		ctx.body = layout;
	}
	await next();
}

export async function listLayouts(ctx: Context, next: Koa.Next) {
	let opts = {};
	if (ctx.query['autocomplete']) {
		opts = {prefix: ctx.query['autocomplete']};
	}
	ctx.body = await layouts.list(opts);
	await next();
}

export async function createLayout(ctx: Context, next: Koa.Next) {
	const requestSchema = Joi.object({
		name: Joi.string()
			.required(),
		sourceCode: Joi.string()
			.required(),
	});

	const { value: body, error } = requestSchema.validate(ctx.request.body);
	if (error) {
		ctx.status = 422;
		ctx.body = error.details;
		return await next();
	}

	const layout = {
		id: randomUUID(),
		name: body.name as string,
		sourceCode: body.sourceCode as string,
	};

	try {
		pixelLayout.parseCode(layout.sourceCode);
	} catch (err) {
		if (err instanceof Error) {
			ctx.status = 422;
			ctx.body = {error: `Invalid code: ${err.message}`};
			return await next();
		}
		return;
	}

	try {
		await layouts.create(layout);
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
	ctx.body = layout;
	await next();
}

export async function putLayout(ctx: RouterContext, next: Koa.Next) {
	const currentLayout = await layouts.get(ctx.params.id);
	if (!currentLayout) {
		return await next();
	}

	const { value: newLayout, error } = layoutSchema.validate(ctx.request.body);
	if (error) {
		ctx.status = 422;
		ctx.body = error.details;
		return await next();
	}

	assert(newLayout !== undefined, 'newLayout is undefined iff error is not undefined');

	if (newLayout.id !== currentLayout.id) {
		ctx.status = 422;
		ctx.body = {error: 'id cannot be changed'};
		return await next();
	}

	try {
		pixelLayout.parseCode(newLayout.sourceCode);
	} catch (err) {
		if (err instanceof Error) {
			ctx.status = 422;
			ctx.body = {error: `Invalid code: ${err.message}`};
			return await next();
		}
		return;
	}

	try {
		await layouts.update(newLayout);
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

	ctx.body = newLayout;
	await next();
}

export async function deleteLayout(ctx: RouterContext, next: Koa.Next) {
	const found = await layouts.destroy(ctx.params.id);
	if (found) {
		ctx.status = 200;
	}
	await next();
}
