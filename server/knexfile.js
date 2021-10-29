const DEFAULT_MYSQL_PORT = 3306;

const mySqlEnvConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? Number.parseInt(process.env.MYSQL_PORT) : DEFAULT_MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
};

export const development = mySqlEnvConfig;
export const test = mySqlEnvConfig;
