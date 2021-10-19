const {db, beginGlobalTransaction, rollbackGlobalTransaction} = require('../src/db');

beforeEach(async () => await beginGlobalTransaction());
afterEach(async () => await rollbackGlobalTransaction());
afterAll(async () => await db.destroy());
