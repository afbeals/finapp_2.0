import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, badRequest } from '@/lib/apiGuards';

export async function GET() {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const categories = await prisma.expenseCategory.findMany({
    where: { householdId: session.householdId },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json({ categories });
}

const createSchema = z.object({
  name: z.string().min(1).max(64),
  icon: z.string().max(4).default('📦'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
});

export async function POST(req: NextRequest) {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid request', parsed.error.issues);

  const max = await prisma.expenseCategory.aggregate({
    where: { householdId: session.householdId },
    _max: { sortOrder: true },
  });

  const category = await prisma.expenseCategory.create({
    data: {
      householdId: session.householdId,
      name: parsed.data.name,
      icon: parsed.data.icon,
      color: parsed.data.color,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json({ category }, { status: 201 });
}
