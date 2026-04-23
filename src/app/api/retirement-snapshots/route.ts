import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, badRequest } from '@/lib/apiGuards';

const schema = z.object({
  accountId: z.number().int().positive(),
  reviewId: z.number().int().positive(),
  balance: z.number().int().nonnegative(),
});

export async function PUT(req: NextRequest) {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid');

  const { accountId, reviewId, balance } = parsed.data;

  const [account, review] = await Promise.all([
    prisma.investmentAccount.findUnique({ where: { id: accountId } }),
    prisma.review.findUnique({ where: { id: reviewId } }),
  ]);
  if (!account || account.householdId !== session.householdId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!review || review.householdId !== session.householdId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (account.type === 'TAXABLE') return badRequest('Retirement snapshots are only for non-taxable accounts');

  const snapshot = await prisma.retirementSnapshot.upsert({
    where: { accountId_reviewId: { accountId, reviewId } },
    create: { accountId, reviewId, balance },
    update: { balance },
    include: { review: { select: { id: true, periodYear: true, periodMonth: true } } },
  });
  return NextResponse.json({ snapshot });
}
