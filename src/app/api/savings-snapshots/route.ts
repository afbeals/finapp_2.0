import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Upsert a single savings snapshot for any review (not just the current one).
// Used by the history table inline edit to save any row.
const schema = z.object({
  accountId: z.number().int().positive(),
  reviewId: z.number().int().positive(),
  startingBalance: z.number().int().optional(),
  deposits: z.number().int().optional(),
  interest: z.number().int().optional(),
});

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const { accountId, reviewId, ...fields } = parsed.data;

  // Verify ownership
  const account = await prisma.savingsAccount.findUnique({ where: { id: accountId } });
  if (!account || account.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const existing = await prisma.savingsSnapshot.findUnique({
    where: { accountId_reviewId: { accountId, reviewId } },
  }) ?? { startingBalance: 0, deposits: 0, interest: 0 };

  const next = {
    startingBalance: fields.startingBalance ?? existing.startingBalance,
    deposits: fields.deposits ?? existing.deposits,
    interest: fields.interest ?? existing.interest,
  };
  const endingBalance = next.startingBalance + next.deposits + next.interest;

  const snapshot = await prisma.savingsSnapshot.upsert({
    where: { accountId_reviewId: { accountId, reviewId } },
    create: { accountId, reviewId, ...next, endingBalance },
    update: { ...next, endingBalance },
    include: { review: { select: { id: true, periodYear: true, periodMonth: true } } },
  });

  return NextResponse.json({ snapshot });
}
