import { FastifyInstance } from 'fastify';
import { dashboardService } from '../services/dashboard.service';
import { cacheService } from '../services/cache.service';
import { authMiddleware } from '../middleware/auth.middleware';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard summary
  fastify.get(
    '/dashboard/summary',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const householdId = request.householdId!;
      const { startDate, endDate } = request.query as any;

      const now = new Date();
      const options: any = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      // Cache key includes year-month so different date range requests don't collide
      const yearMonth = options.startDate
        ? `${options.startDate.getFullYear()}-${String(options.startDate.getMonth() + 1).padStart(2, '0')}`
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const endMonth = options.endDate
        ? `${options.endDate.getFullYear()}-${String(options.endDate.getMonth() + 1).padStart(2, '0')}`
        : null;
      const cacheKey = endMonth
        ? `dashboard:summary:${householdId}:${yearMonth}:${endMonth}`
        : `dashboard:summary:${householdId}:${yearMonth}`;

      const cached = await cacheService.get(cacheKey);
      if (cached) return reply.send(cached);

      const summary = await dashboardService.getDashboardSummary(householdId, options);
      void cacheService.set(cacheKey, summary, 120); // 2 min TTL

      return reply.send(summary);
    }
  );

  // Get net worth trend
  fastify.get(
    '/dashboard/net-worth-trend',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const householdId = request.householdId!;
      const { months } = request.query as any;
      const monthsNum = months ? Number(months) : 6;

      const cacheKey = `dashboard:nwt:${householdId}:${monthsNum}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return reply.send(cached);

      const trend = await dashboardService.getNetWorthTrend(householdId, monthsNum);
      const payload = { trend };
      void cacheService.set(cacheKey, payload, 300); // 5 min TTL

      return reply.send(payload);
    }
  );

  // Get income vs expense trend
  fastify.get(
    '/dashboard/income-expense-trend',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const householdId = request.householdId!;
      const { months } = request.query as any;
      const monthsNum = months ? Number(months) : 6;

      const cacheKey = `dashboard:iet:${householdId}:${monthsNum}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return reply.send(cached);

      const trend = await dashboardService.getIncomeExpenseTrend(householdId, monthsNum);
      const payload = { trend };
      void cacheService.set(cacheKey, payload, 300); // 5 min TTL

      return reply.send(payload);
    }
  );
}
