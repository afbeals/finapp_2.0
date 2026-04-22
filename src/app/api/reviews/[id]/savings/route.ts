import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireReviewAccess, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [accounts, snapshots, allSnapshots, allReviews] = await Promise.all([
    prisma.savingsAccount.findMany({ where: { householdId: result.session.householdId }, orderBy: { id: 'asc' } }),
    prisma.savingsSnapshot.findMany({ where: { reviewId: Number(id) } }),
    prisma.savingsSnapshot.findMany({
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

  return NextResponse.json({ accounts, snapshots, allSnapshots, allReviews });
}

const snapshotSchema = z.object({
  accountId: z.number().int().positive(),
  startingBalance: z.number().int(),
  deposits: z.number().int(),
  interest: z.number().int(),
  endingBalance: z.number().int(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = z.array(snapshotSchema).safeParse(body?.snapshots);
  if (!parsed.success) return badRequest('Invalid');

  const snapshots = await Promise.all(
    parsed.data.map((s) =>
      prisma.savingsSnapshot.upsert({
        where: { accountId_reviewId: { accountId: s.accountId, reviewId: Number(id) } },
        create: { ...s, reviewId: Number(id) },
        update: { startingBalance: s.startingBalance, deposits: s.deposits, interest: s.interest, endingBalance: s.endingBalance },
      })
    )
  );
  return NextResponse.json({ snapshots });
}

const patchSchema = z.object({
  accountId: z.number().int().positive(),
  startingBalance: z.number().int().optional(),
  deposits: z.number().int().optional(),
  interest: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid');

  const { accountId, ...fields } = parsed.data;

  const existing = await prisma.savingsSnapshot.findUnique({
    where: { accountId_reviewId: { accountId, reviewId: Number(id) } },
  }) ?? { startingBalance: 0, deposits: 0, interest: 0, endingBalance: 0 };

  const next = {
    startingBalance: fields.startingBalance ?? existing.startingBalance,
    deposits: fields.deposits ?? existing.deposits,
    interest: fields.interest ?? existing.interest,
  };
  const endingBalance = next.startingBalance + next.deposits + next.interest;

  const snapshot = await prisma.savingsSnapshot.upsert({
    where: { accountId_reviewId: { accountId, reviewId: Number(id) } },
    create: { accountId, reviewId: Number(id), ...next, endingBalance },
    update: { ...next, endingBalance },
  });
  return NextResponse.json({ snapshot });
}
