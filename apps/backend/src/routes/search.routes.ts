import type { FastifyInstance } from "fastify";
import { SearchQuerySchema } from "@finplan/shared";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { searchService } from "../services/search.service.js";
import { AppError } from "../utils/errors.js";

export async function searchRoutes(fastify: FastifyInstance) {
  const pre = { preHandler: [authMiddleware] };

  fastify.get("/", pre, async (req, reply) => {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? "Invalid query", 400);
    }
    const result = await searchService.search(req.householdId!, parsed.data.q);
    return reply.send(result);
  });
}
