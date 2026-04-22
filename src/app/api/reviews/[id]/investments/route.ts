import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id: Number(id) } });
  if (!review || review.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [accounts, snapshots] = await Promise.all([
    prisma.investmentAccount.findMany({
      where: { householdId: session.householdId },
      include: {
        purchases: { orderBy: { purchaseDate: 'asc' } },
        owner: { select: { id: true, name: true, color: true } },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.holdingSnapshot.findMany({
      where: { reviewId: Number(id) },
    }),
  ]);

  return NextResponse.json({ accounts, snapshots });
}

const snapshotSchema = z.object({
  purchaseId: z.number().int().positive(),
  price: z.number().int(),
  value: z.number().int(),
  gainLoss: z.number().int(),
});

// PUT — bulk upsert snapshots (called when saving the step)
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id: Number(id) } });
  if (!review || review.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z.array(snapshotSchema).safeParse(body?.snapshots);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

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
