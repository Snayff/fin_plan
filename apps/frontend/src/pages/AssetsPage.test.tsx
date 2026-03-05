// MSW-based tests for AssetsPage — no mock.module() calls.
import { describe, it, expect, beforeEach } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setAuthenticated } from '../test/helpers/auth';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';
import { mockAsset, mockEnhancedAsset } from '../test/msw/handlers';
import AssetsPage from './AssetsPage';

describe('AssetsPage (MSW)', () => {
  beforeEach(() => {
    setAuthenticated();
  });

  it('renders the Assets heading', async () => {
    renderWithProviders(<AssetsPage />);
    await waitFor(() => {
      expect(screen.getByText('Assets')).toBeTruthy();
    });
  });

  it('renders asset name from MSW handler', async () => {
    renderWithProviders(<AssetsPage />);
    await waitFor(() => {
      expect(screen.getByText(mockAsset.name)).toBeTruthy();
    });
  });

  it('renders the Add Asset button', async () => {
    renderWithProviders(<AssetsPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ add asset/i })).toBeTruthy();
    });
  });

  it('displays the total asset value in the summary card', async () => {
    renderWithProviders(<AssetsPage />);
    await waitFor(() => {
      expect(screen.getByText('Total Asset Value')).toBeTruthy();
    });
  });

  it('shows gain information when asset has a totalGain', async () => {
    renderWithProviders(<AssetsPage />);
    await waitFor(() => {
      expect(screen.getByText('Gain')).toBeTruthy();
    });
  });

  it('shows empty state with Create Asset button when no assets exist', async () => {
    server.use(
      http.get('/api/assets', () =>
        HttpResponse.json({ assets: [] })
      )
    );
    renderWithProviders(<AssetsPage />);
    await waitFor(() => {
      expect(screen.getByText(/no assets yet/i)).toBeTruthy();
    });
  });

  it('shows an error banner when the API returns 500', async () => {
    server.use(
      http.get('/api/assets', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
          { status: 500 }
        )
      )
    );
    renderWithProviders(<AssetsPage />);
    await waitFor(() => {
      expect(screen.getByText(/error loading assets/i)).toBeTruthy();
    });
  });
});
