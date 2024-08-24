import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("meals", (table) => {
    table.uuid("id").primary();
    table.uuid("session_id").index();
    table.text("description").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    table.boolean("in_diet").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("meals");
}
