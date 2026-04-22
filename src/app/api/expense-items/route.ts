import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const categoryId = req.nextUrl.searchParams.get('categoryId');

  // Fetch distinct names from past expense entries for this household
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

  const names = entries.map((e) => e.name);
  return NextResponse.json({ names });
}
