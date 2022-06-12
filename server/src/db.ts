import knex, {Knex} from 'knex';
import {SqliteError} from "better-sqlite3";

let sqliteFilename = undefined;
if (process.env.NODE_ENV === 'test') {
	sqliteFilename = ':memory:';
} else if (typeof process.env.SQLITE_DB_PATH !== 'undefined') {
	sqliteFilename = process.env.SQLITE_DB_PATH;
}

if (!sqliteFilename) {
	throw Error("Environment variable SQLITE_DB_PATH is not set");
}

const db = knex({
	client: 'better-sqlite3',
	connection: {
		filename: sqliteFilename,
	},
});
let exportDB = db;

async function beginGlobalTransaction(config?: Knex.TransactionConfig): Promise<Knex.Transaction> {
	if (exportDB.isTransaction) {
		throw Error("already started a global transaction");
	}
	const tx = await db.transaction(config);
	exportDB = tx;
	return tx;
}

export async function commitGlobalTransaction(value?: any): Promise<void> {
	if (!exportDB.isTransaction) {
		throw Error("have not begun a global transaction");
	}
	const tx = exportDB as Knex.Transaction;
	await tx.commit(value);
	exportDB = db;
}

export async function rollbackGlobalTransaction(error?: any): Promise<void> {
	if (!exportDB.isTransaction) {
		throw Error("have not begun a global transaction");
	}
	const tx = exportDB as Knex.Transaction;
	await tx.rollback(error);
	exportDB = db;
}

function isMySQL2UniquenessError(table: string, column: string, err: any): boolean {
	if (err instanceof Object &&
		err.hasOwnProperty('code') &&
		err.hasOwnProperty('sqlMessage')) {
		const {code, sqlMessage} = err as { code: string, sqlMessage: string };
		const errorPattern = new RegExp(`${table}\.${table}_${column}_unique`);
		return code == 'ER_DUP_ENTRY' && !!sqlMessage.match(errorPattern);
	}
	return false;
}

function isBetterSqlite3UniqunessError(table: string, column: string, err: any): boolean {
	if (err instanceof SqliteError) {
		const errorPattern = new RegExp(`UNIQUE constraint failed: ${table}\.${column}`);
		return err.code === 'SQLITE_CONSTRAINT_UNIQUE' && !!err.message.match(errorPattern);
	}
	return false;
}

export {
	exportDB as db,
	beginGlobalTransaction,
	isBetterSqlite3UniqunessError as isUniquenessError,
};
