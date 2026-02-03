import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

/**
 * Global error handler
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Log error for debugging
  request.log.error(error);

  // Handle AppError instances
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
    });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors,
      },
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: {
        message: error.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.validation,
      },
    });
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    return reply.status(400).send({
      error: {
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
        statusCode: 400,
      },
    });
  }

  // Default internal server error
  return reply.status(500).send({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
  });
}
