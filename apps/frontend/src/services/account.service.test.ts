import { describe, it, expect, beforeEach } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { setAuthenticated, setUnauthenticated } from '../test/helpers/auth';
import { accountService } from './account.service';

beforeEach(() => setAuthenticated());

describe('accountService.getAccounts', () => {
  it('returns accounts from GET /api/accounts', async () => {
    const result = await accountService.getAccounts();
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].id).toBe('acc-1');
  });

  it('throws with statusCode 401 when unauthenticated', async () => {
    setUnauthenticated();
    // Also make refresh fail so the retry doesn't succeed
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ error: { code: 'AUTHENTICATION_ERROR' } }, { status: 401 })
      )
    );
    await expect(accountService.getAccounts()).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('accountService.createAccount', () => {
  it('sends POST to /api/accounts and returns created account', async () => {
    const result = await accountService.createAccount({ name: 'Test', type: 'current' as any, currency: 'GBP' });
    expect(result.account.id).toBe('acc-1');
  });
});

describe('accountService.updateAccount', () => {
  it('sends PUT to /api/accounts/:id', async () => {
    const result = await accountService.updateAccount('acc-1', { name: 'Updated' });
    expect(result.account.id).toBe('acc-1');
  });
});

describe('accountService.deleteAccount', () => {
  it('sends DELETE and returns message', async () => {
    const result = await accountService.deleteAccount('acc-1');
    expect(result.message).toBeTruthy();
  });
});
