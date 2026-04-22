import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const loan = await prisma.loan.findUnique({ where: { id: Number(id) } });
  if (!loan || loan.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const schema = z.object({
    name: z.string().min(1).optional(),
    rate: z.number().min(0).max(1).optional(),
    paidOff: z.boolean().optional(),
    mortgageInsurance: z.number().int().min(0).optional(),
    otherFees: z.number().int().min(0).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const updated = await prisma.loan.update({ where: { id: Number(id) }, data: parsed.data });
  return NextResponse.json({ loan: updated });
}
