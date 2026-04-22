import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  const entries = await prisma.incomeEntry.findMany({
    where: {
      review: { householdId: session.householdId },
      ...(q ? { name: { contains: q } } : {}),
    },
    select: { name: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
    take: 10,
  });

  return NextResponse.json({ names: entries.map((e) => e.name) });
}
