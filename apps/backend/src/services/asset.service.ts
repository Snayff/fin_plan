import { prisma } from '../config/database';
import { AssetType, LiquidityType, ValueSource } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { subDays } from 'date-fns';

const ASSET_LIQUIDITY_BY_TYPE: Record<AssetType, LiquidityType> = {
  housing: 'illiquid',
  investment: 'liquid',
  vehicle: 'illiquid',
  business: 'illiquid',
  personal_property: 'illiquid',
  crypto: 'liquid',
};

export interface CreateAssetInput {
  name: string;
  type: AssetType;
  currentValue: number;
  purchaseValue?: number;
  purchaseDate?: string | Date;
  expectedGrowthRate?: number;
  metadata?: {
    location?: string;
    ticker?: string;
    registrationNumber?: string;
    notes?: string;
  };
}

export interface UpdateAssetInput {
  name?: string;
  type?: AssetType;
  purchaseValue?: number;
  purchaseDate?: string | Date;
  expectedGrowthRate?: number;
  metadata?: Record<string, any>;
}

export interface UpdateAssetValueInput {
  newValue: number;
  source?: ValueSource;
  date?: string | Date;
}

export const assetService = {
  /**
   * Detect Prisma enum deserialization errors caused by legacy/stale enum values
   * (e.g. `real_estate` after rename to `housing`).
   */
  isLegacyAssetTypeEnumError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const message = error.message || '';
    return (
      message.includes("Value 'real_estate' not found in enum") ||
      message.includes('Value \"real_estate\" not found in enum') ||
      (message.includes('not found in enum') && message.includes('AssetType'))
    );
  },

  /**
   * Fallback query for assets when Prisma enum decoding fails.
   * Reads enum as text and normalizes legacy values for API consumers.
   */
  async getUserAssetsRawWithLegacyTypeSupport(userId: string) {
    const rows = await prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
      name: string;
      type: string;
      current_value: number | string;
      purchase_value: number | string | null;
      purchase_date: Date | null;
      expected_growth_rate: number | string;
      liquidity_type: string;
      metadata: unknown;
      created_at: Date;
      updated_at: Date;
    }>>`
      SELECT
        id,
        user_id,
        name,
        type::text AS type,
        current_value,
        purchase_value,
        purchase_date,
        expected_growth_rate,
        liquidity_type::text AS liquidity_type,
        metadata,
        created_at,
        updated_at
      FROM assets
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type === 'real_estate' ? 'housing' : row.type,
      currentValue: Number(row.current_value),
      purchaseValue: row.purchase_value === null ? null : Number(row.purchase_value),
      purchaseDate: row.purchase_date,
      expectedGrowthRate: Number(row.expected_growth_rate),
      liquidityType: row.liquidity_type,
      metadata: (row.metadata as Record<string, any>) || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  /**
   * Create a new asset with initial value history entry
   */
  async createAsset(userId: string, data: CreateAssetInput) {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Asset name is required');
    }

    if (data.currentValue === undefined || data.currentValue < 0) {
      throw new ValidationError('Current value must be non-negative');
    }

    // Use transaction to create asset and initial history entry atomically
    const result = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          userId,
          name: data.name.trim(),
          type: data.type,
          currentValue: data.currentValue,
          purchaseValue: data.purchaseValue,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          expectedGrowthRate: data.expectedGrowthRate ?? 0,
          liquidityType: ASSET_LIQUIDITY_BY_TYPE[data.type],
          metadata: data.metadata || {},
        },
      });

      // Create initial value history entry
      await tx.assetValueHistory.create({
        data: {
          assetId: asset.id,
          value: data.currentValue,
          date: asset.createdAt,
          source: 'manual',
        },
      });

      return asset;
    });

    return result;
  },

  /**
   * Get a single asset by ID with ownership check
   */
  async getAssetById(assetId: string, userId: string) {
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, userId },
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    return asset;
  },

  /**
   * Get all assets for a user
   */
  async getUserAssets(userId: string) {
    const assets = await prisma.asset.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }],
    });

    return assets;
  },

  /**
   * Get all assets for a user with enhanced data:
   * - Value history (last 90 days)
   * - Calculated gains
   */
  async getUserAssetsWithHistory(userId: string, daysBack: number = 90) {
    let assets = await prisma.asset
      .findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }],
      })
      .catch(async (error) => {
        if (!this.isLegacyAssetTypeEnumError(error)) {
          throw error;
        }

        console.warn(
          '[assetService] Falling back to raw asset query due to legacy AssetType enum values. Consider running migrations to normalize enum values.'
        );
        return this.getUserAssetsRawWithLegacyTypeSupport(userId);
      });

    if (assets.length === 0) {
      return [];
    }

    // Fetch value history for all assets in parallel
    const assetIds = assets.map(a => a.id);
    const cutoffDate = subDays(new Date(), daysBack);

    const valueHistories = await prisma.assetValueHistory.findMany({
      where: {
        assetId: { in: assetIds },
        date: { gte: cutoffDate },
      },
      orderBy: { date: 'asc' },
    });

    // Group histories by asset ID
    const historyMap = new Map<string, any[]>();
    valueHistories.forEach(history => {
      if (!historyMap.has(history.assetId)) {
        historyMap.set(history.assetId, []);
      }
      historyMap.get(history.assetId)!.push({
        id: history.id,
        value: Number(history.value),
        date: history.date.toISOString(),
        source: history.source,
      });
    });

    // Enrich assets with history and calculated gains
    const enhancedAssets = assets.map(asset => {
      const currentValue = Number(asset.currentValue);
      const purchaseValue = asset.purchaseValue ? Number(asset.purchaseValue) : null;

      let totalGain = 0;
      let totalGainPercent = 0;

      if (purchaseValue !== null && purchaseValue > 0) {
        totalGain = currentValue - purchaseValue;
        totalGainPercent = (totalGain / purchaseValue) * 100;
      }

      return {
        ...asset,
        currentValue,
        purchaseValue,
        expectedGrowthRate: Number(asset.expectedGrowthRate),
        valueHistory: historyMap.get(asset.id) || [],
        totalGain,
        totalGainPercent,
      };
    });

    return enhancedAssets;
  },

  /**
   * Update asset properties
   */
  async updateAsset(assetId: string, userId: string, data: UpdateAssetInput) {
    // Verify asset exists and belongs to user
    const existingAsset = await prisma.asset.findFirst({
      where: { id: assetId, userId },
    });

    if (!existingAsset) {
      throw new NotFoundError('Asset not found');
    }

    // Validate provided fields
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Asset name cannot be empty');
    }

    // Build update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.purchaseValue !== undefined) updateData.purchaseValue = data.purchaseValue;
    if (data.purchaseDate !== undefined) {
      updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    }
    if (data.expectedGrowthRate !== undefined) updateData.expectedGrowthRate = data.expectedGrowthRate;
    if (data.type !== undefined) updateData.liquidityType = ASSET_LIQUIDITY_BY_TYPE[data.type];

    // Merge metadata if provided
    if (data.metadata !== undefined) {
      const existingMeta = (existingAsset.metadata as Record<string, any>) || {};
      updateData.metadata = { ...existingMeta, ...data.metadata };
    }

    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: updateData,
    });

    return asset;
  },

  /**
   * Update asset current value and create history entry
   */
  async updateAssetValue(
    assetId: string,
    userId: string,
    newValue: number,
    source: ValueSource = 'manual',
    date?: Date
  ) {
    // Verify asset exists and belongs to user
    const existingAsset = await prisma.asset.findFirst({
      where: { id: assetId, userId },
    });

    if (!existingAsset) {
      throw new NotFoundError('Asset not found');
    }

    if (newValue < 0) {
      throw new ValidationError('Value must be non-negative');
    }

    const valueDate = date || new Date();

    // Use transaction to update asset and create history entry atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update asset current value
      const asset = await tx.asset.update({
        where: { id: assetId },
        data: { currentValue: newValue },
      });

      // Create value history entry
      await tx.assetValueHistory.create({
        data: {
          assetId,
          value: newValue,
          date: valueDate,
          source,
        },
      });

      return asset;
    });

    return result;
  },

  /**
   * Get value history for an asset
   */
  async getAssetValueHistory(assetId: string, userId: string, daysBack: number = 90) {
    // Verify asset exists and belongs to user
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, userId },
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const cutoffDate = subDays(new Date(), daysBack);

    const history = await prisma.assetValueHistory.findMany({
      where: {
        assetId,
        date: { gte: cutoffDate },
      },
      orderBy: { date: 'asc' },
    });

    return history.map(h => ({
      id: h.id,
      value: Number(h.value),
      date: h.date.toISOString(),
      source: h.source,
    }));
  },

  /**
   * Delete an asset
   * Value history is automatically deleted due to cascade
   */
  async deleteAsset(assetId: string, userId: string) {
    // Verify asset exists and belongs to user
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, userId },
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    await prisma.asset.delete({
      where: { id: assetId },
    });

    return { message: 'Asset deleted successfully' };
  },

  /**
   * Get asset summary statistics for a user
   */
  async getAssetSummary(userId: string) {
    const assets = await prisma.asset.findMany({
      where: { userId },
    });

    if (assets.length === 0) {
      return {
        totalValue: 0,
        byType: [],
        totalGain: 0,
        totalGainPercent: 0,
      };
    }

    // Calculate totals
    let totalValue = 0;
    let totalGain = 0;
    let totalPurchaseValue = 0;

    const byTypeMap = new Map<AssetType, { value: number; count: number }>();

    assets.forEach(asset => {
      const currentValue = Number(asset.currentValue);
      const purchaseValue = asset.purchaseValue ? Number(asset.purchaseValue) : null;

      totalValue += currentValue;

      if (purchaseValue !== null) {
        totalGain += currentValue - purchaseValue;
        totalPurchaseValue += purchaseValue;
      }

      // Group by type
      const existing = byTypeMap.get(asset.type) || { value: 0, count: 0 };
      byTypeMap.set(asset.type, {
        value: existing.value + currentValue,
        count: existing.count + 1,
      });
    });

    const totalGainPercent = totalPurchaseValue > 0 ? (totalGain / totalPurchaseValue) * 100 : 0;

    const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
      type,
      value: data.value,
      count: data.count,
    }));

    return {
      totalValue,
      byType,
      totalGain,
      totalGainPercent,
    };
  },

  /**
   * Calculate total asset value as of a specific date
   */
  async calculateTotalAssetValue(userId: string, asOfDate: Date = new Date()) {
    const assets = await prisma.asset.findMany({
      where: {
        userId,
        createdAt: { lte: asOfDate },
      },
    });

    const total = assets.reduce((sum, asset) => sum + Number(asset.currentValue), 0);
    return total;
  },
};
