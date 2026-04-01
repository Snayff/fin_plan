import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { forecastService } from "../services/forecast.service.js";
import { ForecastQuerySchema } from "@finplan/shared";
import { AppError } from "../utils/errors.js";

export async function forecastRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  fastify.get("/", pre, async (req, reply) => {
    const parsed = ForecastQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? "Invalid query", 400);
    }
    const projection = await forecastService.getProjections(
      req.householdId!,
      parsed.data.horizonYears
    );
    return reply.send(projection);
  });
}
