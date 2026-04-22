import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireReviewAccess, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [accounts, snapshots] = await Promise.all([
    prisma.investmentAccount.findMany({
      where: { householdId: result.session.householdId },
      include: {
        purchases: { orderBy: { purchaseDate: 'asc' } },
        owner: { select: { id: true, name: true, color: true } },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.holdingSnapshot.findMany({ where: { reviewId: Number(id) } }),
  ]);
  return NextResponse.json({ accounts, snapshots });
}

const snapshotSchema = z.object({
  purchaseId: z.number().int().positive(),
  price: z.number().int(),
  value: z.number().int(),
  gainLoss: z.number().int(),
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
      prisma.holdingSnapshot.upsert({
        where: { purchaseId_reviewId: { purchaseId: s.purchaseId, reviewId: Number(id) } },
        create: { ...s, reviewId: Number(id) },
        update: { price: s.price, value: s.value, gainLoss: s.gainLoss },
      })
    )
  );
  return NextResponse.json({ snapshots });
}
