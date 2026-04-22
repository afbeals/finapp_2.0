import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, badRequest, conflict } from '@/lib/apiGuards';

export async function GET() {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const reviews = await prisma.review.findMany({
    where: { householdId: session.householdId },
    include: {
      steps: true,
      incomeEntries: { select: { amount: true } },
      expenseEntries: { select: { amount: true } },
    },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
  });

  const reviewsWithTotals = reviews.map(({ incomeEntries, expenseEntries, ...r }) => ({
    ...r,
    totalIncome: incomeEntries.reduce((s, e) => s + e.amount, 0),
    totalExpenses: expenseEntries.reduce((s, e) => s + e.amount, 0),
  }));

  return NextResponse.json({ reviews: reviewsWithTotals });
}

const createSchema = z.object({
  periodYear: z.number().int().min(2020).max(2100),
  periodMonth: z.number().int().min(1).max(12),
  type: z.enum(['MONTHLY', 'QUARTERLY']),
});

export async function POST(req: NextRequest) {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid request', parsed.error.flatten());

  const { periodYear, periodMonth, type } = parsed.data;

  const existing = await prisma.review.findFirst({
    where: { householdId: session.householdId, periodYear, periodMonth },
  });
  if (existing) return conflict({ error: 'A review for this month already exists' });

  const monthlySteps = ['expense', 'monthly', 'savings', 'investments', 'vaults', 'finalize'];
  const quarterlySteps = ['expense', 'monthly', 'savings', 'loans', 'investments', 'portfolio', 'vaults', 'finalize'];
  const stepKeys = type === 'QUARTERLY' ? quarterlySteps : monthlySteps;

  const review = await prisma.review.create({
    data: {
      householdId: session.householdId,
      periodYear,
      periodMonth,
      type,
      lastEditorId: session.memberId,
      steps: { create: stepKeys.map((stepKey) => ({ stepKey })) },
    },
    include: { steps: true },
  });

  return NextResponse.json({ review }, { status: 201 });
}
