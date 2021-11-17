import {IncomingMessage} from 'http';
import {RawData, WebSocket} from 'ws';
import {Client, RequestManager, JSONRPCError} from '@open-rpc/client-js';
import { Transport } from '@open-rpc/client-js/build/transports/Transport.js';
import { JSONRPCRequestData, getNotifications, getBatchRequests } from '@open-rpc/client-js/build/Request.js';
import { ERR_UNKNOWN } from '@open-rpc/client-js/build/Error.js';
import Joi from "joi";
import {randomUUID} from "crypto";


const connectedDrivers: Map<String, DriverClient> = new Map<String, DriverClient>();

// This is mostly copied from the implementation of WebSocketTransport in @open-rpc/client-js
class WebSocketConnectionTransport extends Transport {
	constructor(public connection: WebSocket) {
		super();
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

export type DriverStatus = 'NotPlaying' | 'Playing' | 'Paused';

const driverStatusSchema = Joi.string()
	.valid(['NotPlaying', 'Playing', 'Paused']);

async function authenticateDriver(ws: WebSocket): Promise<DriverClient> {
	const transport = new WebSocketConnectionTransport(ws);
	const client = new Client(new RequestManager([transport]));

	const challenge = '';
	const response = await client.request({method: "reverse_auth", params: {challenge}});
	let {name} = Joi.attempt(response, reverseAuthResponseSchema);
	let id = randomUUID();
	return new DriverClient(client, id, name);
}

export class DriverClient {
	constructor(private client: Client, public id: string, public name: string) {
	}

	async play(): Promise<DriverStatus> {
		const response = await this.client.request({method: "play"});
		return Joi.attempt(response, driverStatusSchema);
	}

	async pause(): Promise<DriverStatus> {
		const response = await this.client.request({method: "pause"});
		return Joi.attempt(response, driverStatusSchema);
	}
}

export function getConnectedDrivers(): ReadonlyMap<String, DriverClient> {
	return connectedDrivers;
}