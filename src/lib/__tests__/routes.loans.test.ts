import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  prisma: {
    loan: { findMany: vi.fn() },
    loanSnapshot: { upsert: vi.fn() },
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

import { GET, PATCH } from '@/app/api/reviews/[id]/loans/route';
import { prisma } from '@/lib/db';

const mockPrisma = prisma as unknown as {
  loan: { findMany: ReturnType<typeof vi.fn> };
  loanSnapshot: { upsert: ReturnType<typeof vi.fn> };
};

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const stubLoan = { id: 1, name: 'Test', householdId: 1, loanSnapshots: [] };
const stubSnapshot = { loanId: 1, reviewId: 1, balance: 100000, paymentsMade: 0, interestPaid: 0, extraPayment: 0, paymentAmount: 0, principalAmount: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.loan.findMany.mockResolvedValue([{ ...stubLoan }]);
  mockPrisma.loanSnapshot.upsert.mockResolvedValue(stubSnapshot);
});

describe('GET /api/reviews/[id]/loans', () => {
  it('returns loans (without loanSnapshots) and snapshots separately', async () => {
    mockPrisma.loan.findMany.mockResolvedValue([{
      ...stubLoan,
      loanSnapshots: [{ loanId: 1, reviewId: 1, balance: 100000 }],
    }]);

    const req = new NextRequest('http://localhost/api/reviews/1/loans');
    const res = await GET(req, makeParams('1'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.loans[0]).not.toHaveProperty('loanSnapshots');
    expect(json.snapshots).toHaveLength(1);
  });
});

describe('PATCH /api/reviews/[id]/loans', () => {
  it('upserts a loan snapshot and returns it', async () => {
    const body = { loanId: 1, balance: 95000, paymentsMade: 1, interestPaid: 500 };
    const req = new NextRequest('http://localhost/api/reviews/1/loans', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, makeParams('1'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.snapshot).toBeDefined();
    expect(mockPrisma.loanSnapshot.upsert).toHaveBeenCalledOnce();
  });

  it('returns 400 when loanId is missing', async () => {
    const req = new NextRequest('http://localhost/api/reviews/1/loans', {
      method: 'PATCH',
      body: JSON.stringify({ balance: 95000 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, makeParams('1'));
    expect(res.status).toBe(400);
  });

  it('persists balance, interestPaid, and principalAmount fields', async () => {
    const body = { loanId: 1, balance: 90000, interestPaid: 1200, principalAmount: 800, paymentAmount: 190000 };
    const req = new NextRequest('http://localhost/api/reviews/1/loans', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    await PATCH(req, makeParams('1'));
    const call = mockPrisma.loanSnapshot.upsert.mock.calls[0][0];
    expect(call.update).toMatchObject({ balance: 90000, interestPaid: 1200, principalAmount: 800 });
  });
});
