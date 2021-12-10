import request from 'supertest';

import app from '../app.js';
import {Layout} from 'ledbetter-common';

import {UUID_REGEX} from '../../test/util.js';
import {randomUUID} from "crypto";
import * as layoutsDb from '../layouts';

async function createTestLayout(): Promise<Layout> {
	const layout = {
		id: randomUUID(),
		name: 'Test',
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
	await layoutsDb.create(layout);
	return layout;
}

test('GET /api/layouts/:id gets layout', async () => {
	const layout = await createTestLayout();

	const response = await request(app.callback())
		.get(`/api/layouts/${layout.id}`);
	expect(response.status).toBe(200);
	expect(response.get('Content-Type')).toContain('application/json');
	expect(response.body).toEqual(layout);
});

test('GET /api/layouts/:id 404s on unknown layout ID', async () => {
	const response = await request(app.callback())
		.get(`/api/layouts/${randomUUID()}`);
	expect(response.status).toBe(404);
});

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

    const listResponse = await request(app.callback()).get('/api/layouts');
    expect(listResponse.status).toBe(200);
    const responseLayouts = listResponse.body as Layout[];

    expect(responseLayouts).toStrictEqual([responseLayout]);
});

test('POST /api/layouts responds with 422 on invalid layout', async () => {
	const layoutProps = {
		name: "Living Room Center",
		sourceCode: "SET PIXELS_PER_METER SEVENTY SEVEN ELEVEN",
	};

	const createResponse = await request(app.callback())
		.post('/api/layouts')
		.send(layoutProps);
	expect(createResponse.status).toBe(422);
	expect(createResponse.body)
		.toMatchObject({error: expect.stringMatching(/Invalid code/)});
});

test('POST /api/layouts returns error on duplicate name', async () => {
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
