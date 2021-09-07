import Koa, {ExtendableContext} from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';

import {listDrivers, createDriver} from './routes/drivers';

async function checkJsonContentType(ctx: ExtendableContext, next: Koa.Next) {
    /// The === false is because null indicates no request body
    if (ctx.is('application/json') === false) {
        ctx.throw(415, 'API only accepts JSON requests');
    }
    await next();
}

function main() {
    const app = new Koa();
    const router = new Router();

    router
        .prefix('/api')
        .use(checkJsonContentType)
        .use(bodyParser())
        .get('/', async (ctx, next: Koa.Next) => {
            ctx.body = { message: 'Hello world!' };
            await next();
        })
        .get('/drivers', listDrivers)
        .post('/drivers', createDriver);

    app
        .use(router.routes())
        .use(router.allowedMethods());

    app.listen(3000);
}

main()
