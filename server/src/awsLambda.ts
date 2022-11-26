import serverless from 'serverless-http';

import app from './app.js';
import {db} from './db.js';

const BINARY_CONTENT_TYPES = ['font/*', 'image/*', 'application/wasm', 'application/octet-stream'];
const MIGRATIONS_DIRECTORY = './dist/migrations';

export const handler = serverless(app, {binary: BINARY_CONTENT_TYPES});

export async function migrate(): Promise<void> {
	const config = {directory: MIGRATIONS_DIRECTORY};
	await db.migrate.latest(config);
	const migrationVersion = await db.migrate.currentVersion(config);
	console.log(`Migrations complete, current version: ${migrationVersion}`);
}
