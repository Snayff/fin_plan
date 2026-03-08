import { beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../test/helpers/render';
import { setAuthenticated } from '../test/helpers/auth';
import { server } from '../test/msw/server';
import Dashboard15Page from './Dashboard15Page';

function primeFontLink(id: string) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.id = id;
  document.head.appendChild(link);
}

describe('Dashboard15Page', () => {
  beforeEach(() => {
    setAuthenticated();
    primeFontLink('dashboard15-fonts');
  });

  it('renders without crashing and uses native SVG gradient definitions for the trend chart', async () => {
    server.use(
      http.get('/api/dashboard/net-worth-trend', ({ request }) => {
        const auth = request.headers.get('authorization');
        if (!auth?.startsWith('Bearer ')) {
          return HttpResponse.json(
            { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
            { status: 401 }
          );
        }

        return HttpResponse.json({
          trend: [
            { month: 'Jan', netWorth: 51000, cash: 5000, assets: 100000, liabilities: 54000 },
            { month: 'Feb', netWorth: 55000, cash: 5200, assets: 101000, liabilities: 51200 },
          ],
        });
      })
    );

    await act(async () => {
      renderWithProviders(<Dashboard15Page />);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText('PORTFOLIO VALUE')).toBeTruthy();
    });

    const source = readFileSync(join(import.meta.dir, 'Dashboard15Page.tsx'), 'utf8');
    expect(source.includes('<linearGradient id="sovereignGrad"')).toBe(true);
    expect(source.includes('<LinearGradient id="sovereignGrad"')).toBe(false);
  });
});
