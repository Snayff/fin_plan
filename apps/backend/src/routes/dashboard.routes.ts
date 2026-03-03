import { FastifyInstance } from 'fastify';
import { dashboardService } from '../services/dashboard.service';
import { authMiddleware } from '../middleware/auth.middleware';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard summary
  fastify.get(
    '/dashboard/summary',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const householdId = request.householdId!;
      const { startDate, endDate } = request.query as any;

      const options: any = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const summary = await dashboardService.getDashboardSummary(householdId, options);

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
      const trend = await dashboardService.getNetWorthTrend(householdId, monthsNum);

      return reply.send({ trend });
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
      const trend = await dashboardService.getIncomeExpenseTrend(householdId, monthsNum);

      return reply.send({ trend });
    }
  );
}
