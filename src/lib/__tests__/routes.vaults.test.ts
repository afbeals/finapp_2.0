import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Prisma and guards before importing route
vi.mock('@/lib/db', () => ({
  prisma: {
    vault: { findMany: vi.fn(), update: vi.fn() },
    vaultSnapshot: { findMany: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock('@/lib/apiGuards', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/lib/apiGuards')>();
  return {
    ...orig,
    requireReviewAccess: vi.fn().mockResolvedValue({
      session: { householdId: 1, memberId: 1 },
      review: { id: 1, householdId: 1 },
    }),
    badRequest: orig.badRequest,
  };
});

import { GET, PUT } from '@/app/api/reviews/[id]/vaults/route';
import { prisma } from '@/lib/db';

const mockPrisma = prisma as {
  vault: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  vaultSnapshot: { findMany: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> };
};

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.vault.findMany.mockResolvedValue([]);
  mockPrisma.vaultSnapshot.findMany.mockResolvedValue([]);
  mockPrisma.vaultSnapshot.upsert.mockImplementation(({ create }: { create: unknown }) =>
    Promise.resolve(create)
  );
});

describe('GET /api/reviews/[id]/vaults', () => {
  it('returns vaults and snapshots', async () => {
    mockPrisma.vault.findMany.mockResolvedValue([{ id: 1, name: 'Test' }]);
    mockPrisma.vaultSnapshot.findMany.mockResolvedValue([{ vaultId: 1, amount: 5000 }]);

    const req = new NextRequest('http://localhost/api/reviews/1/vaults');
    const res = await GET(req, makeParams('1'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.vaults).toHaveLength(1);
    expect(json.snapshots).toHaveLength(1);
  });
});

describe('PUT /api/reviews/[id]/vaults', () => {
  it('upserts snapshots and returns them', async () => {
    const body = { snapshots: [{ vaultId: 1, amount: 10000 }] };
    const req = new NextRequest('http://localhost/api/reviews/1/vaults', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PUT(req, makeParams('1'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.snapshots).toHaveLength(1);
    expect(mockPrisma.vaultSnapshot.upsert).toHaveBeenCalledOnce();
  });

  it('returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost/api/reviews/1/vaults', {
      method: 'PUT',
      body: JSON.stringify({ snapshots: 'not-an-array' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PUT(req, makeParams('1'));
    expect(res.status).toBe(400);
  });

  it('applies pctUpdates when provided', async () => {
    mockPrisma.vault.update.mockResolvedValue({});
    const body = {
      snapshots: [{ vaultId: 1, amount: 0 }],
      pctUpdates: [{ id: 1, treasuryPct: 50 }],
    };
    const req = new NextRequest('http://localhost/api/reviews/1/vaults', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    await PUT(req, makeParams('1'));
    expect(mockPrisma.vault.update).toHaveBeenCalledOnce();
  });
});
