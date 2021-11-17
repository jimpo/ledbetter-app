import {WebSocketServer} from 'ws';

import app from './app.js';
import {handleConnection} from './driverManager.js';

const port = process.env.PORT || 3000;
const httpServer = app.listen(port);
const wsServer = new WebSocketServer({server: httpServer});
wsServer.on('connection', handleConnection);
console.log(`Listening on port ${port}`);
