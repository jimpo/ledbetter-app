import request from 'supertest';

import app from '../app';


test('/api/drivers responds with an array', async () => {
    const response = await request(app.callback()).get('/api/drivers');
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([]);
});
