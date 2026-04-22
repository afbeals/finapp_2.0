import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireReviewAccess, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string; stepKey: string }> };

const schema = z.object({
  status: z.enum(['PENDING', 'COMPLETE', 'SKIPPED']).optional(),
  data: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, stepKey } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid request');

  const step = await prisma.reviewStep.upsert({
    where: { reviewId_stepKey: { reviewId: Number(id), stepKey } },
    create: { reviewId: Number(id), stepKey, ...parsed.data },
    update: { ...parsed.data },
  });
  return NextResponse.json({ step });
}
