import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

async function getVaultOrFail(id: number, householdId: number) {
  const vault = await prisma.vault.findUnique({ where: { id } });
  if (!vault || vault.householdId !== householdId) return null;
  return vault;
}

const patchSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  category: z.string().optional(),
  ownerMemberId: z.number().int().positive().nullable().optional(),
  target: z.number().int().nullable().optional(),
  frequency: z.string().optional(),
  rateMonths: z.number().int().positive().optional(),
  currentBalance: z.number().int().optional(),
  treasuryPct: z.number().optional(),
  sortOrder: z.number().int().optional(),
  description: z.string().max(64).optional(),
  dueMonths: z.string().max(32).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  const vault = await getVaultOrFail(id, session.householdId);
  if (!vault) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });

  const updated = await prisma.vault.update({
    where: { id },
    data: parsed.data,
    include: { owner: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json({ vault: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number(idStr);
  const vault = await getVaultOrFail(id, session.householdId);
  if (!vault) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.vault.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
