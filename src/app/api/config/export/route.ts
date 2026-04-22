import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiGuards';

export async function GET() {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [reviews, categories, members] = await Promise.all([
    prisma.review.findMany({
      where: { householdId: session.householdId },
      include: {
        steps: true,
        incomeEntries: true,
        expenseEntries: true,
        savingsSnapshots: true,
        loanSnapshots: true,
        holdingSnapshots: true,
        vaultSnapshots: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.expenseCategory.findMany({
      where: { householdId: session.householdId },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.member.findMany({
      where: { householdId: session.householdId },
      select: { id: true, name: true, color: true, email: true },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    householdId: session.householdId,
    members,
    categories,
    reviews,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="financial-review-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
