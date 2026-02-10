import { apiClient } from '../lib/api';
import type {
  Asset,
  AssetValueHistory,
  EnhancedAsset,
  AssetSummary,
  CreateAssetInput,
  UpdateAssetInput,
  UpdateAssetValueInput,
} from '../types';

export const assetService = {
  // Get all assets with enhanced data (value history)
  async getAssets(): Promise<{ assets: EnhancedAsset[] }> {
    return apiClient.get<{ assets: EnhancedAsset[] }>('/api/assets');
  },

  // Alias for backward compatibility - both return same enhanced data
  async getEnhancedAssets(): Promise<{ assets: EnhancedAsset[] }> {
    return this.getAssets();
  },

  async getAsset(id: string): Promise<{ asset: Asset }> {
    return apiClient.get<{ asset: Asset }>(`/api/assets/${id}`);
  },

  async getAssetHistory(id: string): Promise<{ history: AssetValueHistory[] }> {
    return apiClient.get<{ history: AssetValueHistory[] }>(`/api/assets/${id}/history`);
  },

  async createAsset(data: CreateAssetInput): Promise<{ asset: Asset }> {
    return apiClient.post<{ asset: Asset }>('/api/assets', data);
  },

  async updateAsset(id: string, data: UpdateAssetInput): Promise<{ asset: Asset }> {
    return apiClient.put<{ asset: Asset }>(`/api/assets/${id}`, data);
  },

  async updateAssetValue(id: string, data: UpdateAssetValueInput): Promise<{ asset: Asset }> {
    return apiClient.put<{ asset: Asset }>(`/api/assets/${id}/value`, data);
  },

  async deleteAsset(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/assets/${id}`);
  },

  async getAssetSummary(): Promise<AssetSummary> {
    return apiClient.get<AssetSummary>('/api/assets/summary');
  },
};
