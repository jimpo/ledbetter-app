import Koa, {ExtendableContext} from 'koa';
import Joi from 'joi';

import * as drivers from '../drivers';

export async function listLEDDrivers(ctx: ExtendableContext, next: Koa.Next) {
    ctx.body = await drivers.list();
    await next();
}

export async function createLEDDriver(ctx: ExtendableContext, next: Koa.Next) {
    const requestSchema = Joi.object({
        name: Joi.string()
            .required(),
        ipAddress: Joi.string()
            .ip({ version: ['ipv4', 'ipv6'], cidr: 'forbidden' })
            .required(),
    });

    const { value: body, error } = requestSchema.validate(ctx.request.body);
    if (error) {
        ctx.status = 422;
        ctx.body = error.details;
        return await next();
    }
    const name: string = body.name;
    const ipAddress: string = body.ipAddress;

    ctx.status = 201;
    ctx.body = {
        name,
        ipAddress,
    };
    await next();
}