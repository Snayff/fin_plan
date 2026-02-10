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
import { useAuthStore } from '../stores/authStore';

const getToken = () => useAuthStore.getState().accessToken;

export const assetService = {
  async getAssets(): Promise<{ assets: Asset[] }> {
    return apiClient.get<{ assets: Asset[] }>('/api/assets', getToken() || undefined);
  },

  async getEnhancedAssets(): Promise<{ assets: EnhancedAsset[] }> {
    return apiClient.get<{ assets: EnhancedAsset[] }>('/api/assets?enhanced=true', getToken() || undefined);
  },

  async getAsset(id: string): Promise<{ asset: Asset }> {
    return apiClient.get<{ asset: Asset }>(`/api/assets/${id}`, getToken() || undefined);
  },

  async getAssetHistory(id: string): Promise<{ history: AssetValueHistory[] }> {
    return apiClient.get<{ history: AssetValueHistory[] }>(`/api/assets/${id}/history`, getToken() || undefined);
  },

  async createAsset(data: CreateAssetInput): Promise<{ asset: Asset }> {
    return apiClient.post<{ asset: Asset }>('/api/assets', data, getToken() || undefined);
  },

  async updateAsset(id: string, data: UpdateAssetInput): Promise<{ asset: Asset }> {
    return apiClient.put<{ asset: Asset }>(`/api/assets/${id}`, data, getToken() || undefined);
  },

  async updateAssetValue(id: string, data: UpdateAssetValueInput): Promise<{ asset: Asset }> {
    return apiClient.put<{ asset: Asset }>(`/api/assets/${id}/value`, data, getToken() || undefined);
  },

  async deleteAsset(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/assets/${id}`, getToken() || undefined);
  },

  async getAssetSummary(): Promise<AssetSummary> {
    return apiClient.get<AssetSummary>('/api/assets/summary', getToken() || undefined);
  },
};
