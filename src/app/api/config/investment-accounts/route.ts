import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });

  const account = await prisma.investmentAccount.create({
    data: {
      householdId: session.householdId,
      name: parsed.data.name,
      type: parsed.data.type,
      institution: parsed.data.institution,
      ownerMemberId: parsed.data.ownerMemberId,
    },
    include: { owner: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json({ account }, { status: 201 });
}
