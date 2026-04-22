import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiGuards';

export async function GET(req: NextRequest) {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const categoryId = req.nextUrl.searchParams.get('categoryId');

  const entries = await prisma.expenseEntry.findMany({
    where: {
      review: { householdId: session.householdId },
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    select: { name: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
    take: 10,
  });

  return NextResponse.json({ names: entries.map((e) => e.name) });
}
