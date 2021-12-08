import type {DriverStatus} from 'ledbetter-common';
import {IncomingMessage} from 'http';
import {RawData, WebSocket} from 'ws';
import {Client, RequestManager, JSONRPCError} from '@open-rpc/client-js';
import { Transport } from '@open-rpc/client-js/build/transports/Transport.js';
import { JSONRPCRequestData, getNotifications, getBatchRequests } from '@open-rpc/client-js/build/Request.js';
import { ERR_UNKNOWN } from '@open-rpc/client-js/build/Error.js';
import Joi from "joi";
import {randomUUID} from "crypto";


const connectedDrivers: Map<String, DriverClient> = new Map<String, DriverClient>();

const PING_INTERVAL = 5000;

// This is mostly copied from the implementation of WebSocketTransport in @open-rpc/client-js
class WebSocketConnectionTransport extends Transport {
	private awaitingPong: boolean;
	private pingInterval: NodeJS.Timer;

	constructor(public connection: WebSocket) {
		super();
		this.awaitingPong = false;
		this.pingInterval = setInterval(() => this._ping(), PING_INTERVAL);
	}

	public async connect(): Promise<any> {
		this.connection.on('message', (rawData: RawData, isBinary: boolean) => {
			if (isBinary) {
				console.error('Received binary message payload');
				this.close();
				return;
			}

			const data = Array.isArray(rawData) ? rawData.join() : rawData.toString();
			this.transportRequestManager.resolveResponse(data);
		});

		const self = this;
		this.connection.on('pong', (_data) => self.awaitingPong = false);
	}

	public async sendData(data: JSONRPCRequestData, timeout: number | null = 5000): Promise<any> {
		let prom = this.transportRequestManager.addRequest(data, timeout);
		const notifications = getNotifications(data);
		this.connection.send(JSON.stringify(this.parseData(data)), (err?: Error) => {
			if (err) {
				const jsonError = new JSONRPCError(err.message, ERR_UNKNOWN, err);
				this.transportRequestManager.settlePendingRequest(notifications, jsonError);
				this.transportRequestManager.settlePendingRequest(getBatchRequests(data), jsonError);
				prom = Promise.reject(jsonError);
			}
			this.transportRequestManager.settlePendingRequest(notifications);
		});
		return prom;
	}

	public close(): void {
		this.connection.close();
		clearInterval(this.pingInterval);
	}

	_ping(): void {
		if (this.awaitingPong) {
			this.connection.terminate();
			clearInterval(this.pingInterval);
			return;
		}

		this.awaitingPong = true;
		this.connection.ping();
	}
}

export async function handleConnection(ws: WebSocket, _req: IncomingMessage) {
	const client = await authenticateDriver(ws);
	console.log(`New connection from ${client.name}`);

	connectedDrivers.set(client.id, client);
	ws.on('close', (_code, _reason) => {
		console.log(`Disconnected ${client.name}`);
		connectedDrivers.delete(client.id);
	});
}

const reverseAuthResponseSchema = Joi.object({
	name: Joi.string()
		.required(),
});

const driverStatusSchema = Joi.string()
	.valid('NotPlaying', 'Playing', 'Paused');

async function authenticateDriver(ws: WebSocket): Promise<DriverClient> {
	const transport = new WebSocketConnectionTransport(ws);
	const client = new Client(new RequestManager([transport]));

	const challenge = '';
	const reverseAuthResp = await client.request({method: "reverse_auth", params: {challenge}});
	const {name} = Joi.attempt(reverseAuthResp, reverseAuthResponseSchema);
	const id = randomUUID();
	const driverClient = new DriverClient(client, id, name);
	await driverClient.updateStatus();
	return driverClient;
}

export class DriverClient {
	public status: DriverStatus;

	constructor(private client: Client, public id: string, public name: string) {
		this.status = 'NotPlaying';
	}

	async updateStatus(): Promise<DriverStatus> {
		const response = await this.client.request({method: "get_status"});
		return this.handleStatusResponse(response);
	}

	async run(wasm: Buffer): Promise<DriverStatus> {
		const params = {wasm: wasm.toString('base64')};
		const response = await this.client.request({method: "run", params});
		return this.handleStatusResponse(response);
	}

	async play(): Promise<DriverStatus> {
		const response = await this.client.request({method: "play"});
		return this.handleStatusResponse(response);
	}

	async pause(): Promise<DriverStatus> {
		const response = await this.client.request({method: "pause"});
		return this.handleStatusResponse(response);
	}

	async stop(): Promise<DriverStatus> {
		const response = await this.client.request({method: "stop"});
		return this.handleStatusResponse(response);
	}

	handleStatusResponse(response: any): DriverStatus {
		this.status = Joi.attempt(response, driverStatusSchema);
		return this.status;
	}
}

export function getConnectedDrivers(): ReadonlyMap<String, DriverClient> {
	return connectedDrivers;
}