import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('programs', table => {
		table.uuid('id').primary();
		table.string('name').unique().notNullable();
		table.integer('apiVersion').notNullable();
		table.string('ascVersion').notNullable();
		table.json('sourceCode').notNullable();
		table.binary('wasm').notNullable();
		table.text('wasmSourceMap', 'mediumtext').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('programs');
}
