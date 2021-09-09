import { Knex } from "knex";



export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('ledDrivers', table => {
        table.uuid('id');
        table.string('name');
        table.string('ipAddress');

        table.primary(['id']);
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('ledDrivers');
}
