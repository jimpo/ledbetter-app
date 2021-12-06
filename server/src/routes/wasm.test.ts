import request from 'supertest';
import app from '../app';
import path from 'path';

test('POST /api/wasm uploads Wasm blob', async () => {
	console.log(process.cwd());
	const response = await request(app.callback())
		.post('/wasm')
		.field('json', JSON.stringify({hello: 'world'}))
		.attach('main', path.join('..', 'test-programs', 'turnRed.wasm'));
	expect(response.status).toBe(200);
})