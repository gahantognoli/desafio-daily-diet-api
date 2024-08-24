import { z } from "zod";
import { randomUUID } from "node:crypto";
import { checkSessionIdExiste } from "../middlewares/check-session-id-exists";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { knex } from "../database";

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    "/",
    {
      preHandler: checkSessionIdExiste,
    },
    async (request: FastifyRequest) => {
      const { sessionId } = request.cookies;
      const meals = await knex("meals").where("session_id", sessionId).select();
      return meals;
    }
  );

  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExiste],
    },
    async (request: FastifyRequest) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      });
      const { id } = getMealParamsSchema.parse(request.params);
      const { sessionId } = request.cookies;
      const meal = await knex("meals")
        .where({ id, session_id: sessionId })
        .first();
      return meal;
    }
  );

  app.get(
    "/metrics",
    {
      preHandler: [checkSessionIdExiste],
    },
    async (request: FastifyRequest) => {
      const { sessionId } = request.cookies;
      const meals = await knex("meals").where("session_id", sessionId).select();
      return {
        meals: meals.length,
        mealsInDiet: meals.filter((m) => m.in_diet).length,
        mealsOffDiet: meals.filter((m) => !m.in_diet).length,
        bestDietSequence: getBestDietSequence(meals),
      };
    }
  );

  app.post(
    "/",
    {
      preHandler: [checkSessionIdExiste],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const createMealBodySchema = z.object({
        description: z.string(),
        inDiet: z.boolean(),
      });

      const { description, inDiet } = createMealBodySchema.parse(request.body);

      let sessionId = request.cookies.sessionId;

      if (!sessionId) {
        sessionId = randomUUID();
        reply.cookie("sessionId", sessionId, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }

      await knex("meals").insert({
        id: randomUUID(),
        description,
        in_diet: inDiet,
        session_id: sessionId,
      });

      return reply.status(201).send();
    }
  );

  app.put(
    "/:id",
    {
      preHandler: [checkSessionIdExiste],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getMealParamsSchema.parse(request.params);

      const updateMealBodySchema = z.object({
        description: z.string(),
        inDiet: z.boolean(),
      });

      const { description, inDiet } = updateMealBodySchema.parse(request.body);

      let sessionId = request.cookies.sessionId;

      const meal = await knex("meals")
        .where({ id, session_id: sessionId })
        .first();

      if (!meal) return reply.status(404).send();

      await knex("meals")
        .update({
          description,
          in_diet: inDiet,
        })
        .where("id", id);

      return reply.status(204).send();
    }
  );

  app.delete(
    "/:id",
    {
      preHandler: [checkSessionIdExiste],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getMealParamsSchema.parse(request.params);

      let sessionId = request.cookies.sessionId;

      const meal = await knex("meals")
        .where({ id, session_id: sessionId })
        .first();

      if (!meal) return reply.status(404).send();

      await knex("meals").delete().where("id", id);

      return reply.status(204).send();
    }
  );

  const getBestDietSequence = (
    meals: {
      id: string;
      session_id?: string;
      description: string;
      created_at: string;
      in_diet: boolean;
    }[]
  ): {
    id: string;
    session_id?: string;
    description: string;
    created_at: string;
    in_diet: boolean;
  }[] => {
    return meals.reduce(
      (acc, meal) => {
        if (meal.in_diet) {
          acc.currentSequence.push(meal);
          if (acc.currentSequence.length > acc.maxSequence.length) {
            acc.maxSequence = [...acc.currentSequence];
          }
        } else {
          acc.currentSequence = [];
        }
        return acc;
      },
      { maxSequence: [] as typeof meals, currentSequence: [] as typeof meals }
    ).maxSequence;
  };
}
