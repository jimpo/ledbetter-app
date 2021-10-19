import { Knex } from "knex";



export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ledDrivers', table => {
    table.uuid('id').primary();
    table.string('name').unique().notNullable();
    table.string('ipAddress').notNullable();
  });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('ledDrivers');
}
