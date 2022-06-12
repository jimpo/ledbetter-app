import {db, beginGlobalTransaction, rollbackGlobalTransaction} from '../src/db';

beforeAll(async () => await db.migrate.latest());
beforeEach(async () => await beginGlobalTransaction());
afterEach(async () => await rollbackGlobalTransaction());
afterAll(async () => await db.destroy());
