import { randomUUID } from 'crypto';
import Koa, {Context} from 'koa';
import Joi from 'joi';

import * as layouts from '../layouts.js';
import {UniquenessError} from '../errors.js';
import {pixelLayout} from 'ledbetter-common';

export async function listLayouts(ctx: Context, next: Koa.Next) {
	ctx.body = await layouts.list();
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
