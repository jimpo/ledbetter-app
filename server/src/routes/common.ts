import multer from "@koa/multer";
import createHttpError from 'http-errors';
import {RouterContext} from "@koa/router";
import {TextDecoder} from "util";

export async function getAttachedWasm(ctx: RouterContext): Promise<ArrayBuffer> {
	const files = ctx.request.files as { [p: string]: multer.File[] };
	const wasmFiles = files['wasm'];
	if (!wasmFiles) {
		throw new createHttpError.BadRequest("Request must have a Wasm file attached with name wasm");
	}

	const wasmFile = wasmFiles[0];
	if (wasmFile.mimetype !== 'application/wasm') {
		throw new createHttpError.UnsupportedMediaType(
			"Attached wasm file must have mimetype application/wasm"
		);
	}

	return wasmFile.buffer;
}

export async function getAttachedWasmSourceMap(ctx: RouterContext): Promise<string | null> {
	const files = ctx.request.files as { [p: string]: multer.File[] };
	const wasmSourceMapFiles = files['wasmSourceMap'];
	if (!wasmSourceMapFiles) {
		return null;
	}

	const wasmSourceMapFile = wasmSourceMapFiles[0];
	return (new TextDecoder(wasmSourceMapFile.encoding)).decode(wasmSourceMapFile.buffer);
}