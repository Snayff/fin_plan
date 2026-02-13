import { prisma } from '../config/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, hashToken, generateTokenFamily, verifyRefreshToken } from '../utils/jwt';
import { AuthenticationError, ConflictError, ValidationError } from '../utils/errors';
import type { User } from '@prisma/client';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, name } = input;

    // Validate input
    if (!email || !password || !name) {
      throw new ValidationError('Email, password, and name are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password strength (minimum 12 characters)
    if (password.length < 12) {
      throw new ValidationError('Password must be at least 12 characters long');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with default preferences
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        preferences: {
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          theme: 'light',
          defaultInflationRate: 2.5,
        },
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Store refresh token with family tracking
    const familyId = generateTokenFamily();
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  },

  /**
   * Login user
   */
  async login(input: LoginInput & { ipAddress?: string; userAgent?: string }): Promise<AuthResponse> {
    const { email, password, ipAddress, userAgent } = input;

    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Store refresh token with family tracking
    const familyId = generateTokenFamily();
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress,
        userAgent,
      },
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  },

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  /**
   * Refresh access token using refresh token (with rotation)
   * Returns a new access token AND a new refresh token.
   * The old refresh token is revoked. If a revoked token is reused,
   * the entire token family is revoked (replay attack detection).
   */
  async refreshAccessToken(
    refreshToken: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required');
    }

    try {
      // Verify JWT signature and expiry
      const payload = verifyRefreshToken(refreshToken);
      const tokenHash = hashToken(refreshToken);

      // Look up the token in the database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!storedToken) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Reuse detection: if this token was already revoked, an attacker
      // is replaying it. Revoke the entire family to protect the user.
      if (storedToken.isRevoked) {
        await prisma.refreshToken.updateMany({
          where: { familyId: storedToken.familyId },
          data: { isRevoked: true },
        });
        throw new AuthenticationError('Refresh token reuse detected — all sessions in this family have been revoked');
      }

      // Check expiry (belt-and-suspenders with JWT expiry)
      if (storedToken.expiresAt < new Date()) {
        throw new AuthenticationError('Refresh token expired');
      }

      // Revoke the current token (it's been used)
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Generate new token pair
      const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });
      const newRefreshToken = generateRefreshToken({ userId: user.id });

      // Store new refresh token in the same family
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(newRefreshToken),
          familyId: storedToken.familyId, // Same family for reuse detection
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
        },
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  },

  /**
   * Revoke all refresh tokens for a user (logout everywhere)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  },

  /**
   * Revoke a specific token family (single session logout)
   */
  async revokeTokenFamily(familyId: string, userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { familyId, userId },
      data: { isRevoked: true },
    });
  },

  /**
   * Get active sessions for a user (grouped by token family)
   */
  async getUserSessions(userId: string) {
    // Get the latest non-revoked token per family to represent each session
    const tokens = await prisma.refreshToken.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        familyId: true,
        ipAddress: true,
        userAgent: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    // Deduplicate by familyId (keep the most recent per family)
    const seen = new Set<string>();
    return tokens.filter((t: typeof tokens[number]) => {
      if (seen.has(t.familyId)) return false;
      seen.add(t.familyId);
      return true;
    });
  },

  /**
   * Revoke a single session by its family ID (with ownership check)
   */
  async revokeSession(sessionFamilyId: string, userId: string): Promise<boolean> {
    const result = await prisma.refreshToken.updateMany({
      where: { familyId: sessionFamilyId, userId },
      data: { isRevoked: true },
    });
    return result.count > 0;
  },

  /**
   * Clean up expired refresh tokens (housekeeping)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  },
};
