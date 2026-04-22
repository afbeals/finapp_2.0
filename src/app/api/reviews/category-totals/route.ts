import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Returns per-category totals across all reviews for the household.
// Used to compute trend badges on the expense entry page.
export async function GET(_req: NextRequest) {
  const session = await getSession();
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

  // Shape: { [reviewId]: { [categoryId]: totalCents } }
  const byReview = reviews.map((r) => {
    const totals: Record<number, number> = {};
    for (const e of r.expenseEntries) {
      totals[e.categoryId] = (totals[e.categoryId] ?? 0) + e.amount;
    }
    return { id: r.id, periodYear: r.periodYear, periodMonth: r.periodMonth, totals };
  });

  return NextResponse.json({ byReview });
}
