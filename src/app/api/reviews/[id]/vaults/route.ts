import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireReviewAccess, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [vaults, snapshots] = await Promise.all([
    prisma.vault.findMany({
      where: { householdId: result.session.householdId },
      include: { owner: { select: { id: true, name: true, color: true } } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.vaultSnapshot.findMany({ where: { reviewId: Number(id) } }),
  ]);
  return NextResponse.json({ vaults, snapshots });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = z.array(z.object({
    vaultId: z.number().int().positive(),
    amount: z.number().int(),
  })).safeParse(body?.snapshots);
  if (!parsed.success) return badRequest('Invalid');

  const pctUpdates: { id: number; treasuryPct: number }[] = body?.pctUpdates ?? [];
  if (pctUpdates.length > 0) {
    await Promise.all(
      pctUpdates.map((u) => prisma.vault.update({ where: { id: u.id }, data: { treasuryPct: u.treasuryPct } }))
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
