import { Knex } from "knex";

declare module "knex/types/tables" {
  export interface Tables {
    meals: {
      id: string;
      session_id?: string;
      description: string;
      created_at: string;
      in_diet: boolean;
    };
  }
}
