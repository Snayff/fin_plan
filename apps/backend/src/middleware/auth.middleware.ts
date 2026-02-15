import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/jwt';
import { isTokenBlacklisted } from '../utils/tokenBlacklist';
import { AuthenticationError } from '../utils/errors';

/**
 * Auth middleware to verify JWT token and attach user to request
 */
export async function authMiddleware(request: FastifyRequest, _reply: FastifyReply) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('No authorization token provided');
    }

    // Extract token from "Bearer <token>"
    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new AuthenticationError('Invalid authorization format. Use: Bearer <token>');
    }

    // Verify token
    const payload = verifyAccessToken(token) as any;

    // Backward compatibility / hardening:
    // some older tokens may use `id` or `sub` instead of `userId`
    const resolvedUserId = payload.userId || payload.id || payload.sub;
    if (!resolvedUserId || typeof resolvedUserId !== 'string') {
      throw new AuthenticationError('Invalid token payload');
    }

    // Check if this token has been revoked (e.g., on logout)
    if (payload.jti && isTokenBlacklisted(payload.jti)) {
      throw new AuthenticationError('Token has been revoked');
    }

    // Attach normalized user info to request
    (request as any).user = {
      ...payload,
      userId: resolvedUserId,
      email: payload.email || '',
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Invalid or expired token');
  }
}

/**
 * Decorator to get current user from request
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
    };
  }
}
