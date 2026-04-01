import type { FastifyRequest } from "fastify";
import type { ActorCtx } from "../services/audit.service";

export function actorCtx(req: FastifyRequest): ActorCtx {
  return {
    householdId: req.householdId!,
    actorId: (req as any).user!.userId,
    actorName: (req as any).user!.name,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  };
}
