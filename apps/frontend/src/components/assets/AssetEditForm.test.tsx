import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/helpers/render';

const updateAssetMock = mock(() => Promise.resolve({ asset: { id: 'asset-1' } }));
const updateLiabilityMock = mock(() => Promise.resolve({ liability: { id: 'liability-1' } }));
const getLiabilitiesMock = mock(() =>
  Promise.resolve({
    liabilities: [
      {
        id: 'liability-1',
        name: 'Mortgage',
        type: 'mortgage',
        currentBalance: 200000,
        interestRate: 3.5,
        interestType: 'fixed',
        openDate: '2020-01-01T00:00:00Z',
        termEndDate: '2055-01-01T00:00:00Z',
        metadata: {},
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        linkedAsset: null,
      },
      {
        id: 'liability-2',
        name: 'Other Loan',
        type: 'personal_loan',
        currentBalance: 10000,
        interestRate: 6,
        interestType: 'fixed',
        openDate: '2022-01-01T00:00:00Z',
        termEndDate: '2028-01-01T00:00:00Z',
        metadata: {},
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        linkedAsset: {
          id: 'asset-other',
          name: 'Other Asset',
          type: 'vehicle',
          currentValue: 15000,
        },
      },
    ],
  })
);

mock.module('../../services/asset.service', () => ({
  assetService: {
    updateAsset: updateAssetMock,
  },
}));

mock.module('../../services/liability.service', () => ({
  liabilityService: {
    getLiabilities: getLiabilitiesMock,
    updateLiability: updateLiabilityMock,
  },
}));

import AssetEditForm from './AssetEditForm';

describe('AssetEditForm', () => {
  beforeEach(() => {
    updateAssetMock.mockClear();
    updateLiabilityMock.mockClear();
    getLiabilitiesMock.mockClear();
  });

  it('attaches an existing liability when selected', async () => {
    renderWithProviders(
      <AssetEditForm
        asset={{
          id: 'asset-1',
          userId: 'user-1',
          name: 'Main Residence',
          type: 'housing',
          currentValue: 300000,
          purchaseValue: 250000,
          purchaseDate: '2020-01-01T00:00:00Z',
          expectedGrowthRate: 3,
          liquidityType: 'illiquid',
          metadata: {},
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          linkedLiability: null,
        }}
      />
    );

    await waitFor(() => {
      expect(getLiabilitiesMock).toHaveBeenCalled();
    });

    const disabledOption = screen.getByRole('option', { name: /other loan/i }) as HTMLOptionElement;
    expect(disabledOption.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(/linked liability/i), { target: { value: 'liability-1' } });

    fireEvent.submit(screen.getByRole('button', { name: /update asset/i }).closest('form')!);

    await waitFor(() => {
      expect(updateAssetMock).toHaveBeenCalledWith(
        'asset-1',
        expect.objectContaining({
          name: 'Main Residence',
        })
      );
    });

    await waitFor(() => {
      expect(updateLiabilityMock).toHaveBeenCalledWith('liability-1', { linkedAssetId: 'asset-1' });
    });
  });

  it('unlinks the current liability when selection is cleared', async () => {
    renderWithProviders(
      <AssetEditForm
        asset={{
          id: 'asset-1',
          userId: 'user-1',
          name: 'Main Residence',
          type: 'housing',
          currentValue: 300000,
          purchaseValue: 250000,
          purchaseDate: '2020-01-01T00:00:00Z',
          expectedGrowthRate: 3,
          liquidityType: 'illiquid',
          metadata: {},
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          linkedLiability: {
            id: 'liability-1',
            name: 'Mortgage',
            type: 'mortgage',
            currentBalance: 200000,
          },
        }}
      />
    );

    await waitFor(() => {
      expect(getLiabilitiesMock).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText(/linked liability/i), { target: { value: '' } });

    fireEvent.submit(screen.getByRole('button', { name: /update asset/i }).closest('form')!);

    await waitFor(() => {
      expect(updateLiabilityMock).toHaveBeenCalledWith('liability-1', { linkedAssetId: null });
    });
  });
});
