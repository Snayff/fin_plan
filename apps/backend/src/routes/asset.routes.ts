import { FastifyInstance } from 'fastify';
import { assetService } from '../services/asset.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createAssetSchema,
  updateAssetSchema,
  updateAssetValueSchema,
} from '@finplan/shared';

export async function assetRoutes(fastify: FastifyInstance) {
  // Get all assets for current user with optional enhanced data
  fastify.get('/assets', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { enhanced } = request.query as { enhanced?: string };

    // If enhanced=true, return with value history
    if (enhanced === 'true') {
      const assets = await assetService.getUserAssetsWithHistory(userId);
      return reply.send({ assets });
    }

    // Otherwise return basic data
    const assets = await assetService.getUserAssets(userId);
    return reply.send({ assets });
  });

  // Get single asset by ID
  fastify.get('/assets/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const asset = await assetService.getAssetById(id, userId);
    return reply.send({ asset });
  });

  // Get value history for an asset
  fastify.get('/assets/:id/history', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const { daysBack } = request.query as { daysBack?: string };

    const days = daysBack ? parseInt(daysBack, 10) : 90;
    const history = await assetService.getAssetValueHistory(id, userId, days);
    return reply.send({ history });
  });

  // Create new asset
  fastify.post('/assets', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const validatedData = createAssetSchema.parse(request.body);

    const asset = await assetService.createAsset(userId, validatedData);
    return reply.status(201).send({ asset });
  });

  // Update asset properties
  fastify.put('/assets/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const validatedData = updateAssetSchema.parse(request.body);

    const asset = await assetService.updateAsset(id, userId, validatedData);
    return reply.send({ asset });
  });

  // Update asset current value (creates history entry)
  fastify.put('/assets/:id/value', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const validatedData = updateAssetValueSchema.parse(request.body);

    const asset = await assetService.updateAssetValue(
      id,
      userId,
      validatedData.newValue,
      validatedData.source,
      validatedData.date ? new Date(validatedData.date) : undefined
    );
    return reply.send({ asset });
  });

  // Delete asset
  fastify.delete('/assets/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const result = await assetService.deleteAsset(id, userId);
    return reply.send(result);
  });

  // Get asset summary (analytics)
  fastify.get('/assets/summary', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userId = request.user!.userId;
    const summary = await assetService.getAssetSummary(userId);
    return reply.send(summary);
  });
}
