import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { prismaMock, resetPrismaMocks } from '../test/mocks/prisma';

mock.module('../config/database', () => ({
  prisma: prismaMock,
}));

import { auditService } from './audit.service';

beforeEach(() => {
  resetPrismaMocks();
});

describe('auditService.log', () => {
  it('calls prisma.auditLog.create with the provided entry', async () => {
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    auditService.log({ userId: 'user-1', action: 'LOGIN' });

    // fire-and-forget: we flush the microtask queue before asserting
    await Promise.resolve();

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', action: 'LOGIN' },
    });
  });

  it('does not throw when prisma.auditLog.create rejects', () => {
    prismaMock.auditLog.create.mockRejectedValue(new Error('DB write failed'));

    // Should not throw — fire-and-forget
    expect(() => auditService.log({ action: 'SIGNUP' })).not.toThrow();
  });

  it('passes optional fields (resource, resourceId, metadata) to prisma', async () => {
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    auditService.log({
      userId: 'user-2',
      action: 'DELETE',
      resource: 'transaction',
      resourceId: 'tx-1',
      metadata: { reason: 'user request' },
    });

    await Promise.resolve();

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        resource: 'transaction',
        resourceId: 'tx-1',
        metadata: { reason: 'user request' },
      }),
    });
  });
});
