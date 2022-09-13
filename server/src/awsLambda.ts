import serverless from 'serverless-http';

import app from './app.js';

const BINARY_CONTENT_TYPES = ['font/*', 'image/*'];

export const handler = serverless(app, {binary: BINARY_CONTENT_TYPES});
