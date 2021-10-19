import Koa, {ExtendableContext} from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';

import {listLEDDrivers, createLEDDriver} from './routes/drivers';

async function checkJsonContentType(ctx: ExtendableContext, next: Koa.Next) {
    /// The === false is because null indicates no request body
    if (ctx.is('application/json') === false) {
        ctx.throw(415, 'API only accepts JSON requests');
    }
    await next();
}

const app = new Koa();
const router = new Router();

router
    .prefix('/api')
    .use(checkJsonContentType)
    .use(bodyParser())
    .get('/drivers', listLEDDrivers)
    .post('/drivers', createLEDDriver);

app
    .use(router.routes())
    .use(router.allowedMethods());

export default app;

