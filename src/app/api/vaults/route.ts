import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

const createSchema = z.object({
  name: z.string().min(1).max(128),
  type: z.enum(['FIXED', 'VARIABLE']),
  category: z.string().default(''),
  ownerMemberId: z.number().int().positive().nullable().default(null),
  target: z.number().int().nullable().default(null),
  frequency: z.string().default('MONTHLY'),
  rateMonths: z.number().int().positive().default(1),
  currentBalance: z.number().int().default(0),
  treasuryPct: z.number().default(0),
  sortOrder: z.number().int().default(0),
  description: z.string().max(64).default(''),
  dueMonths: z.string().max(32).default(''),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });

  const vault = await prisma.vault.create({
    data: { householdId: session.householdId, ...parsed.data },
    include: { owner: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json({ vault }, { status: 201 });
}
