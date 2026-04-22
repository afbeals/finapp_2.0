import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({
    where: { id: Number(id) },
    include: { steps: { orderBy: { id: 'asc' } } },
  });

  if (!review || review.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ review });
}

const patchSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETE', 'SKIPPED']).optional(),
  currentStep: z.string().optional(),
  lockedForEdit: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const review = await prisma.review.findUnique({ where: { id: Number(id) } });
  if (!review || review.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.review.update({
    where: { id: Number(id) },
    data: {
      ...parsed.data,
      lastEditorId: session.memberId,
      ...(parsed.data.status === 'COMPLETE' ? { completedAt: new Date() } : {}),
    },
    include: { steps: { orderBy: { id: 'asc' } } },
  });

  return NextResponse.json({ review: updated });
}
