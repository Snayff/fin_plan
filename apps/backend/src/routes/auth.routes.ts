import type { FastifyInstance, FastifyReply, RouteShorthandOptions } from 'fastify';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { config } from '../config/env';

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
    const result = await authService.login(body);

    // Set refresh token in httpOnly cookie
    setRefreshTokenCookie(reply, result.refreshToken);

    // Return response with BOTH formats for backward compatibility
    return reply.status(200).send(result);
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

    const result = await authService.refreshAccessToken(refreshToken);

    // Refresh the cookie if it was used
    if (request.cookies.refreshToken) {
      setRefreshTokenCookie(reply, refreshToken);
    }

    return reply.status(200).send(result);
  });

  /**
   * GET /api/auth/csrf-token
   * Get CSRF token for state-changing requests
   */
  fastify.get('/csrf-token', async (request, reply) => {
    const token = await reply.generateCsrf();
    return reply.send({ csrfToken: token });
  });

  /**
   * POST /api/auth/logout
   * Logout user - clears refresh token cookie
   */
  fastify.post('/logout', { preHandler: authMiddleware }, async (request, reply) => {
    // Clear refresh token cookie
    clearRefreshTokenCookie(reply);

    return reply.status(200).send({ message: 'Logged out successfully' });
  });
}
