import request from 'supertest';

import app from '../app';


test('/api routes must be JSON', async () => {
    const response = await request(app.callback()).post('/api/drivers');
    expect(response.status).toBe(415);
});
