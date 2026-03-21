import { FastifyInstance } from 'fastify';
import { assetService } from '../services/asset.service';
import { cacheService } from '../services/cache.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createAssetSchema,
  updateAssetSchema,
  updateAssetValueSchema,
} from '@finplan/shared';

export async function assetRoutes(fastify: FastifyInstance) {
  // Get all assets for current user with value history
  fastify.get('/assets', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;

    // Always return enhanced data (with value history) for consistency
    const assets = await assetService.getUserAssetsWithHistory(householdId);
    return reply.send({ assets });
  });

  // Get asset summary (analytics)
  fastify.get('/assets/summary', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const summary = await assetService.getAssetSummary(householdId);
    return reply.send(summary);
  });

  // Get single asset by ID
  fastify.get('/assets/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };

    const asset = await assetService.getAssetById(id, householdId);
    return reply.send({ asset });
  });

  // Get value history for an asset
  fastify.get('/assets/:id/history', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };
    const { daysBack } = request.query as { daysBack?: string };

    const days = daysBack ? parseInt(daysBack, 10) : 90;
    const history = await assetService.getAssetValueHistory(id, householdId, days);
    return reply.send({ history });
  });

  // Create new asset
  fastify.post('/assets', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const validatedData = createAssetSchema.parse(request.body);

    const asset = await assetService.createAsset(householdId, validatedData);
    void cacheService.invalidatePattern(`dashboard:*:${householdId}:*`);
    return reply.status(201).send({ asset });
  });

  // Update asset properties
  fastify.put('/assets/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };
    const validatedData = updateAssetSchema.parse(request.body);

    const asset = await assetService.updateAsset(id, householdId, validatedData);
    void cacheService.invalidatePattern(`dashboard:*:${householdId}:*`);
    return reply.send({ asset });
  });

  // Update asset current value (creates history entry)
  fastify.put('/assets/:id/value', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };
    const validatedData = updateAssetValueSchema.parse(request.body);

    const asset = await assetService.updateAssetValue(
      id,
      householdId,
      validatedData.newValue,
      validatedData.source,
      validatedData.date ? new Date(validatedData.date) : undefined
    );
    void cacheService.invalidatePattern(`dashboard:*:${householdId}:*`);
    return reply.send({ asset });
  });

  // Delete asset
  fastify.delete('/assets/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const householdId = request.householdId!;
    const { id } = request.params as { id: string };

    const result = await assetService.deleteAsset(id, householdId);
    void cacheService.invalidatePattern(`dashboard:*:${householdId}:*`);
    return reply.send(result);
  });
}
