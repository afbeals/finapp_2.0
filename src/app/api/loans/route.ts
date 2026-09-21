import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, badRequest } from '@/lib/apiGuards';

const createSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['SCHOOL', 'MORTGAGE', 'AUTO', 'OTHER']).default('OTHER'),
  principal: z.number().int().min(0),
  rate: z.number().min(0).max(1),
  termMonths: z.number().int().min(1),
  startDate: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid', parsed.error.flatten());

  const loan = await prisma.loan.create({
    data: {
      householdId: session.householdId,
      name: parsed.data.name,
      category: parsed.data.category,
      principal: parsed.data.principal,
      rate: parsed.data.rate,
      termMonths: parsed.data.termMonths,
      startDate: new Date(parsed.data.startDate),
    },
  });
  return NextResponse.json({ loan }, { status: 201 });
}
