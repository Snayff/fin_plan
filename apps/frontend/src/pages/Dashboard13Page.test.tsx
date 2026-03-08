import { beforeEach, describe, expect, it } from 'bun:test';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../stores/authStore';
import Dashboard13Page from './Dashboard13Page';

function primeFontLink(id: string) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.id = id;
  document.head.appendChild(link);
}

describe('Dashboard13Page', () => {
  beforeEach(() => {
    primeFontLink('dashboard13-fonts');
    (window.location as any).href = 'http://localhost:3001/dashboard13';
    (window.location as any).pathname = '/dashboard13';
  });

  it('does not request dashboard data or redirect during auth bootstrap', async () => {
    let summaryRequests = 0;
    let trendRequests = 0;

    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      authStatus: 'initializing',
      isLoading: false,
      error: null,
    });

    server.use(
      http.get('/api/dashboard/summary', () => {
        summaryRequests += 1;
        return HttpResponse.json(
          { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
          { status: 401 }
        );
      }),
      http.get('/api/dashboard/net-worth-trend', () => {
        trendRequests += 1;
        return HttpResponse.json(
          { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
          { status: 401 }
        );
      })
    );

    renderWithProviders(<Dashboard13Page />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(summaryRequests).toBe(0);
    expect(trendRequests).toBe(0);
    expect((window.location as any).href).toBe('http://localhost:3001/dashboard13');
  });
});
