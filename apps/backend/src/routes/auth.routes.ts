import type { FastifyInstance, FastifyReply, FastifyRequest, RouteShorthandOptions } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { auditService } from '../services/audit.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { config } from '../config/env';
import { blacklistToken } from '../utils/tokenBlacklist';
import { decodeToken } from '../utils/jwt';

function requestContext(request: FastifyRequest) {
  return { ipAddress: request.ip, userAgent: request.headers['user-agent'] };
}

/** Blacklist the access token from the current request so it can't be reused after logout. */
function blacklistCurrentToken(request: FastifyRequest): void {
  const authHeader = request.headers.authorization;
  if (!authHeader) return;
  const token = authHeader.split(' ')[1];
  if (!token) return;
  const payload = decodeToken(token);
  if (payload?.jti) {
    blacklistToken(payload.jti);
  }
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

/**
 * Set refresh token as httpOnly cookie
 * Provides security by making token inaccessible to JavaScript
 */
function setRefreshTokenCookie(
  reply: FastifyReply,
  refreshToken: string
) {
  reply.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Clear refresh token cookie on logout
 */
function clearRefreshTokenCookie(reply: FastifyReply) {
  reply.clearCookie('refreshToken', {
    path: '/api/auth/refresh',
  });
}

export async function authRoutes(fastify: FastifyInstance) {
  // Rate limit configurations for auth endpoints
  const loginOpts: RouteShorthandOptions = {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes',
      },
    },
  };

  const registerOpts: RouteShorthandOptions = {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 hour',
      },
    },
  };

  const refreshOpts: RouteShorthandOptions = {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
      },
    },
  };

  /**
   * POST /api/auth/register
   * Register a new user
   * Rate limit: 10 attempts per hour per IP
   */
  fastify.post('/register', registerOpts, async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const result = await authService.register(body);

    auditService.log({
      userId: result.user.id,
      action: 'REGISTER',
      resource: 'user',
      resourceId: result.user.id,
      ...requestContext(request),
    });

    // Set refresh token in httpOnly cookie
    setRefreshTokenCookie(reply, result.refreshToken);

    // Return response with BOTH formats for backward compatibility
    return reply.status(201).send(result);
  });

  /**
   * POST /api/auth/login
   * Login user
   * Rate limit: 5 attempts per 15 minutes per IP
   */
  fastify.post('/login', loginOpts, async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const ctx = requestContext(request);

    try {
      const result = await authService.login({
        ...body,
        ...ctx,
      });

      auditService.log({
        userId: result.user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'session',
        ...ctx,
      });

      // Set refresh token in httpOnly cookie
      setRefreshTokenCookie(reply, result.refreshToken);

      // Return response with BOTH formats for backward compatibility
      return reply.status(200).send(result);
    } catch (error) {
      auditService.log({
        action: 'LOGIN_FAILED',
        resource: 'session',
        metadata: { email: body.email },
        ...ctx,
      });
      throw error;
    }
  });

  /**
   * GET /api/auth/me
   * Get current user (protected route)
   */
  fastify.get('/me', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const user = await authService.findUserById(userId);

    if (!user) {
      return reply.status(404).send({
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
      });
    }

    return reply.status(200).send({ user });
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   * Rate limit: 10 attempts per 15 minutes per IP
   * Supports BOTH cookie and request body for backward compatibility
   */
  fastify.post('/refresh', refreshOpts, async (request, reply) => {
    const body = refreshSchema.parse(request.body);

    // Try cookie first, then body (backward compatibility)
    const refreshToken = request.cookies.refreshToken || body.refreshToken;

    if (!refreshToken) {
      return reply.status(400).send({
        error: {
          message: 'Refresh token required',
          code: 'MISSING_REFRESH_TOKEN',
          statusCode: 400,
        },
      });
    }

    const ctx = requestContext(request);
    const result = await authService.refreshAccessToken(refreshToken, ctx);

    auditService.log({
      action: 'TOKEN_REFRESH',
      resource: 'session',
      ...ctx,
    });

    // Always set the rotated refresh token as a new cookie
    setRefreshTokenCookie(reply, result.refreshToken);

    // Only return the access token to the client
    return reply.status(200).send({ accessToken: result.accessToken });
  });

  /**
   * GET /api/auth/csrf-token
   * Get CSRF token for state-changing requests
   */
  fastify.get('/csrf-token', async (_request, reply) => {
    const token = await reply.generateCsrf();
    return reply.send({ csrfToken: token });
  });

  /**
   * POST /api/auth/logout
   * Logout user - clears refresh token cookie
   */
  fastify.post('/logout', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    // Blacklist the current access token so it can't be reused
    blacklistCurrentToken(request);

    // Revoke all refresh tokens for this user
    await authService.revokeAllUserTokens(userId);

    auditService.log({
      userId,
      action: 'LOGOUT',
      resource: 'session',
      ...requestContext(request),
    });

    // Clear refresh token cookie
    clearRefreshTokenCookie(reply);

    return reply.status(200).send({ message: 'Logged out successfully' });
  });

  /**
   * GET /api/auth/sessions
   * List active sessions for the current user
   */
  fastify.get('/sessions', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const sessions = await authService.getUserSessions(userId);
    return reply.send({ sessions });
  });

  /**
   * DELETE /api/auth/sessions/:familyId
   * Revoke a specific session
   */
  fastify.delete('/sessions/:familyId', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { familyId } = request.params as { familyId: string };

    const revoked = await authService.revokeSession(familyId, userId);
    if (!revoked) {
      return reply.status(404).send({
        error: { message: 'Session not found', code: 'NOT_FOUND', statusCode: 404 },
      });
    }

    auditService.log({
      userId,
      action: 'SESSION_REVOKED',
      resource: 'session',
      resourceId: familyId,
      ...requestContext(request),
    });

    return reply.send({ message: 'Session revoked' });
  });

  /**
   * DELETE /api/auth/sessions
   * Revoke all sessions (logout everywhere)
   */
  fastify.delete('/sessions', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    await authService.revokeAllUserTokens(userId);

    auditService.log({
      userId,
      action: 'ALL_SESSIONS_REVOKED',
      resource: 'session',
      ...requestContext(request),
    });

    clearRefreshTokenCookie(reply);
    return reply.send({ message: 'All sessions revoked' });
  });
}
