import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

async function getCategoryOrFail(id: number, householdId: number) {
  const cat = await prisma.investmentCategory.findUnique({ where: { id } });
  if (!cat || cat.householdId !== householdId) return null;
  return cat;
}

const patchSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  const cat = await getCategoryOrFail(id, session.householdId);
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });

  const updated = await prisma.investmentCategory.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ category: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  const cat = await getCategoryOrFail(id, session.householdId);
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Check if any purchases use this category name
  const purchaseCount = await prisma.purchase.count({
    where: {
      account: { householdId: session.householdId },
      category: cat.name,
    },
  });

  const body = await req.json().catch(() => ({}));
  const transferToName: string | undefined = body?.transferToName;

  if (purchaseCount > 0 && !transferToName) {
    return NextResponse.json({ inUse: true, purchaseCount, categoryName: cat.name }, { status: 409 });
  }

  if (purchaseCount > 0 && transferToName) {
    await prisma.purchase.updateMany({
      where: {
        account: { householdId: session.householdId },
        category: cat.name,
      },
      data: { category: transferToName },
    });
  }

  await prisma.investmentCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
