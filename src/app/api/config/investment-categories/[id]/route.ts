import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireHouseholdResource, badRequest, conflict } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const result = await requireHouseholdResource(
    (id) => prisma.investmentCategory.findUnique({ where: { id } }),
    id,
  ).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid request', parsed.error.issues);

  const updated = await prisma.investmentCategory.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ category: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const result = await requireHouseholdResource(
    (id) => prisma.investmentCategory.findUnique({ where: { id } }),
    id,
  ).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const cat = result.resource;
  const purchaseCount = await prisma.purchase.count({
    where: { account: { householdId: result.session.householdId }, category: cat.name },
  });

  const body = await req.json().catch(() => ({}));
  const transferToName: string | undefined = body?.transferToName;

  if (purchaseCount > 0 && !transferToName) return conflict({ inUse: true, purchaseCount, categoryName: cat.name });

  if (purchaseCount > 0 && transferToName) {
    await prisma.purchase.updateMany({
      where: { account: { householdId: result.session.householdId }, category: cat.name },
      data: { category: transferToName },
    });
  }

  await prisma.investmentCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
