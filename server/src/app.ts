import Koa, {ExtendableContext} from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import send from 'koa-send';
import {isHttpError} from 'http-errors';

import {listLEDDrivers, createLEDDriver} from './routes/drivers.js';
import {listLayouts, createLayout} from './routes/layouts.js';
import {listPrograms, compileProgram, createProgram} from './routes/programs.js';

async function checkJsonContentType(ctx: ExtendableContext, next: Koa.Next) {
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

const apiRouter = new Router({prefix: '/api'})
	.use(checkJsonContentType)
	.use(bodyParser())
	.get('/drivers', listLEDDrivers)
	.post('/drivers', createLEDDriver)
	.get('/layouts', listLayouts)
	.post('/layouts', createLayout)
	.get('/programs', listPrograms)
	.post('/programs', createProgram)
	.post('/programs/compile', compileProgram);

const app = new Koa()
    .use(apiRouter.routes())
    .use(apiRouter.allowedMethods())
	.use(serveStaticFiles);

export default app;
