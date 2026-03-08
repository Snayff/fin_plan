import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/helpers/render';

const getAssetsMock = mock(() =>
  Promise.resolve({
    assets: [
      {
        id: 'asset-1',
        name: 'Main Residence',
        type: 'housing',
        currentValue: 300000,
        purchaseValue: 250000,
        purchaseDate: null,
        expectedGrowthRate: 3,
        liquidityType: 'illiquid',
        metadata: {},
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        linkedLiability: null,
      },
      {
        id: 'asset-2',
        name: 'Already Linked Home',
        type: 'housing',
        currentValue: 200000,
        purchaseValue: 180000,
        purchaseDate: null,
        expectedGrowthRate: 2,
        liquidityType: 'illiquid',
        metadata: {},
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        linkedLiability: {
          id: 'liability-99',
          name: 'Other Mortgage',
          type: 'mortgage',
          currentBalance: 150000,
        },
      },
    ],
  })
);
const createAssetMock = mock(() => Promise.resolve({ asset: { id: 'asset-new' } }));
const createLiabilityMock = mock(() => Promise.resolve({ liability: { id: 'liability-1' } }));

mock.module('../../services/asset.service', () => ({
  assetService: {
    getAssets: getAssetsMock,
    createAsset: createAssetMock,
  },
}));

mock.module('../../services/liability.service', () => ({
  liabilityService: {
    createLiability: createLiabilityMock,
  },
}));

import LiabilityForm from './LiabilityForm';

describe('LiabilityForm', () => {
  beforeEach(() => {
    getAssetsMock.mockClear();
    createAssetMock.mockClear();
    createLiabilityMock.mockClear();
  });

  it('submits with an existing linked asset and disables already-linked assets', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LiabilityForm />);

    await user.click(screen.getByRole('button', { name: /select existing asset/i }));

    await waitFor(() => {
      expect(getAssetsMock).toHaveBeenCalled();
    });

    const linkedOption = screen.getByRole('option', { name: /already linked home/i }) as HTMLOptionElement;
    expect(linkedOption.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(/liability name/i), { target: { value: 'Home Mortgage' } });
    fireEvent.change(screen.getByLabelText(/current balance/i), { target: { value: '200000' } });
    fireEvent.change(screen.getByLabelText(/interest rate/i), { target: { value: '3.5' } });
    fireEvent.change(screen.getByLabelText(/open date/i), { target: { value: '2020-01-01' } });
    fireEvent.change(screen.getByLabelText(/term end date/i), { target: { value: '2055-01-01' } });
    fireEvent.change(screen.getByLabelText(/existing asset/i), { target: { value: 'asset-1' } });

    fireEvent.submit(screen.getByRole('button', { name: /create liability/i }).closest('form')!);

    await waitFor(() => {
      expect(createLiabilityMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Home Mortgage',
          linkedAssetId: 'asset-1',
        })
      );
    });

    expect(createAssetMock).not.toHaveBeenCalled();
  });

  it('creates a new asset inline before creating the linked liability', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LiabilityForm />);

    await user.click(screen.getByRole('button', { name: /create new asset/i }));

    fireEvent.change(screen.getByLabelText(/liability name/i), { target: { value: 'Home Mortgage' } });
    fireEvent.change(screen.getByLabelText(/current balance/i), { target: { value: '200000' } });
    fireEvent.change(screen.getByLabelText(/interest rate/i), { target: { value: '3.5' } });
    fireEvent.change(screen.getByLabelText(/open date/i), { target: { value: '2020-01-01' } });
    fireEvent.change(screen.getByLabelText(/term end date/i), { target: { value: '2055-01-01' } });
    fireEvent.change(screen.getByLabelText(/asset name/i), { target: { value: 'Main Residence' } });
    fireEvent.change(screen.getByLabelText(/^current value \*$/i), { target: { value: '300000' } });

    fireEvent.submit(screen.getByRole('button', { name: /create liability/i }).closest('form')!);

    await waitFor(() => {
      expect(createAssetMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Main Residence',
          currentValue: 300000,
        })
      );
    });

    await waitFor(() => {
      expect(createLiabilityMock).toHaveBeenCalledWith(
        expect.objectContaining({
          linkedAssetId: 'asset-new',
        })
      );
    });
  });
});
