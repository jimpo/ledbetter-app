import knex, {Knex} from 'knex';

const DEFAULT_MYSQL_PORT = 3306;

const db = knex({
	client: 'mysql2',
	connection: {
		host: process.env.MYSQL_HOST,
		port: process.env.MYSQL_PORT ? Number.parseInt(process.env.MYSQL_PORT) : DEFAULT_MYSQL_PORT,
		user: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASSWORD,
		database: process.env.MYSQL_DATABASE,
	},
	pool: { min: 2, max: 10 },
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

export { exportDB as db, beginGlobalTransaction };
