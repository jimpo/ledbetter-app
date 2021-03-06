import Koa, {DefaultContext, DefaultState} from 'koa';
import Router, {RouterContext} from '@koa/router';
import bodyParser from 'koa-bodyparser';
import send from 'koa-send';
import {isHttpError} from 'http-errors';

import {
	listLEDDrivers, createLEDDriver, runProgramOnLEDDriver, runWasmOnLEDDriver, playLEDDriver,
	pauseLEDDriver, stopLEDDriver,
} from './routes/drivers.js';
import {listLayouts, createLayout, getLayout, putLayout, deleteLayout} from './routes/layouts.js';
import {
	deleteProgram, listPrograms, createProgram, getProgram,
	getProgramWasm, getProgramWasmSourceMap, putProgram,
} from './routes/programs.js';
import compose from "koa-compose";
import multer from "@koa/multer";

type DefaultRouterContext = RouterContext<DefaultState, DefaultContext>;

async function checkJsonContentType(ctx: DefaultRouterContext, next: Koa.Next) {
    /// The === false is because null indicates no request body
    if (ctx.is('application/json') === false) {
        ctx.throw(415, 'API only accepts JSON requests');
    }
    await next();
}

async function serveStaticFiles(ctx: Koa.Context, next: Koa.Next) {
	if (!ctx.path.startsWith('/api') &&
		(ctx.method === 'HEAD' || ctx.method === 'GET')) {
		try {
			const done = await send(ctx, ctx.path, { root: 'public' });
			if (done) {
				return;
			}
		} catch (err) {
			if (isHttpError(err) && err.status !== 404) {
				throw err;
			}
		}

		if (ctx.accepts('html')) {
			// Since it's a single page app, serve index for all paths accepting HTML
			const done = await send(ctx, 'public/index.html');
			if (done) {
				return;
			}
		}
	}

	await next();
}

function newJsonBodyParser(opts?: bodyParser.Options)
	: Router.Middleware<DefaultState, DefaultContext>
{
	return compose<DefaultRouterContext>([checkJsonContentType, bodyParser(opts)]);
}

function multipartBodyParser(files: multer.Field[], opts?: bodyParser.Options)
	: Router.Middleware<DefaultState, DefaultContext>
{
	const upload = multer();
	const fields = files.concat([{name: 'body', maxCount: 1}]);

	async function parseBody(ctx: DefaultRouterContext, next: Koa.Next) {
		if (typeof ctx.request.body !== 'object' || !('body' in ctx.request.body)) {
			ctx.throw(400, 'request requires a JSON payload in the body field');
		}
		const {body: bodyJson} = ctx.request.body as {body: string};
		let body;
		try {
			body = JSON.parse(bodyJson);
		} catch (err) {
			ctx.throw(400, 'body field is not valid JSON: ' + err);
		}
		ctx.request.body = body;
		await next();
	}

	return compose<DefaultRouterContext>([upload.fields(fields), parseBody]);
}

const jsonBodyParser = newJsonBodyParser();
let apiRouter = new Router<DefaultState, DefaultContext>({prefix: '/api'})
	.get('/drivers', listLEDDrivers)
	.post('/drivers', jsonBodyParser, createLEDDriver)
	.post('/drivers/:id/run-prog', jsonBodyParser, runProgramOnLEDDriver)
	.post(
		'/drivers/:id/run-wasm',
		multipartBodyParser([{name: 'wasm', maxCount: 1}]),
		runWasmOnLEDDriver
	)
	.post('/drivers/:id/play', jsonBodyParser, playLEDDriver)
	.post('/drivers/:id/pause', jsonBodyParser, pauseLEDDriver)
	.post('/drivers/:id/stop', jsonBodyParser, stopLEDDriver)
	.get('/layouts', listLayouts)
	.get('/layouts/:id', getLayout)
	.post('/layouts', jsonBodyParser, createLayout)
	.put('/layouts/:id', jsonBodyParser, putLayout)
	.delete('/layouts/:id', deleteLayout)
	.get('/programs', listPrograms)
	.get('/programs/:id', getProgram)
	.delete('/programs/:id', deleteProgram)
	.get('/programs/:id/main.wasm', getProgramWasm)
	.get('/programs/:id/main.wasm.map', getProgramWasmSourceMap)
	.put(
		'/programs/:id',
		multipartBodyParser([{name: 'wasm', maxCount: 1}, {name: 'wasmSourceMap', maxCount: 1}]),
		putProgram
	)
	.post(
		'/programs',
		multipartBodyParser([{name: 'wasm', maxCount: 1}, {name: 'wasmSourceMap', maxCount: 1}]),
		createProgram
	);

if (process.env.NODE_ENV === 'test') {
	apiRouter
		.post('/echo-json', jsonBodyParser, async (ctx, next) => {
			ctx.body = ctx.request.body;
			await next();
		})
		.post(
			'/echo-multipart',
			multipartBodyParser([{name: 'wasm', maxCount: 1}]),
			async (ctx, next) => {
				ctx.body = ctx.request.body;
				await next();
			}
		);
}

const app = new Koa()
	.use(apiRouter.routes())
	.use(apiRouter.allowedMethods())
	.use(serveStaticFiles);

export default app;
