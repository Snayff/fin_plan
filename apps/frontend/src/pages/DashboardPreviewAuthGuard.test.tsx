import { beforeEach, describe, expect, it } from 'bun:test';
import { http, HttpResponse } from 'msw';
import Dashboard1Page from './Dashboard1Page';
import Dashboard8Page from './Dashboard8Page';
import Dashboard9Page from './Dashboard9Page';
import Dashboard14Page from './Dashboard14Page';
import Dashboard15Page from './Dashboard15Page';
import { useAuthStore } from '../stores/authStore';
import { renderWithProviders } from '../test/helpers/render';
import { server } from '../test/msw/server';

function primeFontLink(id: string) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.id = id;
  document.head.appendChild(link);
}

const previewCases = [
  {
    name: 'Dashboard1Page',
    Component: Dashboard1Page,
    path: '/dashboard1',
    fontId: 'dashboard1-fonts',
  },
  {
    name: 'Dashboard8Page',
    Component: Dashboard8Page,
    path: '/dashboard8',
    fontId: 'dashboard8-fonts',
  },
  {
    name: 'Dashboard9Page',
    Component: Dashboard9Page,
    path: '/dashboard9',
    fontId: 'dashboard9-fonts',
  },
  {
    name: 'Dashboard14Page',
    Component: Dashboard14Page,
    path: '/dashboard14',
    fontId: 'dashboard14-fonts',
  },
  {
    name: 'Dashboard15Page',
    Component: Dashboard15Page,
    path: '/dashboard15',
    fontId: 'dashboard15-fonts',
  },
] as const;

describe('dashboard preview auth guards', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      authStatus: 'initializing',
      isLoading: false,
      error: null,
    });
  });

  it.each(previewCases)(
    'does not request dashboard data or redirect during auth bootstrap for $name',
    async ({ Component, path, fontId }) => {
      let summaryRequests = 0;
      let netWorthTrendRequests = 0;
      let incomeExpenseTrendRequests = 0;

      primeFontLink(fontId);
      (window.location as any).href = `http://localhost:3001${path}`;
      (window.location as any).pathname = path;

      server.use(
        http.get('/api/dashboard/summary', () => {
          summaryRequests += 1;
          return HttpResponse.json(
            { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
            { status: 401 }
          );
        }),
        http.get('/api/dashboard/net-worth-trend', () => {
          netWorthTrendRequests += 1;
          return HttpResponse.json(
            { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
            { status: 401 }
          );
        }),
        http.get('/api/dashboard/income-expense-trend', () => {
          incomeExpenseTrendRequests += 1;
          return HttpResponse.json(
            { error: { code: 'AUTHENTICATION_ERROR', message: 'No authorization token provided' } },
            { status: 401 }
          );
        })
      );

      renderWithProviders(<Component />, {
        initialEntries: [path],
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(summaryRequests).toBe(0);
      expect(netWorthTrendRequests).toBe(0);
      expect(incomeExpenseTrendRequests).toBe(0);
      expect((window.location as any).href).toBe(`http://localhost:3001${path}`);
    }
  );
});
