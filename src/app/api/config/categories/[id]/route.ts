import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireHouseholdResource, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  icon: z.string().max(4).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { resource: existing } = await requireHouseholdResource(
    (id) => prisma.expenseCategory.findUnique({ where: { id } }),
    Number(id),
  ).catch(() => ({ resource: null as ReturnType<typeof prisma.expenseCategory.findUnique> extends Promise<infer T> ? T : never }));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid request');

  const updated = await prisma.expenseCategory.update({ where: { id: Number(id) }, data: parsed.data });
  return NextResponse.json({ category: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireHouseholdResource(
    (id) => prisma.expenseCategory.findUnique({ where: { id } }),
    Number(id),
  ).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.expenseCategory.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
