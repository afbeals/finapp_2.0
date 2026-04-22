import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, badRequest } from '@/lib/apiGuards';

export async function GET() {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await prisma.investmentAccount.findMany({
    where: { householdId: session.householdId },
    include: { owner: { select: { id: true, name: true, color: true } } },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ accounts });
}

const createSchema = z.object({
  name: z.string().min(1).max(128),
  type: z.enum(['TAXABLE', 'TRADITIONAL_401K', 'ROTH_401K', 'TRADITIONAL_IRA', 'ROTH_IRA', 'HSA', 'OTHER']),
  institution: z.string().max(128).default(''),
  ownerMemberId: z.number().int().positive().nullable().default(null),
});

export async function POST(req: NextRequest) {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid request', parsed.error.issues);

  const account = await prisma.investmentAccount.create({
    data: { householdId: session.householdId, ...parsed.data },
    include: { owner: { select: { id: true, name: true, color: true } } },
  });
  return NextResponse.json({ account }, { status: 201 });
}
