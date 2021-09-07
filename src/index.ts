import Koa from 'koa';
import Router from '@koa/router';

function main() {
    const app = new Koa();
    const router = new Router();

    router.get('/', async (ctx, next: Koa.Next) => {
        ctx.body = { message: 'Hello world!' };
        await next();
    });

    app
        .use(router.routes())
        .use(router.allowedMethods());

    app.listen(3000);
}

main()
