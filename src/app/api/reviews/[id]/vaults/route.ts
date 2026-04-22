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

  const [vaults, snapshots] = await Promise.all([
    prisma.vault.findMany({
      where: { householdId: session.householdId },
      include: { owner: { select: { id: true, name: true, color: true } } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.vaultSnapshot.findMany({ where: { reviewId: Number(id) } }),
  ]);

  return NextResponse.json({ vaults, snapshots });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id: Number(id) } });
  if (!review || review.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z.array(z.object({
    vaultId: z.number().int().positive(),
    amount: z.number().int(),
  })).safeParse(body?.snapshots);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  // Also allow updating vault treasuryPct from client
  const pctUpdates: { id: number; treasuryPct: number }[] = body?.pctUpdates ?? [];
  if (pctUpdates.length > 0) {
    await Promise.all(
      pctUpdates.map((u) =>
        prisma.vault.update({ where: { id: u.id }, data: { treasuryPct: u.treasuryPct } })
      )
    );
  }

  const snapshots = await Promise.all(
    parsed.data.map((s) =>
      prisma.vaultSnapshot.upsert({
        where: { vaultId_reviewId: { vaultId: s.vaultId, reviewId: Number(id) } },
        create: { vaultId: s.vaultId, reviewId: Number(id), amount: s.amount },
        update: { amount: s.amount },
      })
    )
  );

  return NextResponse.json({ snapshots });
}
