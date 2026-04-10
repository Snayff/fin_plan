import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { exportService } from "../services/export.service.js";
import { importService } from "../services/import.service.js";
import { importOptionsSchema } from "@finplan/shared";

const FIVE_MB = 5 * 1024 * 1024;

export async function exportImportRoutes(fastify: FastifyInstance) {
  // Export household data (owner only — enforced inside exportService)
  fastify.get(
    "/households/:id/export",
    {
      preHandler: [authMiddleware],
      config: {
        rateLimit: { max: 10, timeWindow: "1 hour" },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const data = await exportService.exportHousehold(id, userId);
      return reply.send(data);
    }
  );

  // Import household data
  // - overwrite mode: owner-of-target check enforced inside importService
  // - create_new mode: any authenticated user can create a fresh household
  fastify.post(
    "/households/:id/import",
    {
      preHandler: [authMiddleware],
      bodyLimit: FIVE_MB,
      config: {
        rateLimit: { max: 10, timeWindow: "1 hour" },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const { mode } = importOptionsSchema.parse(request.query);
      const result = await importService.importHousehold(id, userId, request.body, mode);
      return reply.send(result);
    }
  );

  // Validate import file (no write, stateless)
  fastify.post(
    "/households/validate-import",
    {
      preHandler: [authMiddleware],
      bodyLimit: FIVE_MB,
      config: {
        rateLimit: { max: 30, timeWindow: "1 hour" },
      },
    },
    async (request, reply) => {
      const result = importService.validateImportData(request.body);
      return reply.send(result);
    }
  );
}
