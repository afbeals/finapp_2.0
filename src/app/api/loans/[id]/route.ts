import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireHouseholdResource, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  rate: z.number().min(0).max(1).optional(),
  paidOff: z.boolean().optional(),
  mortgageInsurance: z.number().int().min(0).optional(),
  otherFees: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireHouseholdResource(
    (id) => prisma.loan.findUnique({ where: { id } }),
    Number(id),
  ).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid');

  const updated = await prisma.loan.update({ where: { id: Number(id) }, data: parsed.data });
  return NextResponse.json({ loan: updated });
}
