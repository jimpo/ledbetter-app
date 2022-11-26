import util from 'util';

import {WebSocketServer} from 'ws';

import app from './app.js';
import {db} from './db.js';
import {handleConnection} from './driverManager.js';

const port = process.env.PORT || 3000;
const httpServer = app.listen(port);
const wsServer = new WebSocketServer({server: httpServer});
wsServer.on('connection', handleConnection);
console.log(`Listening on port ${port}`);

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function shutdown(signal: string) {
	console.log(`Received ${signal}, shutting down`);
	await util.promisify(httpServer.close.bind(httpServer))();
	await db.destroy();
}
