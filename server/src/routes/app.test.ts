import request from 'supertest';

import app from '../app.js';
import path from "path";


test('/api routes accept JSON', async () => {
	const response = await request(app.callback())
		.post('/api/echo-json')
		.send({hello: 'world'});
	expect(response.status).toBe(200);
	expect(response.body).toStrictEqual({hello: 'world'});
});

test('/api routes must be JSON', async () => {
	const response = await request(app.callback())
		.post('/api/echo-json')
		.send('not json');
	expect(response.status).toBe(415);
});

test('/api multipart routes accept requests with JSON body field', async () => {
	const response = await request(app.callback())
		.post('/api/echo-multipart')
		.field('body', JSON.stringify({hello: 'world'}))
		.attach('wasm', path.join('..', 'test-programs', 'turnRed.wasm'));
	expect(response.status).toBe(200);
	expect(response.body).toStrictEqual({hello: 'world'});
});

test('/api multipart routes must have JSON body field', async () => {
	const response = await request(app.callback())
		.post('/api/echo-multipart')
		.field('body', 'not json')
		.attach('wasm', path.join('..', 'test-programs', 'turnRed.wasm'));
	expect(response.status).toBe(400);
});
