import { beforeEach, describe, expect, it } from 'bun:test';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../stores/authStore';
import Dashboard11Page from './Dashboard11Page';

function primeFontLink(id: string) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.id = id;
  document.head.appendChild(link);
}

describe('Dashboard11Page', () => {
  beforeEach(() => {
    primeFontLink('meridian-fonts');
    (window.location as any).href = 'http://localhost:3001/dashboard11';
    (window.location as any).pathname = '/dashboard11';
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

    renderWithProviders(<Dashboard11Page />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(summaryRequests).toBe(0);
    expect(trendRequests).toBe(0);
    expect((window.location as any).href).toBe('http://localhost:3001/dashboard11');
  });
});
