import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireReviewAccess, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [accounts, snapshots, retirementSnapshots, allRetirementSnapshots, allReviews] = await Promise.all([
    prisma.investmentAccount.findMany({
      where: { householdId: result.session.householdId },
      include: {
        purchases: { orderBy: { purchaseDate: 'asc' } },
        owner: { select: { id: true, name: true, color: true } },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.holdingSnapshot.findMany({ where: { reviewId: Number(id) } }),
    prisma.retirementSnapshot.findMany({ where: { reviewId: Number(id) } }),
    prisma.retirementSnapshot.findMany({
      where: { account: { householdId: result.session.householdId } },
      include: { review: { select: { id: true, periodYear: true, periodMonth: true } } },
      orderBy: [{ review: { periodYear: 'asc' } }, { review: { periodMonth: 'asc' } }],
    }),
    prisma.review.findMany({
      where: { householdId: result.session.householdId },
      select: { id: true, periodYear: true, periodMonth: true },
      orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
    }),
  ]);
  return NextResponse.json({ accounts, snapshots, retirementSnapshots, allRetirementSnapshots, allReviews });
}

const snapshotSchema = z.object({
  purchaseId: z.number().int().positive(),
  price: z.number().int(),
  value: z.number().int(),
  gainLoss: z.number().int(),
});

const retirementSchema = z.object({
  accountId: z.number().int().positive(),
  balance: z.number().int().nonnegative(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsedSnapshots = z.array(snapshotSchema).safeParse(body?.snapshots ?? []);
  const parsedRetirement = z.array(retirementSchema).safeParse(body?.retirementSnapshots ?? []);
  if (!parsedSnapshots.success || !parsedRetirement.success) return badRequest('Invalid');

  const reviewIdNum = Number(id);

  const [snapshots, retirementSnapshots] = await Promise.all([
    Promise.all(
      parsedSnapshots.data.map((s) =>
        prisma.holdingSnapshot.upsert({
          where: { purchaseId_reviewId: { purchaseId: s.purchaseId, reviewId: reviewIdNum } },
          create: { ...s, reviewId: reviewIdNum },
          update: { price: s.price, value: s.value, gainLoss: s.gainLoss },
        })
      )
    ),
    Promise.all(
      parsedRetirement.data.map((s) =>
        prisma.retirementSnapshot.upsert({
          where: { accountId_reviewId: { accountId: s.accountId, reviewId: reviewIdNum } },
          create: { accountId: s.accountId, reviewId: reviewIdNum, balance: s.balance },
          update: { balance: s.balance },
        })
      )
    ),
  ]);
  return NextResponse.json({ snapshots, retirementSnapshots });
}
