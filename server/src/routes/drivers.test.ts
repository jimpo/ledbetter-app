import {randomUUID} from "crypto";
import {LEDDriver} from 'ledbetter-common';
import request from 'supertest';

import app from '../app.js';
import {db} from '../db.js';
import {UUID_REGEX} from '../../test/util.js';
import {DriverClient, getConnectedDrivers} from "../driverManager";
import mockito from "ts-mockito";
import path from "path";


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

test('POST /api/drivers/:id/run-prog responds with 422 if program not found', async () => {
	const mockedDriverClient: DriverClient = mockito.mock(DriverClient);
	const mockDriverClient = mockito.instance(mockedDriverClient);

	const connectedDrivers = getConnectedDrivers() as Map<string, DriverClient>;
	const driverId = randomUUID();
	connectedDrivers.set(driverId, mockDriverClient);

	const programId = randomUUID();

	const response = await request(app.callback())
		.post(`/api/drivers/${driverId}/run-prog`)
		.send({programId});
	expect(response.status).toBe(422);
	expect(response.body).toStrictEqual({error: `No program found with id ${programId}`});
});

test('POST /api/drivers/:id/run-wasm responds with 400 if Wasm file not attached', async () => {
	const mockedDriverClient: DriverClient = mockito.mock(DriverClient);
	const mockDriverClient = mockito.instance(mockedDriverClient);

	const connectedDrivers = getConnectedDrivers() as Map<string, DriverClient>;
	const driverId = randomUUID();
	connectedDrivers.set(driverId, mockDriverClient);

	const response = await request(app.callback())
		.post(`/api/drivers/${driverId}/run-wasm`)
		.field('body', JSON.stringify(null));
	expect(response.status).toBe(400);
	expect(response.body).toStrictEqual({error: "Request must have a Wasm file attached"});
});

test('POST /api/drivers/:id/run-wasm responds with 200 and driver status', async () => {
	const mockedDriverClient: DriverClient = mockito.mock(DriverClient);
	const mockDriverClient = mockito.instance(mockedDriverClient);

	const connectedDrivers = getConnectedDrivers() as Map<string, DriverClient>;
	const driverId = randomUUID();
	connectedDrivers.set(driverId, mockDriverClient);

	mockito.when(mockedDriverClient.run(mockito.anything())).thenResolve('Playing');

	const response = await request(app.callback())
		.post(`/api/drivers/${driverId}/run-wasm`)
		.field('body', JSON.stringify(null))
		.attach('wasm', path.join('..', 'test-programs', 'turnRed.wasm'));
	expect(response.status).toBe(200);
	expect(response.body).toStrictEqual({status: 'Playing'});

	mockito.verify(mockedDriverClient.run(mockito.anything())).called();
});
