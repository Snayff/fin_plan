import { FastifyInstance } from 'fastify';
import { categoryService } from '../services/category.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { CategoryType } from '@prisma/client';

export async function categoryRoutes(fastify: FastifyInstance) {
  // Get all categories (income and expense)
  fastify.get(
    '/categories',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const categories = await categoryService.getUserCategories(userId);
      
      return reply.send({ categories });
    }
  );

  // Get categories by type (income or expense)
  fastify.get(
    '/categories/:type',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user!.userId;
      const { type } = request.params as { type: string };

      // Validate type
      const categoryType = type.toLowerCase() as CategoryType;
      if (categoryType !== 'income' && categoryType !== 'expense') {
        return reply.status(400).send({ error: 'Invalid category type. Must be "income" or "expense"' });
      }

      const categories = await categoryService.getCategoriesByType(userId, categoryType);
      
      return reply.send({ categories });
    }
  );
}
