import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireReviewAccess, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const entries = await prisma.incomeEntry.findMany({
    where: { reviewId: Number(id) },
    include: { member: { select: { id: true, name: true, color: true } } },
  });
  return NextResponse.json({ entries });
}

const schema = z.object({
  memberId: z.number().int().positive(),
  name: z.string().min(1),
  notes: z.string().optional(),
  amount: z.number().int().positive(),
});

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid', parsed.error.flatten());

  const entry = await prisma.incomeEntry.create({
    data: { reviewId: Number(id), ...parsed.data },
    include: { member: { select: { id: true, name: true, color: true } } },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
