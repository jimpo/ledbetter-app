import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('programs', table => {
		table.dropColumn('ascVersion');
		table.dropColumn('sourceCode');
		table.specificType('wasm', 'longblob').notNullable().alter();
		table.text('wasmSourceMap', 'longtext').nullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('programs', table => {
		table.string('ascVersion');
		table.json('sourceCode');
		table.binary('wasm').notNullable().alter();
		table.text('wasmSourceMap', 'mediumtext').notNullable().alter();
	});
}

