import {randomUUID} from 'crypto';
import Koa from 'koa';
import {RouterContext} from '@koa/router';
import Joi from 'joi';
import {LEDDriver} from 'ledbetter-common';

import * as drivers from '../drivers.js';
import * as programs from '../programs.js';
import {getConnectedDrivers} from '../driverManager.js';
import {getAttachedWasm} from "./common.js";
import {isHttpError} from "http-errors";

export async function listLEDDrivers(ctx: RouterContext, next: Koa.Next) {
	let results: LEDDriver[];
	if (ctx.query['connected']) {
		results = await drivers.listConnected();
	} else {
		results = await drivers.list();
	}
	ctx.body = results;
	await next();
}

export async function createLEDDriver(ctx: RouterContext, next: Koa.Next) {
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

	const ledDriver = {
		id: randomUUID(),
		name: body.name as string,
		ipAddress: body.ipAddress as string,
	};
	await drivers.create(ledDriver);
	ctx.status = 201;
	ctx.body = ledDriver;

	await next();
}

export async function runProgramOnLEDDriver(ctx: RouterContext, next: Koa.Next) {
	const requestSchema = Joi.object({
		programId: Joi.string()
			.uuid()
			.required(),
	});

	const { value: body, error } = requestSchema.validate(ctx.request.body);
	if (error) {
		ctx.status = 422;
		ctx.body = error.details;
		return await next();
	}

	const connectedDrivers = getConnectedDrivers();
	const driverClient = connectedDrivers.get(ctx.params.id);
	if (!driverClient) {
		return await next();
	}

	const {programId} = body as {programId: string};
	const program = await programs.get(programId);
	if (!program) {
		ctx.status = 422;
		ctx.body = {error: `No program found with id ${programId}`};
		return await next();
	}

	const wasm = Buffer.from(program.wasm);
	const status = await driverClient.run(wasm);
	ctx.body = {status};
	await next();
}

export async function runWasmOnLEDDriver(ctx: RouterContext, next: Koa.Next) {
	const connectedDrivers = getConnectedDrivers();
	const driverClient = connectedDrivers.get(ctx.params.id);
	if (!driverClient) {
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

	const status = await driverClient.run(Buffer.from(wasm));
	ctx.body = {status};
	await next();
}

export async function playLEDDriver(ctx: RouterContext, next: Koa.Next) {
	const connectedDrivers = getConnectedDrivers();
	const driverClient = connectedDrivers.get(ctx.params.id);
	if (driverClient) {
		const status = await driverClient.play();
		ctx.body = {status};
	}
	await next();
}

export async function pauseLEDDriver(ctx: RouterContext, next: Koa.Next) {
	const connectedDrivers = getConnectedDrivers();
	const driverClient = connectedDrivers.get(ctx.params.id);
	if (driverClient) {
		const status = await driverClient.pause();
		ctx.body = {status};
	}
	await next();
}

export async function stopLEDDriver(ctx: RouterContext, next: Koa.Next) {
	const connectedDrivers = getConnectedDrivers();
	const driverClient = connectedDrivers.get(ctx.params.id);
	if (driverClient) {
		const status = await driverClient.stop();
		ctx.body = {status};
	}
	await next();
}
