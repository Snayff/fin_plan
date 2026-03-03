import { describe, it, expect, beforeEach } from 'bun:test';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { setAuthenticated } from '../test/helpers/auth';
import { mockTransaction } from '../test/msw/handlers';
import { transactionService } from './transaction.service';

beforeEach(() => setAuthenticated());

describe('transactionService.getAllTransactions', () => {
  it('normalizes string amounts to numbers', async () => {
    server.use(
      http.get('/api/transactions', () =>
        HttpResponse.json({
          transactions: [{ ...mockTransaction, amount: '99.99' as any }],
          pagination: { total: 1, limit: 1000, offset: 0, hasMore: false },
        })
      )
    );
    const result = await transactionService.getAllTransactions(1000);
    expect(typeof result.transactions[0].amount).toBe('number');
    expect(result.transactions[0].amount).toBe(99.99);
  });

  it('passes limit as query parameter', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/transactions', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ transactions: [], pagination: { total: 0, limit: 500, offset: 0, hasMore: false } });
      })
    );
    await transactionService.getAllTransactions(500);
    expect(capturedUrl).toContain('limit=500');
  });
});

describe('transactionService.getTransactions (filters)', () => {
  it('passes filter params in query string', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/transactions', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ transactions: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } });
      })
    );
    await transactionService.getTransactions({ type: 'expense', accountId: 'acc-1' });
    expect(capturedUrl).toContain('type=expense');
    expect(capturedUrl).toContain('accountId=acc-1');
  });

  it('omits undefined/null filter values', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/transactions', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ transactions: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } });
      })
    );
    await transactionService.getTransactions({ type: undefined, accountId: 'acc-1' });
    expect(capturedUrl).not.toContain('type=');
    expect(capturedUrl).toContain('accountId=acc-1');
  });
});

describe('transactionService.createTransaction', () => {
  it('normalizes amount in response', async () => {
    server.use(
      http.post('/api/transactions', () =>
        HttpResponse.json({ transaction: { ...mockTransaction, amount: '55.00' as any } }, { status: 201 })
      )
    );
    const result = await transactionService.createTransaction({
      accountId: 'acc-1', amount: 55, type: 'expense' as any, name: 'Test', date: '2025-01-15',
    });
    expect(typeof result.transaction.amount).toBe('number');
    expect(result.transaction.amount).toBe(55);
  });
});

describe('transactionService.deleteTransaction', () => {
  it('sends DELETE to /api/transactions/:id', async () => {
    const result = await transactionService.deleteTransaction('tx-1');
    expect(result.message).toBeTruthy();
  });
});
