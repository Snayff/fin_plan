import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

/**
 * Extract user-friendly message from Prisma validation error
 */
function parsePrismaValidationError(message: string): string {
  // Extract field name from "Argument `fieldName` is missing" or similar
  const missingFieldMatch = message.match(/Argument `(\w+)` is missing/);
  if (missingFieldMatch) {
    const fieldName = missingFieldMatch[1];
    return `Required field '${fieldName}' is missing. Please check your input and try again.`;
  }

  // Extract invalid value message
  const invalidValueMatch = message.match(/Argument `(\w+)`.*?invalid/i);
  if (invalidValueMatch) {
    const fieldName = invalidValueMatch[1];
    return `Invalid value provided for '${fieldName}'. Please check your input and try again.`;
  }

  // Generic Prisma error
  return 'Invalid data provided. Please check your input and try again.';
}

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

  // Handle Prisma validation errors (e.g., missing required fields)
  // Only catch if it's specifically a Prisma invocation error with argument issues
  if (error.message && error.message.includes('Invalid `') && 
      (error.message.includes('invocation') || error.message.includes('Argument'))) {
    const userMessage = parsePrismaValidationError(error.message);
    return reply.status(400).send({
      error: {
        message: userMessage,
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: process.env.NODE_ENV === 'development' ? { originalError: error.message } : undefined,
      },
    });
  }

  // Handle Prisma known request errors (unique constraint, foreign key, etc.)
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    let message = 'Database operation failed';
    
    // P2002: Unique constraint violation
    if (prismaError.code === 'P2002') {
      const fields = prismaError.meta?.target || [];
      message = `A record with this ${fields.join(', ')} already exists`;
    }
    // P2025: Record not found
    else if (prismaError.code === 'P2025') {
      message = 'The requested record was not found';
    }
    // P2003: Foreign key constraint violation
    else if (prismaError.code === 'P2003') {
      message = 'Invalid reference to related record';
    }

    return reply.status(400).send({
      error: {
        message,
        code: 'DATABASE_ERROR',
        statusCode: 400,
        details: process.env.NODE_ENV === 'development' ? { prismaCode: prismaError.code } : undefined,
      },
    });
  }

  // Handle Prisma initialization errors
  if (error.name === 'PrismaClientInitializationError') {
    return reply.status(500).send({
      error: {
        message: 'Database connection failed. Please try again later.',
        code: 'DATABASE_CONNECTION_ERROR',
        statusCode: 500,
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
