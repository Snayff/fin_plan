import type { FastifyRequest } from "fastify";
import type { ActorCtx } from "../services/audit.service";
import { AuthenticationError } from "../utils/errors";

export function actorCtx(req: FastifyRequest): ActorCtx {
  if (!req.user || !req.householdId) {
    throw new AuthenticationError("Missing auth context — ensure authMiddleware runs first");
  }

  return {
    householdId: req.householdId,
    actorId: req.user.userId,
    actorName: req.user.name,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  };
}
