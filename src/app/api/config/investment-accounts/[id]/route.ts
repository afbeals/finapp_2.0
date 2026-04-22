import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

async function getAccountOrFail(id: number, householdId: number) {
  const account = await prisma.investmentAccount.findUnique({ where: { id } });
  if (!account || account.householdId !== householdId) return null;
  return account;
}

const patchSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  type: z.enum(['TAXABLE', 'TRADITIONAL_401K', 'ROTH_401K', 'TRADITIONAL_IRA', 'ROTH_IRA', 'HSA', 'OTHER']).optional(),
  institution: z.string().max(128).optional(),
  ownerMemberId: z.number().int().positive().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  const account = await getAccountOrFail(id, session.householdId);
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });

  const updated = await prisma.investmentAccount.update({
    where: { id },
    data: parsed.data,
    include: { owner: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json({ account: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  const account = await getAccountOrFail(id, session.householdId);
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const purchaseCount = await prisma.purchase.count({ where: { accountId: id } });

  // If account has purchases, require transferToId
  const body = await req.json().catch(() => ({}));
  const transferToId: number | undefined = body?.transferToId;

  if (purchaseCount > 0 && !transferToId) {
    return NextResponse.json({ inUse: true, purchaseCount }, { status: 409 });
  }

  if (purchaseCount > 0 && transferToId) {
    // Verify transfer target belongs to same household
    const target = await getAccountOrFail(transferToId, session.householdId);
    if (!target) return NextResponse.json({ error: 'Transfer target not found' }, { status: 400 });

    await prisma.purchase.updateMany({
      where: { accountId: id },
      data: { accountId: transferToId },
    });
  }

  await prisma.investmentAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
