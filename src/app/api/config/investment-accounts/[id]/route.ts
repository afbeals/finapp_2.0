import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireHouseholdResource, badRequest, conflict } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  type: z.enum(['TAXABLE', 'TRADITIONAL_401K', 'ROTH_401K', 'TRADITIONAL_IRA', 'ROTH_IRA', 'HSA', 'OTHER']).optional(),
  institution: z.string().max(128).optional(),
  ownerMemberId: z.number().int().positive().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const result = await requireHouseholdResource(
    (id) => prisma.investmentAccount.findUnique({ where: { id } }),
    id,
  ).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid request', parsed.error.issues);

  const updated = await prisma.investmentAccount.update({
    where: { id },
    data: parsed.data,
    include: { owner: { select: { id: true, name: true, color: true } } },
  });
  return NextResponse.json({ account: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const result = await requireHouseholdResource(
    (id) => prisma.investmentAccount.findUnique({ where: { id } }),
    id,
  ).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const purchaseCount = await prisma.purchase.count({ where: { accountId: id } });
  const body = await req.json().catch(() => ({}));
  const transferToId: number | undefined = body?.transferToId;
  const force: boolean = body?.force === true;

  if (purchaseCount > 0 && !transferToId && !force) return conflict({ inUse: true, purchaseCount });

  if (purchaseCount > 0 && transferToId) {
    const target = await prisma.investmentAccount.findUnique({ where: { id: transferToId } });
    if (!target || target.householdId !== result.session.householdId)
      return NextResponse.json({ error: 'Transfer target not found' }, { status: 400 });
    await prisma.purchase.updateMany({ where: { accountId: id }, data: { accountId: transferToId } });
  }

  await prisma.investmentAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
