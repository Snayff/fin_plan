import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken } from "../utils/jwt";
import { isTokenBlacklisted } from "../utils/tokenBlacklist";
import { AuthenticationError } from "../utils/errors";
import { prisma } from "../config/database";

/**
 * Auth middleware to verify JWT token, attach user + householdId to request.
 * householdId is resolved from the user's persisted activeHouseholdId.
 */
export async function authMiddleware(request: FastifyRequest, _reply: FastifyReply) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError("No authorization token provided");
    }

    // Extract token from "Bearer <token>"
    const [bearer, token] = authHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      throw new AuthenticationError("Invalid authorization format. Use: Bearer <token>");
    }

    // Verify token
    const payload = verifyAccessToken(token) as any;

    // Backward compatibility / hardening:
    // some older tokens may use `id` or `sub` instead of `userId`
    const resolvedUserId = payload.userId || payload.id || payload.sub;
    if (!resolvedUserId || typeof resolvedUserId !== "string") {
      throw new AuthenticationError("Invalid token payload");
    }

    // Check if this token has been revoked (e.g., on logout)
    if (payload.jti && isTokenBlacklisted(payload.jti)) {
      throw new AuthenticationError("Token has been revoked");
    }

    // Resolve active household from the database
    const user = await prisma.user.findUnique({
      where: { id: resolvedUserId },
      select: { id: true, email: true, name: true, activeHouseholdId: true },
    });

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    if (!user.activeHouseholdId) {
      throw new AuthenticationError("No active household — please contact support");
    }

    // Attach normalized user info + householdId to request
    (request as any).user = {
      userId: resolvedUserId,
      email: user.email,
      name: user.name ?? "",
    };
    (request as any).householdId = user.activeHouseholdId;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError("Invalid or expired token");
  }
}

/**
 * Type augmentation for Fastify request
 */
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      name: string;
    };
    householdId?: string;
  }
}
