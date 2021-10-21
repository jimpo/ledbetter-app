import request from 'supertest';

import app from '../app';
import {Layout} from '../layouts';
import {UUID_REGEX} from '../../test/util';


test('POST /api/layouts creates a new layout', async () => {
    const layoutProps = {
        name: "Living Room Center",
		sourceCode:
`SET PIXELS_PER_METER 60

STRIP AT -1m, 0m
TURN 90 degrees
SEGMENT 150 pixels

STRIP AT 1m, 0m
TURN 90 degrees
SEGMENT 150 pixels
`,
    };

    const createResponse = await request(app.callback())
        .post('/api/layouts')
        .send(layoutProps);
    expect(createResponse.status).toBe(201);
    const responseLayout = createResponse.body as Layout[];

    expect(responseLayout).toMatchObject({
        id: expect.stringMatching(UUID_REGEX),
        ...layoutProps,
    });

    // const listResponse = await request(app.callback()).get('/api/layouts');
    // expect(listResponse.status).toBe(200);
    // const responseLayouts = listResponse.body as Layout[];

    // expect(responseLayouts).toStrictEqual([responseLayout]);
});

test.only('POST /api/layouts returns error on duplicate name', async () => {
    const layoutProps = {
        name: "Living Room Center",
		sourceCode:
`SET PIXELS_PER_METER 60

STRIP AT -1m, 0m
TURN 90 degrees
SEGMENT 150 pixels

STRIP AT 1m, 0m
TURN 90 degrees
SEGMENT 150 pixels
`,
    };

    const createResponse = await request(app.callback())
        .post('/api/layouts')
        .send(layoutProps);
    expect(createResponse.status).toBe(201);

    const errorResponse = await request(app.callback())
        .post('/api/layouts')
        .send(layoutProps);
    expect(errorResponse.status).toBe(422);

    expect(errorResponse.body).toMatchObject({
        error: expect.stringMatching(/already exists/),
        field: 'name',
    });

    // const listResponse = await request(app.callback()).get('/api/layouts');
    // expect(listResponse.status).toBe(200);
    // const responseLayouts = listResponse.body as Layout[];

    // expect(responseLayouts).toStrictEqual([responseLayout]);
});
