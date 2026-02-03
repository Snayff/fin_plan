import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const result = await authService.register(body);
    
    return reply.status(201).send(result);
  });

  /**
   * POST /api/auth/login
   * Login user
   */
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const result = await authService.login(body);
    
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
   * POST /api/auth/logout
   * Logout user (optional for JWT - mainly for cleanup)
   */
  fastify.post('/logout', { preHandler: authMiddleware }, async (request, reply) => {
    // With JWT, logout is typically handled client-side by removing the token
    // This endpoint is here for completeness and future enhancements (e.g., token blacklisting)
    return reply.status(200).send({ message: 'Logged out successfully' });
  });
}
