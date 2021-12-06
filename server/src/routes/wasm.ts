import Koa from 'koa';

export async function saveWasm(ctx: Koa.Context, next: Koa.Next) {
	if (ctx.request.file.mimetype !== 'application/wasm') {
		ctx.throw(415, '/wasm only accepts WebAssembly file uploads');
	}
	console.log(ctx.request.body);
	console.log(ctx.request.files);
	console.log(ctx.request.file);
	ctx.status = 200;
	await next();
}
