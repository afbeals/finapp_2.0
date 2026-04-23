import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  prisma: {
    investmentAccount: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    purchase: { count: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock('@/lib/apiGuards', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/lib/apiGuards')>();
  return {
    ...orig,
    requireHouseholdResource: vi.fn().mockResolvedValue({
      session: { householdId: 1, memberId: 1 },
      resource: { id: 1, householdId: 1 },
    }),
    badRequest: orig.badRequest,
    conflict: orig.conflict,
  };
});

import { DELETE, PATCH } from '@/app/api/config/investment-accounts/[id]/route';
import { prisma } from '@/lib/db';

const mockPrisma = prisma as unknown as {
  investmentAccount: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  purchase: {
    count: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
};

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const stubAccount = { id: 1, householdId: 1, name: 'My Brokerage', type: 'TAXABLE', owner: null };

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.investmentAccount.findUnique.mockResolvedValue(stubAccount);
  mockPrisma.investmentAccount.update.mockResolvedValue(stubAccount);
  mockPrisma.investmentAccount.delete.mockResolvedValue(stubAccount);
  mockPrisma.purchase.count.mockResolvedValue(0);
  mockPrisma.purchase.updateMany.mockResolvedValue({ count: 0 });
});

describe('PATCH /api/config/investment-accounts/[id]', () => {
  it('updates and returns the account', async () => {
    const updated = { ...stubAccount, name: 'Renamed' };
    mockPrisma.investmentAccount.update.mockResolvedValue(updated);

    const req = new NextRequest('http://localhost/api/config/investment-accounts/1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renamed' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, makeParams('1'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.account.name).toBe('Renamed');
    expect(mockPrisma.investmentAccount.update).toHaveBeenCalledOnce();
  });

  it('returns 400 for invalid type value', async () => {
    const req = new NextRequest('http://localhost/api/config/investment-accounts/1', {
      method: 'PATCH',
      body: JSON.stringify({ type: 'INVALID_TYPE' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, makeParams('1'));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/config/investment-accounts/[id]', () => {
  it('deletes the account when it has no purchases', async () => {
    mockPrisma.purchase.count.mockResolvedValue(0);

    const req = new NextRequest('http://localhost/api/config/investment-accounts/1', {
      method: 'DELETE',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await DELETE(req, makeParams('1'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockPrisma.investmentAccount.delete).toHaveBeenCalledOnce();
  });

  it('returns 409 with inUse payload when account has purchases and no transferToId', async () => {
    mockPrisma.purchase.count.mockResolvedValue(3);

    const req = new NextRequest('http://localhost/api/config/investment-accounts/1', {
      method: 'DELETE',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await DELETE(req, makeParams('1'));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.inUse).toBe(true);
    expect(json.purchaseCount).toBe(3);
    expect(mockPrisma.investmentAccount.delete).not.toHaveBeenCalled();
  });

  it('transfers purchases and deletes when transferToId is provided', async () => {
    mockPrisma.purchase.count.mockResolvedValue(2);
    mockPrisma.investmentAccount.findUnique.mockResolvedValue({ id: 99, householdId: 1 });

    const req = new NextRequest('http://localhost/api/config/investment-accounts/1', {
      method: 'DELETE',
      body: JSON.stringify({ transferToId: 99 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await DELETE(req, makeParams('1'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockPrisma.purchase.updateMany).toHaveBeenCalledWith({
      where: { accountId: 1 },
      data: { accountId: 99 },
    });
    expect(mockPrisma.investmentAccount.delete).toHaveBeenCalledOnce();
  });
});
