import { FastifyInstance } from 'fastify';
import { householdService } from '../services/household.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { acceptInviteSchema } from '@finplan/shared';

export async function inviteRoutes(fastify: FastifyInstance) {
  // Validate an invite token — returns household name and invited email
  // No auth required (used to show invite landing page before signup)
  fastify.get(
    '/invite/:token',
    async (request, reply) => {
      const { token } = request.params as { token: string };
      const invite = await householdService.validateInviteToken(token);
      return reply.send({
        householdId: invite.householdId,
        householdName: invite.household.name,
        email: invite.email,
      });
    }
  );

  // New user accepts invite — creates account and joins household
  // No auth required
  fastify.post(
    '/invite/:token/accept',
    async (request, reply) => {
      const { token } = request.params as { token: string };
      const body = acceptInviteSchema.parse(request.body);
      const result = await householdService.acceptInvite(token, body);

      // Set refresh token cookie (mirrors auth routes pattern)
      reply.setCookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return reply.status(201).send({
        user: result.user,
        accessToken: result.accessToken,
      });
    }
  );

  // Existing logged-in user joins household via invite
  // Requires auth
  fastify.post(
    '/invite/:token/join',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { token } = request.params as { token: string };
      const userId = request.user!.userId;
      const household = await householdService.joinViaInvite(token, userId);
      return reply.send({ household });
    }
  );
}
