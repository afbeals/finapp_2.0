import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string; stepKey: string }> };

const schema = z.object({
  status: z.enum(['PENDING', 'COMPLETE', 'SKIPPED']).optional(),
  data: z.string().optional(), // JSON string
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, stepKey } = await params;

  const review = await prisma.review.findUnique({ where: { id: Number(id) } });
  if (!review || review.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const step = await prisma.reviewStep.upsert({
    where: { reviewId_stepKey: { reviewId: Number(id), stepKey } },
    create: { reviewId: Number(id), stepKey, ...parsed.data },
    update: { ...parsed.data },
  });

  return NextResponse.json({ step });
}
