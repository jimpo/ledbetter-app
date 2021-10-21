import { randomUUID } from 'crypto';
import Koa, { ExtendableContext } from 'koa';
import Joi from 'joi';

import * as layouts from '../layouts';
import {UniquenessError} from '../errors';

export async function createLayout(ctx: ExtendableContext, next: Koa.Next) {
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
	// TODO: Actually validate by parsing sourceCode
	try {
		await layouts.create(layout);
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
	ctx.body = layout;
	await next();
}
