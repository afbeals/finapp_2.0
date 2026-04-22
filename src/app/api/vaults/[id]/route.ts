import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireHouseholdResource, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const result = await requireHouseholdResource(
    (id) => prisma.vault.findUnique({ where: { id } }),
    id,
  ).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid request', parsed.error.issues);

  const updated = await prisma.vault.update({
    where: { id },
    data: parsed.data,
    include: { owner: { select: { id: true, name: true, color: true } } },
  });
  return NextResponse.json({ vault: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const result = await requireHouseholdResource(
    (id) => prisma.vault.findUnique({ where: { id } }),
    id,
  ).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.vault.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
