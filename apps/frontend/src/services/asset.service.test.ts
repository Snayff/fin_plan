import { describe, it, expect, beforeEach } from 'bun:test';
import { setAuthenticated } from '../test/helpers/auth';
import { assetService } from './asset.service';

beforeEach(() => setAuthenticated());

describe('assetService.getAssets', () => {
  it('returns assets list from GET /api/assets', async () => {
    const result = await assetService.getAssets();
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].id).toBe('asset-1');
  });
});

describe('assetService.createAsset', () => {
  it('sends POST to /api/assets and returns created asset', async () => {
    const result = await assetService.createAsset({
      name: 'Test Property',
      type: 'housing',
      currentValue: 250000,
    });
    expect(result.asset.id).toBe('asset-1');
  });
});

describe('assetService.deleteAsset', () => {
  it('sends DELETE to /api/assets/:id and returns success message', async () => {
    const result = await assetService.deleteAsset('asset-1');
    expect(result.message).toBeTruthy();
  });
});
