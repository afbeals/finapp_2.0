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
  propertyTax: z.number().int().min(0).nullable().optional(),
  hoa: z.number().int().min(0).nullable().optional(),
  homeownersInsurance: z.number().int().min(0).nullable().optional(),
  homeValue: z.number().int().min(0).nullable().optional(),
  pmiDropBalance: z.number().int().min(0).nullable().optional(),
  // Steady fields that were previously not patchable
  principal: z.number().int().min(0).optional(),
  termMonths: z.number().int().min(1).optional(),
  startDate: z.string().optional(),
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

  const data: Record<string, unknown> = { ...parsed.data };
  if (typeof parsed.data.startDate === 'string') {
    data.startDate = new Date(parsed.data.startDate);
  }

  const updated = await prisma.loan.update({ where: { id: Number(id) }, data });
  return NextResponse.json({ loan: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireHouseholdResource(
    (id) => prisma.loan.findUnique({ where: { id } }),
    Number(id),
  ).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.loan.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
