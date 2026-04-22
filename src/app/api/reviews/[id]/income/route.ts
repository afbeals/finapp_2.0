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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id: Number(id) } });
  if (!review || review.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid', details: parsed.error.flatten() }, { status: 400 });

  const entry = await prisma.incomeEntry.create({
    data: { reviewId: Number(id), ...parsed.data },
    include: { member: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
