import {randomUUID} from "crypto";
import request from 'supertest';

import app from '../app';
import {LEDDriver} from '../drivers';
import {db} from '../db';
import {UUID_REGEX} from '../../test/util';


test('GET /api/drivers responds with an array', async () => {
    const ledDrivers = [
        {
            id: randomUUID(),
            name: "Living Room",
            ipAddress: "192.168.1.2",
        },
        {
            id: randomUUID(),
            name: "Other Room",
            ipAddress: "192.168.1.3",
        },
    ];
    await db('ledDrivers').insert(ledDrivers);

    const response = await request(app.callback()).get('/api/drivers');
    expect(response.status).toBe(200);
    const responseLedDrivers = response.body as LEDDriver[];

    ledDrivers.sort((a, b) => a.id.localeCompare(b.id));
    responseLedDrivers.sort((a, b) => a.id.localeCompare(b.id));
    expect(responseLedDrivers).toStrictEqual(ledDrivers);
});

test('POST /api/drivers creates a new LED driver', async () => {
    const ledDriverProps = {
        name: "Living Room",
        ipAddress: "192.168.1.2",
    };

    const createResponse = await request(app.callback())
        .post('/api/drivers')
        .send(ledDriverProps);
    expect(createResponse.status).toBe(201);
    const responseLedDriver = createResponse.body as LEDDriver;

    expect(responseLedDriver).toMatchObject({
        id: expect.stringMatching(UUID_REGEX),
        ...ledDriverProps,
    });

    const listResponse = await request(app.callback()).get('/api/drivers');
    expect(listResponse.status).toBe(200);
    const responseLedDrivers = listResponse.body as LEDDriver[];

    expect(responseLedDrivers).toStrictEqual([responseLedDriver]);
});
