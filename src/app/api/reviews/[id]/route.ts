import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireReviewAccess, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const review = await prisma.review.findUnique({
    where: { id: Number(id) },
    include: { steps: { orderBy: { id: 'asc' } } },
  });
  return NextResponse.json({ review });
}

const patchSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETE', 'SKIPPED']).optional(),
  currentStep: z.string().optional(),
  lockedForEdit: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid request');

  const updated = await prisma.review.update({
    where: { id: Number(id) },
    data: {
      ...parsed.data,
      lastEditorId: result.session.memberId,
      ...(parsed.data.status === 'COMPLETE' ? { completedAt: new Date() } : {}),
    },
    include: { steps: { orderBy: { id: 'asc' } } },
  });
  return NextResponse.json({ review: updated });
}
