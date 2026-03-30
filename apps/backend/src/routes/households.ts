import { FastifyInstance } from "fastify";
import { householdService, updateMemberRole } from "../services/household.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { prisma } from "../config/database.js";
import {
  createHouseholdSchema,
  createHouseholdInviteSchema,
  renameHouseholdSchema,
  updateMemberRoleSchema,
} from "@finplan/shared";
import { AuthorizationError, NotFoundError } from "../utils/errors.js";

export async function householdRoutes(fastify: FastifyInstance) {
  // List all households the current user belongs to
  fastify.get("/households", { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const memberships = await householdService.getUserHouseholds(userId);
    return reply.send({ households: memberships });
  });

  // Create a new household
  fastify.post("/households", { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { name } = createHouseholdSchema.parse(request.body);
    const household = await householdService.createHousehold(userId, name);
    return reply.status(201).send({ household });
  });

  // Switch active household
  fastify.post(
    "/households/:id/switch",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      await householdService.switchHousehold(userId, id);
      return reply.send({ success: true });
    }
  );

  // Get household details (members + pending invites)
  fastify.get("/households/:id", { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const household = await householdService.getHouseholdDetails(id, userId);
    return reply.send({ household });
  });

  // Rename household (owner only)
  fastify.patch("/households/:id", { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const { name } = renameHouseholdSchema.parse(request.body);
    const household = await householdService.renameHousehold(id, userId, name);
    return reply.send({ household });
  });

  // Invite a member (owner only) — rate limited: 5 invites per hour per household
  fastify.post(
    "/households/:id/invite",
    {
      preHandler: [authMiddleware],
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 hour",
          keyGenerator: (req) => {
            const { id } = req.params as { id: string };
            return `invite_${id}`;
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const { email, role } = createHouseholdInviteSchema.parse(request.body ?? {});
      const { token, email: invitedEmail } = await householdService.inviteMember(
        id,
        userId,
        email,
        role
      );
      return reply.status(201).send({ token, invitedEmail });
    }
  );

  // Remove a member (owner only)
  fastify.delete(
    "/households/:id/members/:memberId",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id, memberId } = request.params as { id: string; memberId: string };
      await householdService.removeMember(id, userId, memberId);
      return reply.send({ success: true });
    }
  );

  // Cancel a pending invite (owner only)
  fastify.delete(
    "/households/:id/invites/:inviteId",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id, inviteId } = request.params as { id: string; inviteId: string };
      await householdService.cancelInvite(id, userId, inviteId);
      return reply.send({ success: true });
    }
  );

  // Leave household (self-removal)
  fastify.delete(
    "/households/:id/leave",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      await householdService.leaveHousehold(id, userId);
      return reply.send({ success: true });
    }
  );

  // Update a member's role (owner/admin only)
  fastify.patch(
    "/households/:householdId/members/:userId/role",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const callerId = request.user!.userId;
      const { householdId, userId: targetUserId } = request.params as {
        householdId: string;
        userId: string;
      };

      // Security: caller must belong to the active household matching the route param
      if (householdId !== request.householdId) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const { role: newRole } = updateMemberRoleSchema.parse(request.body);

      try {
        const updated = await updateMemberRole(prisma, {
          householdId,
          callerId,
          targetUserId,
          newRole,
        });
        return reply.send({ member: updated });
      } catch (err) {
        if (err instanceof AuthorizationError) {
          return reply.status(403).send({ error: err.message });
        }
        if (err instanceof NotFoundError) {
          return reply.status(404).send({ error: err.message });
        }
        throw err;
      }
    }
  );
}
