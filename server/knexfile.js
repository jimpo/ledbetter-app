let test = undefined;
let development = undefined;
let production = undefined;

const sqliteMemoryConfig = {
  client: 'better-sqlite3',
  connection: {
		filename: ':memory:',
  },
};

test = sqliteMemoryConfig;

if (typeof process.env.SQLITE_DB_PATH !== 'undefined') {
	const sqliteEnvConfig = {
		client: 'better-sqlite3',
		connection: {
			filename: process.env.SQLITE_DB_PATH,
		},
	};

	development = sqliteEnvConfig;
	production = sqliteEnvConfig;
}

export {test, development, production};
