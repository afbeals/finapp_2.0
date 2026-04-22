import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiGuards';

export async function GET() {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const reviews = await prisma.review.findMany({
    where: { householdId: session.householdId },
    select: {
      id: true,
      periodYear: true,
      periodMonth: true,
      expenseEntries: {
        select: { categoryId: true, amount: true },
      },
    },
    orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
  });

  const byReview = reviews.map((r) => {
    const totals: Record<number, number> = {};
    for (const e of r.expenseEntries) {
      totals[e.categoryId] = (totals[e.categoryId] ?? 0) + e.amount;
    }
    return { id: r.id, periodYear: r.periodYear, periodMonth: r.periodMonth, totals };
  });

  return NextResponse.json({ byReview });
}
