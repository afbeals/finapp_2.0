import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireReviewAccess, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [entries, categories] = await Promise.all([
    prisma.expenseEntry.findMany({
      where: { reviewId: Number(id) },
      include: {
        category: true,
        member: { select: { id: true, name: true, color: true } },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.expenseCategory.findMany({
      where: { householdId: result.session.householdId },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return NextResponse.json({ entries, categories });
}

const schema = z.object({
  categoryId: z.number().int().positive(),
  memberId: z.number().int().positive().nullable().optional(),
  name: z.string().min(1),
  notes: z.string().optional(),
  amount: z.number().int().positive(),
  date: z.string(),
});

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid', parsed.error.flatten());

  const entry = await prisma.expenseEntry.create({
    data: {
      reviewId: Number(id),
      categoryId: parsed.data.categoryId,
      memberId: parsed.data.memberId ?? null,
      name: parsed.data.name,
      notes: parsed.data.notes ?? null,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
    },
    include: {
      category: true,
      member: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
