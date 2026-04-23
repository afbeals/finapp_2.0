import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  prisma: {
    vaultCategoryOrder: { upsert: vi.fn() },
  },
}));

vi.mock('@/lib/apiGuards', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/lib/apiGuards')>();
  return {
    ...orig,
    requireAuth: vi.fn().mockResolvedValue({ householdId: 1, memberId: 1 }),
    unauthorized: orig.unauthorized,
    badRequest: orig.badRequest,
  };
});

import { PATCH } from '@/app/api/vault-category-order/[category]/route';
import { prisma } from '@/lib/db';

const mockPrisma = prisma as unknown as {
  vaultCategoryOrder: { upsert: ReturnType<typeof vi.fn> };
};

function makeParams(category: string) {
  return { params: Promise.resolve({ category }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.vaultCategoryOrder.upsert.mockResolvedValue({
    householdId: 1,
    category: 'Bills',
    groupOrder: 2,
  });
});

describe('PATCH /api/vault-category-order/[category]', () => {
  it('upserts and returns the order record', async () => {
    const req = new NextRequest('http://localhost/api/vault-category-order/Bills', {
      method: 'PATCH',
      body: JSON.stringify({ groupOrder: 2 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, makeParams('Bills'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.order.category).toBe('Bills');
    expect(json.order.groupOrder).toBe(2);
    expect(mockPrisma.vaultCategoryOrder.upsert).toHaveBeenCalledOnce();
  });

  it('calls upsert with create and update payloads keyed to householdId + category', async () => {
    const req = new NextRequest('http://localhost/api/vault-category-order/Treasury', {
      method: 'PATCH',
      body: JSON.stringify({ groupOrder: 1 }),
      headers: { 'Content-Type': 'application/json' },
    });

    await PATCH(req, makeParams('Treasury'));

    const call = mockPrisma.vaultCategoryOrder.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ householdId_category: { householdId: 1, category: 'Treasury' } });
    expect(call.create).toMatchObject({ category: 'Treasury', groupOrder: 1 });
    expect(call.update).toMatchObject({ groupOrder: 1 });
  });

  it('returns 400 when groupOrder is missing', async () => {
    const req = new NextRequest('http://localhost/api/vault-category-order/Bills', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, makeParams('Bills'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when groupOrder is not a positive integer', async () => {
    const req = new NextRequest('http://localhost/api/vault-category-order/Bills', {
      method: 'PATCH',
      body: JSON.stringify({ groupOrder: -1 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, makeParams('Bills'));
    expect(res.status).toBe(400);
  });
});
